// ============================================================
// CIERRE DE SESIÓN POR INACTIVIDAD (v7.4 — 23-09-2026)
// - Si el usuario pasa 15 MINUTOS sin actividad (clics, teclas,
//   mouse, scroll, touch), la sesión se cierra automáticamente:
//     1) Se invalida el token en el servidor (/api/auth/logout)
//     2) Se limpia el localStorage
//     3) Se muestra una ventana emergente BLOQUEANTE informando
//        el cierre, con botón para ir al login
// - Solo actúa si hay sesión iniciada (token presente).
// - La actividad se comparte entre pestañas vía localStorage:
//   mover el mouse en una pestaña reinicia el contador en todas.
// - 100% frontend: no toca backend ni base de datos.
// ============================================================
(function () {
    'use strict';

    const LIMITE_MS = 15 * 60 * 1000;   // 15 minutos
    const REVISION_MS = 15 * 1000;      // revisar cada 15 segundos
    const LLAVE_TS = 'si_ultima_actividad';

    let cerrada = false;                // una vez cerrada, la actividad no revive la sesión
    let ultimoRegistro = 0;             // throttle del registro de actividad

    function haySesion() {
        return !!localStorage.getItem('token');
    }

    function registrarActividad() {
        if (cerrada || !haySesion()) return;
        const ahora = Date.now();
        // Throttle: escribir en localStorage máximo 1 vez por segundo
        if (ahora - ultimoRegistro < 1000) return;
        ultimoRegistro = ahora;
        try { localStorage.setItem(LLAVE_TS, String(ahora)); } catch (e) { /* sin espacio */ }
    }

    function ultimaActividad() {
        const ts = parseInt(localStorage.getItem(LLAVE_TS) || '0', 10);
        return isNaN(ts) ? 0 : ts;
    }

    // ---------- Eventos que cuentan como "movimiento" ----------
    ['click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'wheel'].forEach(function (ev) {
        window.addEventListener(ev, registrarActividad, { passive: true, capture: true });
    });

    // ---------- Cierre de sesión ----------
    function cerrarSesionPorInactividad() {
        if (cerrada) return;
        cerrada = true;

        // 1) Invalidar el token en el servidor (mismo criterio que cerrarSesion() de panel.js)
        const t = localStorage.getItem('token');
        if (t) {
            try {
                fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + t },
                    keepalive: true
                }).catch(function () {});
            } catch (e) { /* offline: no importa, el token ya no estará en el navegador */ }
        }

        // 2) Limpiar la sesión local
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('user');
        localStorage.removeItem('tienda_usuario');
        localStorage.removeItem(LLAVE_TS);

        // 3) Ventana emergente bloqueante informando el cierre
        mostrarAvisoInactividad();
    }

    function irAlLogin() {
        window.location.href = '/';
    }

    function mostrarAvisoInactividad() {
        const TITULO = 'Sesión cerrada por inactividad';
        const MENSAJE = 'Tu sesión se cerró automáticamente por permanecer 15 minutos sin actividad.\nPor seguridad, debes iniciar sesión nuevamente.';

        // Preferir el modal corporativo del panel si está disponible (mismo estilo del sistema)
        if (typeof window.mostrarModalCorporativo === 'function' && document.getElementById('modal-corporativo')) {
            window.mostrarModalCorporativo(TITULO, MENSAJE, 'warning', [
                {
                    texto: 'Ir al inicio de sesión',
                    estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #1a3a5c, #2c5282); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                    accion: irAlLogin
                }
            ]);
            // Blindaje: si el usuario cierra el modal por otra vía (tecla ESC, etc.), igual va al login
            setTimeout(function vigilar() {
                const m = document.getElementById('modal-corporativo');
                if (cerrada && m && m.style.display !== 'flex') { irAlLogin(); return; }
                if (cerrada) setTimeout(vigilar, 1000);
            }, 1000);
            return;
        }

        // Fallback autocontenido (estadisticas.html u otras páginas sin el modal corporativo)
        if (document.getElementById('si-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'si-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:inherit;';
        overlay.innerHTML =
            '<div style="background:#fff; border-radius:16px; padding:32px; max-width:420px; width:90%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.35);">' +
                '<div style="width:64px; height:64px; margin:0 auto 16px; border-radius:50%; background:#fff3e0; color:#ed8936; font-size:32px; display:flex; align-items:center; justify-content:center;">⚠️</div>' +
                '<h2 style="margin:0 0 12px; color:#1a3a5c; font-size:1.25rem;">' + TITULO + '</h2>' +
                '<p style="margin:0 0 24px; color:#4a5568; font-size:0.95rem; line-height:1.5;">' + MENSAJE.replace(/\n/g, '<br>') + '</p>' +
                '<button id="si-btn-login" style="padding:10px 24px; background:linear-gradient(135deg,#1a3a5c,#2c5282); color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.95rem; font-weight:600;">Ir al inicio de sesión</button>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('si-btn-login').addEventListener('click', irAlLogin);
        // Bloqueante: no se cierra con clic fuera ni con ESC
        overlay.addEventListener('click', function (e) { e.stopPropagation(); }, true);
        window.addEventListener('keydown', function bloqueo(e) {
            if (cerrada) { e.preventDefault(); e.stopPropagation(); }
        }, true);
    }

    // ---------- Bucle de revisión ----------
    function iniciar() {
        if (!haySesion()) return;   // sin sesión (pantalla de login): no hacer nada
        if (!ultimaActividad()) registrarActividad();   // primera vez: arranca el reloj
        setInterval(function () {
            if (cerrada || !haySesion()) return;
            const inactivoPor = Date.now() - ultimaActividad();
            if (inactivoPor >= LIMITE_MS) cerrarSesionPorInactividad();
        }, REVISION_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
