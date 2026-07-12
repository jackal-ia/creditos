// ============================================
// VARIABLES GLOBALES
// ============================================
const token = localStorage.getItem('token');
let usuario = {};
try {
    let usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw || usuarioRaw === 'undefined' || usuarioRaw === 'null') {
        usuarioRaw = localStorage.getItem('user');
    }
    if (usuarioRaw && usuarioRaw !== 'undefined' && usuarioRaw !== 'null') {
        usuario = JSON.parse(usuarioRaw);
    }
    console.log('[DEBUG] Usuario cargado:', usuario);
    console.log('[DEBUG] Rol detectado:', usuario.rol);
} catch (e) {
    console.warn('Error parseando usuario de localStorage:', e);
    usuario = {};
}
let usuariosData = [];
let usuarioEditando = null;
let chartEvolucion = null;
let chartDistribucion = null;

// ============================================
// AUTENTICACION
// ============================================
if (!token && !window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
    window.location.href = '/';
}

document.getElementById('userName').textContent = usuario.nombre || 'Usuario';
document.getElementById('userRole').textContent = (usuario.rol || 'operador').charAt(0).toUpperCase() + (usuario.rol || 'operador').slice(1);
document.getElementById('userInitials').textContent = (usuario.nombre || 'U').charAt(0).toUpperCase();

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ============================================
// SIDEBAR
// ============================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function mostrarSeccion(seccion) {
    document.querySelectorAll('.content-area').forEach(el => el.classList.add('hidden'));
    const contentId = 'content' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
    const content = document.getElementById(contentId);
    if (content) content.classList.remove('hidden');

    const titulos = {
        'dashboard': 'Dashboard',
        'clientes': 'Tienda Caracas',
        'creditos': 'Tienda Maracay',
        'pagos': 'Tienda Maracaibo',
        'reportes': 'Reportes',
        'tasas': 'Tasas BCV',
        'usuarios': 'Gestion de Usuarios',
        'perfil': 'Mi Perfil',
        'estadisticas': 'Estadisticas'
    };

    const subtitulos = {
        'dashboard': 'Resumen general del sistema',
        'clientes': 'Gestion de clientes y creditos',
        'creditos': 'Gestion de tienda Maracay',
        'pagos': 'Gestion de tienda Maracaibo',
        'reportes': 'Reportes y estadisticas',
        'tasas': 'Consulta de tasas del Banco Central de Venezuela',
        'usuarios': 'Administracion de usuarios del sistema',
        'perfil': 'Gestion de tu cuenta y seguridad',
        'estadisticas': 'Analisis de cuotas, pagos y deudores'
    };

    document.getElementById('pageTitle').textContent = titulos[seccion] || seccion;
    document.getElementById('pageSubtitle').textContent = subtitulos[seccion] || 'Sistema de Gestion Financiera';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) navItem.classList.add('active');
    }

    if (seccion === 'clientes') {
        const menu = document.getElementById('tc-menu-principal');
        const baseDatos = document.getElementById('tc-base-datos');
        const conciliaciones = document.getElementById('tc-conciliaciones');
        if (menu) menu.style.display = 'grid';
        if (baseDatos) baseDatos.style.display = 'none';
        if (conciliaciones) conciliaciones.style.display = 'none';
    }

    if (seccion === 'tasas') cargarHistorial();
    if (seccion === 'usuarios') {
        cargarUsuarios();
        cargarEstadisticasUsuarios();
    }
    if (seccion === 'perfil') cargarPerfil();
    if (seccion === 'estadisticas') initEstadisticas();
}

// ============================================
// RELOJ
// ============================================
function actualizarReloj() {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    document.getElementById('clockTime').textContent = horas + ':' + minutos + ':' + segundos;
    document.getElementById('relojBig').textContent = horas + ':' + minutos;

    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const diaSemana = dias[ahora.getDay()];
    const dia = ahora.getDate();
    const mes = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();

    const fechaTexto = diaSemana + ', ' + dia + ' de ' + mes + ' ' + anio;
    document.getElementById('clockDate').textContent = fechaTexto;
    document.getElementById('relojDate').textContent = fechaTexto;

    document.querySelectorAll('.dia-item').forEach((el, index) => {
        el.classList.toggle('active', index === ahora.getDay());
    });
}

setInterval(actualizarReloj, 1000);
actualizarReloj();

// ============================================
// TASA BCV
// ============================================
async function cargarTasaActual() {
    try {
        const response = await fetch('/api/bcv/actual', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();

        if (data.exito && data.tasa) {
            const tasa = data.tasa;
            document.getElementById('tasaActual').textContent = tasa.current.usd.toFixed(4) + ' Bs';
            document.getElementById('tasaFecha').textContent = 'Fecha: ' + tasa.current.date;
            document.getElementById('tasaAnterior').textContent = tasa.previous.usd.toFixed(4) + ' Bs';

            const variacion = tasa.changePercentage.usd;
            const variacionEl = document.getElementById('tasaVariacion');
            variacionEl.textContent = (variacion >= 0 ? '+' : '') + variacion.toFixed(2) + '%';
            variacionEl.style.color = variacion >= 0 ? '#48bb78' : '#e53e3e';

            document.getElementById('tasaEUR').textContent = tasa.current.eur.toFixed(4) + ' Bs';
        }
    } catch (err) {
        console.error('Error cargando tasa:', err);
        document.getElementById('tasaActual').textContent = 'Error';
    }
}

function consultarTasaFecha() {
    document.getElementById('modalFecha').classList.add('active');
    document.getElementById('modalFechaInput').value = new Date().toISOString().split('T')[0];
}

function cerrarModalFecha() {
    document.getElementById('modalFecha').classList.remove('active');
    document.getElementById('modalResultado').classList.remove('active');
    document.getElementById('modalResultado').innerHTML = '';
}

async function buscarTasaModal() {
    const fecha = document.getElementById('modalFechaInput').value;
    if (!fecha) return;
    try {
        const response = await fetch('/api/bcv/fecha/' + fecha, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        const resultado = document.getElementById('modalResultado');
        if (data.exito) {
            resultado.innerHTML = '<div style="text-align:center;padding:16px;"><div style="font-size:24px;font-weight:700;color:#48bb78;margin-bottom:8px;">' + data.tasa.usd.toFixed(4) + ' Bs/USD</div><div style="font-size:18px;color:#667eea;margin-bottom:8px;">' + data.tasa.eur.toFixed(4) + ' Bs/EUR</div><div style="font-size:13px;color:#718096;">Fecha: ' + data.tasa.date + '</div></div>';
        } else {
            resultado.innerHTML = '<div style="text-align:center;color:#e53e3e;padding:16px;">' + (data.error || 'No se encontro tasa para esa fecha') + '</div>';
        }
        resultado.classList.add('active');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function cargarHistorial() {
    try {
        const anio = new Date().getFullYear();
        const response = await fetch('/api/bcv/historial/' + anio, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        if (data.exito && data.historial) {
            const tbody = document.querySelector('#tablaHistorial tbody');
            tbody.innerHTML = data.historial.slice(0, 30).map((item, index, arr) => {
                const prev = arr[index + 1];
                let variacion = '-';
                if (prev) {
                    const diff = ((item.usd - prev.usd) / prev.usd * 100).toFixed(2);
                    variacion = (diff >= 0 ? '+' : '') + diff + '%';
                }
                return '<tr><td>' + item.date + '</td><td style="font-weight:600;">' + item.usd.toFixed(4) + '</td><td>' + item.eur.toFixed(4) + '</td><td style="color:' + (variacion.includes('+') ? '#48bb78' : '#e53e3e') + '">' + variacion + '</td></tr>';
            }).join('');
        }
    } catch (err) {
        console.error('Error cargando historial:', err);
    }
}

function consultarTasa() {
    const fecha = document.getElementById('fechaConsulta').value;
    if (!fecha) { alert('Selecciona una fecha'); return; }
    buscarTasaPorFecha(fecha);
}

async function buscarTasaPorFecha(fecha) {
    try {
        const response = await fetch('/api/bcv/fecha/' + fecha, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        const resultado = document.getElementById('resultadoTasa');
        if (data.exito) {
            document.getElementById('resultadoFecha').textContent = data.tasa.date;
            document.getElementById('resultadoUSD').textContent = data.tasa.usd.toFixed(4) + ' Bs';
            document.getElementById('resultadoEUR').textContent = data.tasa.eur.toFixed(4) + ' Bs';
            resultado.style.display = 'block';
        } else {
            alert(data.error || 'No se encontro tasa para esa fecha');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

function verHistorial() {
    mostrarSeccion('tasas');
}

// ============================================
// MODULO USUARIOS
// ============================================
async function cargarEstadisticasUsuarios() {
    try {
        const response = await fetch('/api/usuarios/estadisticas/resumen', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        if (data.exito) {
            document.getElementById('statTotal').textContent = data.estadisticas.total;
            document.getElementById('statActivos').textContent = data.estadisticas.activos;
            document.getElementById('statInactivos').textContent = data.estadisticas.inactivos;
            document.getElementById('statAdmins').textContent = data.estadisticas.administradores;
            if (data.estadisticas.operadores_sin_ip > 0) {
                mostrarAlerta(data.estadisticas.operadores_sin_ip + ' operador(es) sin IP asignada.', 'warning');
            }
        }
    } catch (err) {
        console.error('Error cargando estadisticas:', err);
    }
}

async function cargarUsuarios() {
    try {
        const busqueda = document.getElementById('buscarUsuario')?.value || '';
        const rol = document.getElementById('filtroRol')?.value || '';
        const estado = document.getElementById('filtroEstado')?.value || '';
        let url = '/api/usuarios?';
        if (busqueda) url += 'busqueda=' + encodeURIComponent(busqueda) + '&';
        if (rol) url += 'rol=' + encodeURIComponent(rol) + '&';
        if (estado !== '') url += 'activo=' + encodeURIComponent(estado) + '&';
        const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await response.json();
        if (data.exito) {
            usuariosData = data.usuarios;
            renderizarUsuarios();
        } else {
            mostrarAlerta(data.error || 'Error al cargar usuarios', 'error');
        }
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        mostrarAlerta('Error al cargar usuarios', 'error');
    }
}

function renderizarUsuarios() {
    const tbody = document.querySelector('#tablaUsuarios tbody');
    const empty = document.getElementById('tablaUsuariosEmpty');
    if (usuariosData.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = usuariosData.map(u => {
        const badgeRol = u.rol === 'administrador' ? 'badge-admin' : 'badge-operador';
        const badgeEstado = u.activo ? 'badge-activo' : 'badge-inactivo';
        const estadoTexto = u.activo ? 'Activo' : 'Inactivo';
        let ipBadge;
        if (u.rol === 'operador') {
            ipBadge = u.ip_asignada ? '<span class="ip-badge restringida">' + u.ip_asignada + '</span>' : '<span class="ip-badge alerta">Sin IP</span>';
        } else {
            ipBadge = u.ip_asignada ? '<span class="ip-badge restringida">' + u.ip_asignada + '</span>' : '<span class="ip-badge libre">Libre</span>';
        }
        return '<tr>' +
            '<td data-label="ID">' + u.id + '</td>' +
            '<td data-label="Nombre"><strong>' + u.nombre + '</strong><br>' + ipBadge + '</td>' +
            '<td data-label="Email">' + u.email + '</td>' +
            '<td data-label="Rol"><span class="badge ' + badgeRol + '">' + u.rol + '</span></td>' +
            '<td data-label="Estado"><span class="badge ' + badgeEstado + '">' + estadoTexto + '</span></td>' +
            '<td data-label="Creado">' + u.fecha_creacion + '</td>' +
            '<td data-label="Acciones">' +
                '<button class="btn-icon btn-edit" onclick="editarUsuario(' + u.id + ')" title="Editar">&#9998;</button>' +
                '<button class="btn-icon btn-audit" onclick="verAuditoria(' + u.id + ')" title="Auditoria">&#128196;</button>' +
                (u.activo 
                    ? '<button class="btn-icon btn-delete" onclick="confirmarEliminar(' + u.id + ', \'' + u.nombre + '\')" title="Desactivar">&#128465;</button>'
                    : '<button class="btn-icon btn-reactivate" onclick="confirmarReactivar(' + u.id + ', \'' + u.nombre + '\')" title="Reactivar">&#9851;</button>'
                ) +
            '</td>' +
        '</tr>';
    }).join('');
}

function filtrarUsuarios() {
    cargarUsuarios();
}

function abrirModalUsuario() {
    usuarioEditando = null;
    document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo Usuario';
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioNombre').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioPassword').value = '';
    document.getElementById('usuarioRol').value = 'operador';
    document.getElementById('usuarioIp').value = '';
    document.getElementById('usuarioIp').required = true;
    document.getElementById('ipLabel').innerHTML = 'IP Asignada <span style="color:#e53e3e;">*</span>';
    document.getElementById('ipHelp').textContent = 'Obligatorio para operadores';
    document.getElementById('grupoPassword').style.display = 'block';
    document.getElementById('grupoEstado').style.display = 'none';
    document.getElementById('grupoIp').style.display = 'block';
    document.getElementById('btnGuardarUsuario').textContent = 'Guardar Usuario';
    document.getElementById('modalUsuario').classList.add('active');
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').classList.remove('active');
    usuarioEditando = null;
}

document.getElementById('usuarioRol')?.addEventListener('change', function() {
    const rol = this.value;
    const ipInput = document.getElementById('usuarioIp');
    const ipLabel = document.getElementById('ipLabel');
    const ipHelp = document.getElementById('ipHelp');
    if (rol === 'operador') {
        ipInput.required = true;
        ipLabel.innerHTML = 'IP Asignada <span style="color:#e53e3e;">*</span>';
        ipHelp.textContent = 'Obligatorio para operadores';
        ipHelp.style.color = '#e53e3e';
    } else {
        ipInput.required = false;
        ipLabel.innerHTML = 'IP Asignada <span style="font-weight:400;color:#a0aec0;font-size:12px;">(opcional)</span>';
        ipHelp.textContent = 'Opcional para administradores';
        ipHelp.style.color = '#718096';
    }
});

async function editarUsuario(id) {
    try {
        const response = await fetch('/api/usuarios/' + id, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        if (data.exito) {
            usuarioEditando = id;
            document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuario';
            document.getElementById('usuarioId').value = data.usuario.id;
            document.getElementById('usuarioNombre').value = data.usuario.nombre;
            document.getElementById('usuarioEmail').value = data.usuario.email;
            document.getElementById('usuarioRol').value = data.usuario.rol;
            document.getElementById('usuarioActivo').value = data.usuario.activo ? 'true' : 'false';
            document.getElementById('usuarioIp').value = data.usuario.ip_asignada || '';
            const rol = data.usuario.rol;
            const ipInput = document.getElementById('usuarioIp');
            const ipLabel = document.getElementById('ipLabel');
            const ipHelp = document.getElementById('ipHelp');
            if (rol === 'operador') {
                ipInput.required = true;
                ipLabel.innerHTML = 'IP Asignada <span style="color:#e53e3e;">*</span>';
                ipHelp.textContent = 'Obligatorio para operadores';
                ipHelp.style.color = '#e53e3e';
            } else {
                ipInput.required = false;
                ipLabel.innerHTML = 'IP Asignada <span style="font-weight:400;color:#a0aec0;font-size:12px;">(opcional)</span>';
                ipHelp.textContent = 'Opcional para administradores';
                ipHelp.style.color = '#718096';
            }
            document.getElementById('grupoPassword').style.display = 'none';
            document.getElementById('grupoEstado').style.display = 'block';
            document.getElementById('grupoIp').style.display = 'block';
            document.getElementById('btnGuardarUsuario').textContent = 'Actualizar Usuario';
            document.getElementById('modalUsuario').classList.add('active');
        }
    } catch (err) {
        console.error('Error:', err);
        mostrarAlerta('Error al cargar usuario', 'error');
    }
}

async function guardarUsuario(event) {
    event.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('usuarioNombre').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const activo = document.getElementById('usuarioActivo').value;
    const ip_asignada = document.getElementById('usuarioIp').value.trim();

    if (rol === 'operador' && !ip_asignada) {
        mostrarAlerta('La IP asignada es obligatoria para operadores', 'error');
        document.getElementById('usuarioIp').focus();
        return;
    }
    if (!nombre || !email) {
        mostrarAlerta('Nombre y email son obligatorios', 'error');
        return;
    }

    const datos = { nombre, email, rol };
    if (password) datos.password = password;
    if (id) datos.activo = activo === 'true';
    if (ip_asignada) datos.ip_asignada = ip_asignada;
    if (rol === 'administrador' && !ip_asignada) datos.ip_asignada = null;

    try {
        const url = id ? '/api/usuarios/' + id : '/api/usuarios';
        const method = id ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(datos)
        });
        const data = await response.json();
        if (data.exito) {
            mostrarAlerta(data.mensaje, 'success');
            cerrarModalUsuario();
            setTimeout(() => { cargarUsuarios(); cargarEstadisticasUsuarios(); }, 500);
        } else {
            mostrarAlerta(data.error || 'Error al guardar usuario', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        mostrarAlerta('Error de conexion', 'error');
    }
}

let accionPendiente = null;
let usuarioPendiente = null;

function confirmarEliminar(id, nombre) {
    accionPendiente = 'eliminar';
    usuarioPendiente = id;
    document.getElementById('mensajeConfirmar').textContent = 'Estas seguro de desactivar al usuario "' + nombre + '"?';
    document.getElementById('btnConfirmarAccion').onclick = ejecutarAccionPendiente;
    document.getElementById('btnConfirmarAccion').className = 'btn-danger';
    document.getElementById('modalConfirmar').classList.add('active');
}

function confirmarReactivar(id, nombre) {
    accionPendiente = 'reactivar';
    usuarioPendiente = id;
    document.getElementById('mensajeConfirmar').textContent = 'Estas seguro de reactivar al usuario "' + nombre + '"?';
    document.getElementById('btnConfirmarAccion').onclick = ejecutarAccionPendiente;
    document.getElementById('btnConfirmarAccion').className = 'btn-primary';
    document.getElementById('modalConfirmar').classList.add('active');
}

function cerrarModalConfirmar() {
    document.getElementById('modalConfirmar').classList.remove('active');
    accionPendiente = null;
    usuarioPendiente = null;
}

async function ejecutarAccionPendiente() {
    if (!accionPendiente || !usuarioPendiente) return;
    try {
        let url, method;
        if (accionPendiente === 'eliminar') {
            url = '/api/usuarios/' + usuarioPendiente;
            method = 'DELETE';
        } else {
            url = '/api/usuarios/' + usuarioPendiente + '/reactivar';
            method = 'PATCH';
        }
        const response = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + token } });
        const data = await response.json();
        if (data.exito) {
            mostrarAlerta(data.mensaje, 'success');
            cerrarModalConfirmar();
            cargarUsuarios();
            cargarEstadisticasUsuarios();
        } else {
            mostrarAlerta(data.error || 'Error', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        mostrarAlerta('Error de conexion', 'error');
    }
}

async function verAuditoria(usuarioId) {
    try {
        const response = await fetch('/api/usuarios/auditoria/' + usuarioId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        if (data.exito) {
            const tbody = document.querySelector('#tablaAuditoria tbody');
            if (data.auditoria.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Sin registros de auditoria</td></tr>';
            } else {
                tbody.innerHTML = data.auditoria.map(a => {
                    return '<tr><td>' + new Date(a.created_at).toLocaleString('es-VE') + '</td><td>' + a.accion + '</td><td>' + (a.usuario_accion_nombre || 'Sistema') + '</td><td style="font-size:12px;color:#718096;">' + (a.datos_nuevos ? JSON.stringify(a.datos_nuevos).substring(0, 100) + '...' : '-') + '</td></tr>';
                }).join('');
            }
            document.getElementById('modalAuditoria').classList.add('active');
        }
    } catch (err) {
        console.error('Error:', err);
        mostrarAlerta('Error al cargar auditoria', 'error');
    }
}

function cerrarModalAuditoria() {
    document.getElementById('modalAuditoria').classList.remove('active');
}

// ============================================
// PERFIL USUARIO
// ============================================
async function cargarPerfil() {
    try {
        const response = await fetch('/api/usuarios/perfil/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        if (data.exito) {
            const p = data.perfil;
            document.getElementById('perfilInicial').textContent = p.nombre.charAt(0).toUpperCase();
            document.getElementById('perfilNombre').textContent = p.nombre;
            document.getElementById('perfilRol').textContent = p.rol.charAt(0).toUpperCase() + p.rol.slice(1);
            document.getElementById('perfilRol').className = 'badge ' + (p.rol === 'administrador' ? 'badge-admin' : 'badge-operador');
            document.getElementById('perfilEmail').textContent = p.email;
            document.getElementById('perfilFecha').textContent = p.fecha_creacion;
            document.getElementById('perfilActualizado').textContent = p.fecha_actualizacion;
            document.getElementById('perfilEstado').textContent = p.activo ? 'Activo' : 'Inactivo';
            const ipEl = document.getElementById('perfilIp');
            if (ipEl) {
                if (p.ip_asignada) {
                    ipEl.textContent = p.ip_asignada;
                    ipEl.style.color = '#1a3a5c';
                } else {
                    if (p.rol === 'operador') {
                        ipEl.textContent = 'Sin IP - Contacte al admin';
                        ipEl.style.color = '#e53e3e';
                    } else {
                        ipEl.textContent = 'Sin restriccion (admin)';
                        ipEl.style.color = '#a0aec0';
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

document.getElementById('formCambiarPassword')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const actual = document.getElementById('passwordActual').value;
    const nuevo = document.getElementById('passwordNuevo').value;
    const confirmar = document.getElementById('passwordConfirmar').value;
    if (nuevo !== confirmar) {
        mostrarAlerta('Las contrasenas no coinciden', 'error');
        return;
    }
    if (nuevo.length < 6) {
        mostrarAlerta('La contrasena debe tener minimo 6 caracteres', 'error');
        return;
    }
    try {
        const response = await fetch('/api/usuarios/' + usuario.id + '/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ passwordActual: actual, passwordNuevo: nuevo })
        });
        const data = await response.json();
        if (data.exito) {
            mostrarAlerta(data.mensaje, 'success');
            document.getElementById('formCambiarPassword').reset();
        } else {
            mostrarAlerta(data.error || 'Error al cambiar contrasena', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        mostrarAlerta('Error de conexion', 'error');
    }
});

// ============================================
// UTILIDADES
// ============================================
function mostrarAlerta(mensaje, tipo) {
    const alerta = document.createElement('div');
    alerta.className = 'alert ' + tipo + ' show';
    alerta.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    alerta.textContent = mensaje;
    document.body.appendChild(alerta);
    setTimeout(() => {
        alerta.style.opacity = '0';
        alerta.style.transition = 'opacity 0.3s';
        setTimeout(() => alerta.remove(), 300);
    }, 4000);
}

// ============================================
// INICIALIZAR
// ============================================
cargarTasaActual();
setInterval(cargarTasaActual, 300000);


// ============================================
// MODULO ESTADISTICAS - Conectado a API REAL tienda-caracas
// ============================================

let datosEstadisticasCache = null;

function initEstadisticas() {
    // Establecer valores por defecto en los filtros
    const hoy = new Date();
    const mesSelect = document.getElementById('filtro-mes');
    const anioSelect = document.getElementById('filtro-anio');

    if (mesSelect) mesSelect.value = hoy.getMonth() + 1;
    if (anioSelect) anioSelect.value = hoy.getFullYear();

    if (!chartEvolucion) inicializarGraficos();
    cargarDatosEstadisticasReales();
}

function inicializarGraficos() {
    const optionsEvolucion = {
        series: [{
            name: 'Cuotas Canceladas',
            data: [0,0,0,0,0,0,0]
        }, {
            name: 'Cuotas Incompletas',
            data: [0,0,0,0,0,0,0]
        }],
        chart: {
            type: 'bar',
            height: 320,
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            toolbar: { show: false },
            animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        colors: ['#10b981', '#f59e0b'],
        plotOptions: {
            bar: { horizontal: false, columnWidth: '55%', borderRadius: 8, borderRadiusApplication: 'end' }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: ['Ene','Feb','Mar','Abr','May','Jun','Jul'],
            labels: { style: { colors: '#64748b', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: { style: { colors: '#64748b', fontSize: '12px' } } },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: function (val) { return val + ' cuotas'; } } },
        legend: { show: false },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };
    chartEvolucion = new ApexCharts(document.querySelector('#chart-evolucion'), optionsEvolucion);
    chartEvolucion.render();

    const optionsDistribucion = {
        series: [0, 0, 0],
        chart: { type: 'donut', height: 320, fontFamily: 'Segoe UI, system-ui, sans-serif' },
        labels: ['Al dia', 'Incompleto', 'No pago'],
        colors: ['#10b981', '#f59e0b', '#ef4444'],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '14px', color: '#64748b' },
                        value: { show: true, fontSize: '24px', fontWeight: 700, color: '#1e293b', formatter: function(val) { return parseFloat(val).toFixed(1) + '%'; } },
                        total: { show: true, label: 'Total', color: '#64748b', formatter: function(w) {
                            const total = w.globals.seriesTotals.reduce((a, b) => { return (parseFloat(a) || 0) + (parseFloat(b) || 0); }, 0);
                            return total.toFixed(1) + '%';
                        }}
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontSize: '13px', labels: { colors: '#64748b' } },
        tooltip: { y: { formatter: function(val) { return parseFloat(val).toFixed(1) + '%'; } } }
    };
    chartDistribucion = new ApexCharts(document.querySelector('#chart-distribucion'), optionsDistribucion);
    chartDistribucion.render();
}

async function cargarDatosEstadisticasReales() {
    try {
        const mes = parseInt(document.getElementById('filtro-mes')?.value || new Date().getMonth() + 1);
        const anio = parseInt(document.getElementById('filtro-anio')?.value || new Date().getFullYear());
        const tipo = document.getElementById('filtro-tipo')?.value || 'todos';

        console.log('[DEBUG] Cargando estadisticas para mes:', mes, 'anio:', anio, 'tipo:', tipo);

        const response = await fetch('/api/tienda-caracas');
        if (!response.ok) throw new Error('Error HTTP: ' + response.status);

        const clientes = await response.json();
        console.log('[DEBUG] Clientes cargados:', clientes.length);

        const estadisticas = procesarDatosEstadisticas(clientes, mes, anio, tipo);
        datosEstadisticasCache = estadisticas;

        actualizarKPIsReales(estadisticas.kpis);
        actualizarGraficosReales(estadisticas.evolucion, estadisticas.distribucion);
        actualizarTablaDeudoresReales(estadisticas.deudores);

    } catch (error) {
        console.error('Error cargando estadisticas reales:', error);
        mostrarAlerta('Error cargando datos. Verifica la conexion.', 'error');
    }
}

function procesarDatosEstadisticas(clientes, mesFiltro, anioFiltro, tipoFiltro) {
    let cuotasCanceladas = 0;
    let cuotasIncompletas = 0;
    let totalDeudores = 0;
    let creditosActivos = 0;
    let montoCanceladas = 0;
    let montoIncompletas = 0;
    let montoDeudores = 0;
    let montoCreditos = 0;

    let alDia = 0;
    let incompleto = 0;
    let noPago = 0;

    const deudores = [];
    const evolucionMensual = {};

    for (let m = 1; m <= 12; m++) {
        evolucionMensual[m] = { canceladas: 0, incompletas: 0 };
    }

    // Filtrar clientes según mes, año y tipo
    const clientesFiltrados = clientes.filter(c => {
        const fechaFactura = c.fecha_factura ? new Date(c.fecha_factura) : null;
        if (fechaFactura) {
            const mesFactura = fechaFactura.getMonth() + 1;
            const anioFactura = fechaFactura.getFullYear();
            if (anioFactura !== anioFiltro) return false;
            if (mesFactura !== mesFiltro) return false;
        }

        // Contar cuotas pagadas
        let cuotasPagadas = 0;
        for (let i = 1; i <= 11; i++) {
            if (parseFloat(c['cuota_' + i]) > 0) cuotasPagadas++;
        }

        // Filtro por tipo
        if (tipoFiltro === 'contado') {
            const montoFactura = parseFloat(c.monto_factura) || 0;
            let montoDepositado = 0;
            for (let i = 1; i <= 11; i++) {
                montoDepositado += parseFloat(c['cuota_' + i]) || 0;
            }
            const deuda = montoFactura - montoDepositado;
            if (deuda > 0) return false;
        } else if (tipoFiltro === 'credito') {
            const montoFactura = parseFloat(c.monto_factura) || 0;
            let montoDepositado = 0;
            for (let i = 1; i <= 11; i++) {
                montoDepositado += parseFloat(c['cuota_' + i]) || 0;
            }
            const deuda = montoFactura - montoDepositado;
            if (deuda <= 0 && cuotasPagadas <= 1) return false;
        }

        return true;
    });

    clientesFiltrados.forEach(c => {
        const montoFactura = parseFloat(c.monto_factura) || 0;
        let montoDepositado = 0;
        let cuotasPagadas = 0;
        const totalCuotas = 11;

        for (let i = 1; i <= totalCuotas; i++) {
            const cuota = parseFloat(c['cuota_' + i]) || 0;
            if (cuota > 0) {
                montoDepositado += cuota;
                cuotasPagadas++;

                const fechaCuota = c['fecha_cuota_' + i];
                if (fechaCuota) {
                    const fecha = new Date(fechaCuota);
                    if (fecha.getFullYear() === anioFiltro) {
                        const mes = fecha.getMonth() + 1;
                        evolucionMensual[mes].canceladas++;
                    }
                }
            }
        }

        const deuda = montoFactura - montoDepositado;

        let estado = 'Al dia';
        if (deuda > 0) {
            if (cuotasPagadas === 0) {
                estado = 'No pago';
                noPago++;
            } else if (cuotasPagadas < totalCuotas) {
                estado = 'Incompleto';
                incompleto++;
            }
            totalDeudores++;
            montoDeudores += deuda;
        } else {
            alDia++;
            cuotasCanceladas++;
            montoCanceladas += montoFactura;
        }

        if (deuda > 0 && cuotasPagadas > 0 && cuotasPagadas < totalCuotas) {
            cuotasIncompletas++;
            montoIncompletas += deuda;
        }

        creditosActivos++;
        montoCreditos += montoFactura;

        if (deuda > 0) {
            deudores.push({
                nombre: c.nombre_apellido || 'Sin nombre',
                cedula: c.cedula || '-',
                cuota: montoFactura / totalCuotas,
                pagado: montoDepositado,
                deuda: deuda,
                estado: estado
            });
        }

        if (estado === 'Incompleto') {
            const fechaFactura = c.fecha_factura ? new Date(c.fecha_factura) : null;
            if (fechaFactura && fechaFactura.getFullYear() === anioFiltro) {
                evolucionMensual[fechaFactura.getMonth() + 1].incompletas++;
            }
        }
    });

    const totalClientes = clientesFiltrados.length || 1;
    const distribucion = [
        { categoria: 'Al dia', cantidad: alDia, porcentaje: (alDia / totalClientes * 100).toFixed(1) },
        { categoria: 'Incompleto', cantidad: incompleto, porcentaje: (incompleto / totalClientes * 100).toFixed(1) },
        { categoria: 'No pago', cantidad: noPago, porcentaje: (noPago / totalClientes * 100).toFixed(1) }
    ];

    const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const mesesMostrar = [];
    const canceladasMostrar = [];
    const incompletasMostrar = [];

    for (let i = 6; i >= 0; i--) {
        let m = mesFiltro - i;
        if (m <= 0) m += 12;
        mesesMostrar.push(mesesNombres[m - 1]);
        canceladasMostrar.push(evolucionMensual[m]?.canceladas || 0);
        incompletasMostrar.push(evolucionMensual[m]?.incompletas || 0);
    }

    return {
        kpis: {
            cuotas_canceladas: { valor: cuotasCanceladas, monto: montoCanceladas, trend: 0 },
            cuotas_incompletas: { valor: cuotasIncompletas, monto: montoIncompletas, trend: 0 },
            deudores: { valor: totalDeudores, monto: montoDeudores, trend: 0 },
            creditos_activos: { valor: creditosActivos, monto: montoCreditos, trend: 0 }
        },
        evolucion: {
            meses: mesesMostrar,
            canceladas: canceladasMostrar,
            incompletas: incompletasMostrar
        },
        distribucion: distribucion,
        deudores: deudores.sort((a, b) => b.deuda - a.deuda).slice(0, 50)
    };
}

function actualizarKPIsReales(kpis) {
    document.getElementById('valor-cuotas-canceladas').textContent = kpis.cuotas_canceladas.valor;
    document.getElementById('monto-cuotas-canceladas').textContent = formatearMoneda(kpis.cuotas_canceladas.monto);
    document.getElementById('trend-cuotas-canceladas').innerHTML = '<span>Clientes al dia</span>';

    document.getElementById('valor-cuotas-incompletas').textContent = kpis.cuotas_incompletas.valor;
    document.getElementById('monto-cuotas-incompletas').textContent = formatearMoneda(kpis.cuotas_incompletas.monto);
    document.getElementById('trend-cuotas-incompletas').innerHTML = '<span>Con deuda pendiente</span>';

    document.getElementById('valor-deudores').textContent = kpis.deudores.valor;
    document.getElementById('monto-deudores').textContent = formatearMoneda(kpis.deudores.monto);
    document.getElementById('trend-deudores').innerHTML = '<span>Total en deuda</span>';

    document.getElementById('valor-creditos').textContent = kpis.creditos_activos.valor;
    document.getElementById('monto-creditos').textContent = formatearMoneda(kpis.creditos_activos.monto);
    document.getElementById('trend-creditos').innerHTML = '<span>Total facturado</span>';
}

function actualizarGraficosReales(evolucion, distribucion) {
    if (chartEvolucion) {
        chartEvolucion.updateOptions({
            xaxis: { categories: evolucion.meses }
        });
        chartEvolucion.updateSeries([
            { name: 'Cuotas Canceladas', data: evolucion.canceladas },
            { name: 'Cuotas Incompletas', data: evolucion.incompletas }
        ]);
    }

    if (chartDistribucion) {
        const series = distribucion.map(d => parseFloat(d.porcentaje) || 0);
        chartDistribucion.updateSeries(series);
    }
}

function actualizarTablaDeudoresReales(deudores) {
    const tbody = document.getElementById('tbody-deudores');
    if (!tbody) return;

    if (deudores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay deudores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = deudores.map(d => 
        '<tr>' +
            '<td><strong>' + (d.nombre || '-') + '</strong></td>' +
            '<td>' + (d.cedula || '-') + '</td>' +
            '<td class="text-right monto">' + formatearMoneda(d.cuota) + '</td>' +
            '<td class="text-right monto">' + formatearMoneda(d.pagado) + '</td>' +
            '<td class="text-right monto" style="color:' + (d.deuda > 0 ? '#ef4444' : '#10b981') + '">' + formatearMoneda(d.deuda) + '</td>' +
            '<td><span class="badge ' + getBadgeClass(d.estado) + '">' + d.estado + '</span></td>' +
            '<td><button class="btn-ver" onclick="verCliente(' + "'" + d.cedula + "'" + ')">Ver</button></td>' +
        '</tr>'
    ).join('');
}

async function aplicarFiltros() {
    const btn = document.querySelector('.btn-filtrar');
    btn.innerHTML = '<span class="spinner"></span> Actualizando...';
    btn.disabled = true;
    try {
        await cargarDatosEstadisticasReales();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        btn.innerHTML = 'Actualizar';
        btn.disabled = false;
    }
}

function formatearMoneda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return '$ 0,00';
    return '$ ' + valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getBadgeClass(estado) {
    switch(estado) {
        case 'Al dia': return 'badge-success';
        case 'Incompleto': return 'badge-warning';
        case 'No pago': return 'badge-danger';
        default: return 'badge-warning';
    }
}

function filtrarDeudores() {
    const texto = document.getElementById('buscar-deudor')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('#tbody-deudores tr');
    filas.forEach(fila => {
        const nombre = fila.cells[0]?.textContent.toLowerCase() || '';
        const cedula = fila.cells[1]?.textContent.toLowerCase() || '';
        fila.style.display = (nombre.includes(texto) || cedula.includes(texto)) ? '' : 'none';
    });
}

function verCliente(cedula) {
    mostrarSeccion('clientes');
    mostrarBaseDatos();
    setTimeout(() => {
        const searchInput = document.getElementById('search-general');
        if (searchInput) {
            searchInput.value = cedula;
            applyFilters();
        }
    }, 500);
}

function exportarReporte() {
    if (!datosEstadisticasCache) {
        alert('No hay datos para exportar');
        return;
    }

    const headers = ['Cliente', 'Cedula', 'Cuota Mensual', 'Pagado', 'Deuda', 'Estado'];
    const rows = datosEstadisticasCache.deudores.map(d => [
        d.nombre, d.cedula, d.cuota, d.pagado, d.deuda, d.estado
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(cell => '"' + cell + '"').join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estadisticas_tienda_caracas_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}
