// ============================================================
// CIERRE DE SESIÓN POR INACTIVIDAD (v7.4.2 — FIX congelamiento)
// - Si el usuario pasa 15 MINUTOS sin actividad (clics, teclas,
//   mouse, scroll, touch), la sesión se cierra automáticamente:
//     1) Se invalida el token en el servidor (/api/auth/logout)
//     2) Se limpia el localStorage
//     3) Se muestra una ventana emergente BLOQUEANTE informando
//        el cierre, con botón para ir al login
// - FIX v7.4.2 (el bueno): el overlay ya NO intercepta los clicks
//   en fase CAPTURE con stopPropagation() — eso mataba el click del
//   botón "Ir al inicio de sesión" (la página se veía pero no
//   respondía = "congelada"). Ahora el botón recibe su click normal.
// ============================================================
(function () {
    'use strict';

    const LIMITE_MS = 15 * 60 * 1000;   // 15 minutos
    const REVISION_MS = 15 * 1000;      // revisar cada 15 segundos
    const LLAVE_TS = 'si_ultima_actividad';

    let cerrada = false;                // una vez cerrada, la actividad no revive la sesión
    let ultimoRegistro = 0;             // throttle del registro de actividad

    function haySesion() {
        // v9.7 — la sesión real la manda la cookie httpOnly; la bandera
        // solo indica que esta pestaña vio un login (dato no sensible).
        return localStorage.getItem('sesion_activa') === '1';
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

        // 1) Invalidar la sesión en el servidor — la cookie httpOnly
        //    autentica la petición y el servidor limpia la cookie a su vez.
        try {
            fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(function () {});
        } catch (e) { /* offline: no importa, la cookie expirará */ }

        // 2) Limpiar la sesión local (solo datos no sensibles)
        localStorage.removeItem('sesion_activa');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('user');
        localStorage.removeItem('tienda_usuario');
        localStorage.removeItem(LLAVE_TS);

        // 3) Ventana emergente bloqueante informando el cierre
        mostrarAvisoInactividad();
    }

    function irAlLogin() {
        // replace(): el botón "atrás" del navegador NO vuelve a la sesión ya cerrada
        window.location.replace('/');
    }

    function mostrarAvisoInactividad() {
        const TITULO = 'Sesión cerrada por inactividad';
        const MENSAJE = 'Tu sesión se cerró automáticamente por permanecer 15 minutos sin actividad.\nPor seguridad, debes iniciar sesión nuevamente.';

        // Overlay propio SIEMPRE (no depender de mostrarModalCorporativo de panel.js:
        // en panel.js esa función NO está definida y si el archivo que la define
        // falla, el aviso quedaría roto). El botón se conecta directo aquí.
        if (document.getElementById('si-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'si-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:inherit;';
        overlay.innerHTML =
            '<div style="background:#fff; border-radius:16px; padding:32px; max-width:420px; width:90%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.35);">' +
                '<div style="width:64px; height:64px; margin:0 auto 16px; border-radius:50%; background:#fff3e0; color:#ed8936; font-size:32px; display:flex; align-items:center; justify-content:center;">⚠️</div>' +
                '<h2 style="margin:0 0 12px; color:#1a3a5c; font-size:1.25rem;">' + TITULO + '</h2>' +
                '<p style="margin:0 0 24px; color:#4a5568; font-size:0.95rem; line-height:1.5;">' + MENSAJE.replace(/\n/g, '<br>') + '</p>' +
                '<button id="si-btn-login" type="button" style="padding:10px 24px; background:linear-gradient(135deg,#1a3a5c,#2c5282); color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.95rem; font-weight:600;">Ir al inicio de sesión</button>' +
            '</div>';
        document.body.appendChild(overlay);

        // El botón es un hijo del overlay: su click NO se detiene porque
        // YA NO hay listener en fase capture con stopPropagation (FIX v7.4.2).
        const btn = document.getElementById('si-btn-login');
        btn.addEventListener('click', irAlLogin);
        btn.addEventListener('touchstart', irAlLogin, { passive: true });

        // Bloqueante solo con teclado: no se cierra con ESC ni con teclas.
        // (Sin interceptar clicks: eso era lo que congelaba el botón.)
        window.addEventListener('keydown', function bloqueo(e) {
            if (!cerrada) return;
            e.preventDefault();
            e.stopPropagation();
        }, true);

        // Blindaje extra: si por cualquier razón el overlay desaparece
        // (otro script lo elimina), redirigir al login igual.
        setTimeout(function vigilar() {
            if (!cerrada) return;
            if (!document.getElementById('si-overlay')) { irAlLogin(); return; }
            setTimeout(vigilar, 1000);
        }, 1000);
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
