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

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showAlert('Por favor complete todos los campos', 'error');
            return;
        }

        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.innerHTML = '<span>Ingresando...</span>';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
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
            } else {
                // Construir mensaje de error completo incluyendo IP detectada
                let mensajeError = data.error || data.message || 'Credenciales incorrectas';

                // Si hay detalle adicional del backend (IP no autorizada, etc.)
                if (data.detalle) {
                    mensajeError += '\n' + data.detalle;
                }

                // Mostrar IP detectada si viene del backend
                if (data.ip_detectada) {
                    mensajeError += '\n\nIP detectada: ' + data.ip_detectada;
                }

                showAlert(mensajeError, 'error');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            showAlert('Error de conexión con el servidor', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `
                <span>Ingresar al Sistema</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            `;
        }
    });

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