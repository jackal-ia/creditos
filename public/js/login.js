/**
 * Sistema de Créditos IPSFA - Login
 * Configuración de partículas corregida y optimizada con red abundante
 */

document.addEventListener('DOMContentLoaded', async function() {
    
    // ============================================================
    // 1. INICIALIZAR PARTÍCULAS (Configuración Estelar Abundante)
    // ============================================================
    try {
        if (typeof tsParticles !== 'undefined') {
            await tsParticles.load("tsparticles", {
                fpsLimit: 60,
                background: { color: { value: "transparent" } },
                interactivity: {
                    events: { 
                        onHover: { 
                            enable: true, 
                            mode: "grab" // Las líneas se conectan elásticamente al pasar el cursor
                        } 
                    },
                    modes: { 
                        grab: {
                            distance: 140,
                            links: { opacity: 0.4 }
                        }
                    }
                },
                particles: {
                    color: { value: "#38bdf8" },
                    links: { 
                        enable: true, 
                        distance: 95,       // Distancia ampliada para entrelazar múltiples nodos
                        color: "#38bdf8", 
                        opacity: 0.22,      // Visibilidad ajustada para una red densa y elegante
                        width: 1.2 
                    },
                    move: { 
                        enable: true, 
                        speed: 0.4,         // Velocidad suave y uniforme
                        direction: "none", 
                        random: true, 
                        straight: false, 
                        outModes: "bounce" 
                    },
                    number: { 
                        value: 160,         // Volumen idóneo para saturar líneas sin sobrecargar el diseño
                        density: { enable: false } 
                    },
                    opacity: { value: { min: 0.2, max: 0.7 } }, 
                    size: { value: { min: 2.5, max: 4.5 } }     // Tamaño aumentado y bien definido
                }
            });
        }
    } catch (error) {
        console.error('❌ Error al cargar partículas:', error);
    }

    // ============================================================
    // 2. CONFIGURAR FORMULARIO DE AUTENTICACIÓN
    // ============================================================
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const alertBox = document.getElementById('loginAlert');

    // v9.5 — flujo 2FA: si el login responde mfa_requerido, se pide el
    // código TOTP y se verifica en /auth/mfa-verify con el preauth.
    let preauthMfa = null;

    function mostrarMfaUI() {
        document.querySelectorAll('#loginForm .input-group').forEach(function (el) {
            if (el.id !== 'mfa-group') el.style.display = 'none';
        });
        if (!document.getElementById('mfa-group')) {
            const div = document.createElement('div');
            div.className = 'input-group';
            div.id = 'mfa-group';
            div.innerHTML = '<label for="mfa-codigo">Código de verificación (app authenticator)</label>' +
                '<div class="input-wrapper"><i class="fa-solid fa-shield-halved field-icon"></i>' +
                '<input type="text" id="mfa-codigo" maxlength="6" inputmode="numeric" placeholder="123456" autocomplete="one-time-code"></div>';
            form.insertBefore(div, document.getElementById('btn-login'));
        }
        document.querySelector('#btn-login span').textContent = 'Verificar e ingresar';
        showAlert('Esta cuenta tiene 2FA. Ingresa el código de 6 dígitos de tu app.', 'success');
        setTimeout(function () { document.getElementById('mfa-codigo').focus(); }, 100);
    }

    function procesarLoginOk(data) {
        // v9.7 — FASE 2: el token VIVE SOLO en la cookie httpOnly (el servidor
        // ya la fijó). El frontend guarda solo datos no sensibles + bandera.
        localStorage.removeItem('token');
        localStorage.setItem('sesion_activa', '1');
                localStorage.setItem('token', data.token);
                // Extraer rol del token JWT si no viene en data.usuario
let userData = data.usuario || data.user || {}; // FIX v6.1: backend devuelve "usuario"
if (!userData.rol && data.token) {
    try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        userData.rol = payload.rol || payload.role || 'operador';
    } catch (e) {
        console.warn('No se pudo extraer rol del token:', e);
    }
}
localStorage.setItem('usuario', JSON.stringify(userData));
                // Guardar tienda separadamente para fácil acceso
                if (userData.tienda) {
                    localStorage.setItem('tienda_usuario', userData.tienda);
                }
              showAlert('¡Inicio de sesión exitoso!', 'success');
                setTimeout(() => {
                    window.location.href = 'panel';
                }, 1000);

    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Ingresando...';

        // Fase 2: verificación del código MFA
        if (preauthMfa) {
            const codigo = (document.getElementById('mfa-codigo').value || '').trim().replace(/\s/g, '');
            if (!/^\d{6}$/.test(codigo)) {
                showAlert('Ingresa el código de 6 dígitos', 'error');
                btn.disabled = false;
                return;
            }
            try {
                const response = await fetch('/api/auth/mfa-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preauth: preauthMfa, codigo })
                });
                const data = await response.json();
                if (response.ok) {
                    preauthMfa = null;
                    procesarLoginOk(data);
                } else {
                    showAlert(data.error || 'Código incorrecto', 'error');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                showAlert('Error de conexión con el servidor', 'error');
            } finally {
                btn.disabled = false;
                if (!preauthMfa) restaurarBoton(btn);
            }
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showAlert('Por favor complete todos los campos', 'error');
            btn.disabled = false;
            restaurarBoton(btn);
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.mfa_requerido) {
                preauthMfa = data.preauth;
                btn.disabled = false;
                mostrarMfaUI();
                return;
            }

            if (response.ok) {
                procesarLoginOk(data);
                return;
            }

            let mensajeError = data.error || data.message || 'Credenciales incorrectas';
            if (data.detalle) { mensajeError += '\n' + data.detalle; }
            if (data.ip_detectada) { mensajeError += '\n\nIP detectada: ' + data.ip_detectada; }
            showAlert(mensajeError, 'error');
        } catch (error) {
            console.error('Error de conexión:', error);
            showAlert('Error de conexión con el servidor', 'error');
        } finally {
            btn.disabled = false;
            if (!preauthMfa) restaurarBoton(btn);
        }
    });

    function restaurarBoton(btn) {
        btn.innerHTML = '<span>Ingresar al Sistema</span>' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="5" y1="12" x2="19" y2="12"/>' +
            '<polyline points="12 5 19 12 12 19"/></svg>';
    }

    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // v9.8 — Recuperación de contraseña: pide el correo y el servidor envía
    // el enlace real (respuesta genérica, sin revelar si el email existe).
    window.mostrarRecuperacion = function (e) {
        if (e) e.preventDefault();
        const box = document.getElementById('recuperarBox');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if (box.style.display === 'block') document.getElementById('rec-email').focus();
    };
    window.enviarRecuperacion = async function () {
        const email = (document.getElementById('rec-email').value || '').trim();
        const msg = document.getElementById('rec-msg');
        const btn = document.getElementById('rec-btn');
        msg.style.display = 'none';
        if (!email) { msg.textContent = 'Escribe tu correo.'; msg.style.cssText += 'background:#fff5f5;border:1px solid #fc8181;color:#c53030;'; msg.style.display = 'block'; return; }
        btn.disabled = true; btn.textContent = 'Enviando…';
        try {
            const r = await fetch('/api/usuarios/recuperar-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await r.json().catch(() => ({}));
            msg.textContent = data.message || 'Si el email existe, se han enviado instrucciones.';
            msg.style.cssText += 'background:#f0fff4;border:1px solid #9ae6b4;color:#276749;';
        } catch (e2) {
            msg.textContent = 'Error de conexión. Intenta de nuevo.';
            msg.style.cssText += 'background:#fff5f5;border:1px solid #fc8181;color:#c53030;';
        }
        msg.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Enviar';
    };

    function showAlert(message, type = 'error') {
        alertBox.className = `alert ${type}`;
        // Soportar saltos de línea en el mensaje
        alertBox.innerHTML = message.replace(/\n/g, '<br>');
        alertBox.style.display = 'block';
        
        const timeout = type === 'success' ? 3000 : 5000;
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, timeout);
    }
});