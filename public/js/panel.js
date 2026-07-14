// ============================================
// VARIABLES GLOBALES
// ============================================
const token = localStorage.getItem('token');
let usuario = {};

// Función para sincronizar perfil desde backend
async function sincronizarPerfilUsuario() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/usuarios/perfil/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito && data.perfil) {
                const perfil = data.perfil;
                // Actualizar localStorage con datos frescos del backend
                const userData = {
                    id: perfil.id,
                    nombre: perfil.nombre,
                    email: perfil.email,
                    rol: perfil.rol,
                    tienda: perfil.tienda
                };
                localStorage.setItem('usuario', JSON.stringify(userData));
                if (perfil.tienda) {
                    localStorage.setItem('tienda_usuario', perfil.tienda);
                }
                // Actualizar variable global
                usuario = userData;
                // Perfil sincronizado desde backend

                // Actualizar UI
                document.getElementById('userName').textContent = usuario.nombre || 'Usuario';
                const rolDetectado = usuario.rol || 'usuario';
                document.getElementById('userRole').textContent = rolDetectado.charAt(0).toUpperCase() + rolDetectado.slice(1);
                document.getElementById('userInitials').textContent = (usuario.nombre || 'U').charAt(0).toUpperCase();

                // Actualizar menú según rol y tienda
                ocultarMenuSegunRol();
            }
        }
    } catch (err) {
        console.warn('Error sincronizando perfil:', err);
    }
}

try {
    let usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw || usuarioRaw === 'undefined' || usuarioRaw === 'null') {
        usuarioRaw = localStorage.getItem('user');
    }
    if (usuarioRaw && usuarioRaw !== 'undefined' && usuarioRaw !== 'null') {
        usuario = JSON.parse(usuarioRaw);
    }
    // Usuario cargado desde localStorage
    // Rol detectado
    // Tienda en localStorage
} catch (e) {
    console.warn('Error parseando usuario de localStorage:', e);
    usuario = {};
}

// Sincronizar perfil desde backend al cargar (asegura datos actualizados)
sincronizarPerfilUsuario().then(() => {
    // Después de sincronizar, ajustar menú según rol
    ocultarMenuSegunRol();
});
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
// Detectar rol de múltiples fuentes posibles
const rolDetectado = usuario.rol || usuario.role || usuario.tipo || 'usuario';
// Rol detectado
document.getElementById('userRole').textContent = rolDetectado.charAt(0).toUpperCase() + rolDetectado.slice(1);
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
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (esMovil()) {
        // En móvil: deslizar desde el costado
        const isOpen = sidebar.style.transform === 'translateX(0px)' || sidebar.style.transform === 'translateX(0)';
        if (isOpen) {
            sidebar.style.transform = 'translateX(-100%)';
        } else {
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.width = '250px';
            sidebar.style.position = 'fixed';
            sidebar.style.zIndex = '1000';
            sidebar.style.height = '100vh';
        }
    } else {
        // En desktop: comportamiento normal
        sidebar.classList.toggle('collapsed');
    }
}

function mostrarSeccion(seccion) {
    // En móvil, cerrar sidebar al seleccionar una sección
    if (esMovil()) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    }

    // Proteger módulos según rol y tienda
    if (!isAdmin()) {
        const tiendaUsuario = getTiendaUsuario();

        // Actividades Pendientes: solo admin
        if (seccion === 'reportes') {
            mostrarAlerta('No tienes permiso para acceder a Actividades Pendientes', 'warning');
            return;
        }

        // Tiendas: solo la que le corresponde al operador
        const tiendaMap = {
            'clientes': 'caracas',
            'creditos': 'maracay',
            'pagos': 'maracaibo'
        };

        if (tiendaMap[seccion] && tiendaMap[seccion] !== tiendaUsuario) {
            mostrarAlerta('No tienes permiso para acceder a esta tienda', 'warning');
            return;
        }

        // Usuarios: solo admin (perfil propio sí está permitido)
        if (seccion === 'usuarios') {
            mostrarAlerta('No tienes permiso para gestionar usuarios', 'warning');
            return;
        }
    }

    document.querySelectorAll('.content-area').forEach(el => el.classList.add('hidden'));
    const contentId = 'content' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
    const content = document.getElementById(contentId);
    if (content) content.classList.remove('hidden');

    const titulos = {
        'dashboard': 'Panel Principal',
        'clientes': 'Tienda Caracas',
        'creditos': 'Tienda Maracay',
        'pagos': 'Tienda Maracaibo',
        'reportes': 'Actividades Pendientes',
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
        'reportes': 'Actividades Pendientes - En desarrollo',
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
        const busqueda = document.getElementById('tc-busqueda');
        if (menu) menu.style.display = 'grid';
        if (baseDatos) baseDatos.style.display = 'none';
        if (conciliaciones) conciliaciones.style.display = 'none';
        if (busqueda) busqueda.style.display = 'none';
    }

    if (seccion === 'tasas') cargarHistorial();
    if (seccion === 'usuarios') {
        cargarUsuarios();
        cargarEstadisticasUsuarios();
    }
    if (seccion === 'perfil') cargarPerfil();
    
    // Ocultar actividades pendientes para no-administradores
    ocultarMenuSegunRol();
    if (seccion === 'estadisticas') initEstadisticas();
    if (seccion === 'reportes') initAgenda();
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
        let tiendaBadge = '';
        if (u.rol === 'operador') {
            ipBadge = u.ip_asignada ? '<span class="ip-badge restringida">' + u.ip_asignada + '</span>' : '<span class="ip-badge alerta">Sin IP</span>';
            const tiendaNombre = { 'caracas': 'Caracas', 'maracay': 'Maracay', 'maracaibo': 'Maracaibo' }[u.tienda] || u.tienda || 'Sin tienda';
            tiendaBadge = '<span class="tienda-badge" style="display:inline-flex; align-items:center; gap:3px; font-size:11px; padding:2px 8px; background:#e3f2fd; color:#1a3a5c; border-radius:10px; margin-top:4px; font-weight:600;"><i class="fas fa-store" style="font-size:10px;"></i> ' + tiendaNombre + '</span>';
        } else {
            ipBadge = u.ip_asignada ? '<span class="ip-badge restringida">' + u.ip_asignada + '</span>' : '<span class="ip-badge libre">Libre</span>';
        }
        return '<tr>' +
            '<td data-label="ID">' + u.id + '</td>' +
            '<td data-label="Nombre"><strong>' + u.nombre + '</strong><br>' + ipBadge + '<br>' + tiendaBadge + '</td>' +
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
    document.getElementById('usuarioTienda').value = '';
    document.getElementById('usuarioTienda').required = true;
    document.getElementById('tiendaHelp').textContent = 'Obligatoria para operadores';
    document.getElementById('grupoPassword').style.display = 'block';
    document.getElementById('grupoEstado').style.display = 'none';
    document.getElementById('grupoIp').style.display = 'block';
    document.getElementById('grupoTienda').style.display = 'block';
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
    const tiendaInput = document.getElementById('usuarioTienda');
    const tiendaHelp = document.getElementById('tiendaHelp');
    if (rol === 'operador') {
        ipInput.required = true;
        ipLabel.innerHTML = 'IP Asignada <span style="color:#e53e3e;">*</span>';
        ipHelp.textContent = 'Obligatorio para operadores';
        ipHelp.style.color = '#e53e3e';
        tiendaInput.required = true;
        tiendaHelp.textContent = 'Obligatoria para operadores';
        tiendaHelp.style.color = '#e53e3e';
    } else {
        ipInput.required = false;
        ipLabel.innerHTML = 'IP Asignada <span style="font-weight:400;color:#a0aec0;font-size:12px;">(opcional)</span>';
        ipHelp.textContent = 'Opcional para administradores';
        ipHelp.style.color = '#718096';
        tiendaInput.required = false;
        tiendaHelp.textContent = 'Opcional para administradores';
        tiendaHelp.style.color = '#718096';
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
            document.getElementById('usuarioTienda').value = data.usuario.tienda || '';
            const rol = data.usuario.rol;
            const ipInput = document.getElementById('usuarioIp');
            const ipLabel = document.getElementById('ipLabel');
            const ipHelp = document.getElementById('ipHelp');
            const tiendaInput = document.getElementById('usuarioTienda');
            const tiendaHelp = document.getElementById('tiendaHelp');
            if (rol === 'operador') {
                ipInput.required = true;
                ipLabel.innerHTML = 'IP Asignada <span style="color:#e53e3e;">*</span>';
                ipHelp.textContent = 'Obligatorio para operadores';
                ipHelp.style.color = '#e53e3e';
                tiendaInput.required = true;
                tiendaHelp.textContent = 'Obligatoria para operadores';
                tiendaHelp.style.color = '#e53e3e';
            } else {
                ipInput.required = false;
                ipLabel.innerHTML = 'IP Asignada <span style="font-weight:400;color:#a0aec0;font-size:12px;">(opcional)</span>';
                ipHelp.textContent = 'Opcional para administradores';
                ipHelp.style.color = '#718096';
                tiendaInput.required = false;
                tiendaHelp.textContent = 'Opcional para administradores';
                tiendaHelp.style.color = '#718096';
            }
            document.getElementById('grupoPassword').style.display = 'none';
            document.getElementById('grupoEstado').style.display = 'block';
            document.getElementById('grupoIp').style.display = 'block';
            document.getElementById('grupoTienda').style.display = 'block';
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
    const tienda = document.getElementById('usuarioTienda').value;

    if (rol === 'operador' && !ip_asignada) {
        mostrarAlerta('La IP asignada es obligatoria para operadores', 'error');
        document.getElementById('usuarioIp').focus();
        return;
    }
    if (rol === 'operador' && !tienda) {
        mostrarAlerta('La tienda asignada es obligatoria para operadores', 'error');
        document.getElementById('usuarioTienda').focus();
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
    if (tienda) datos.tienda = tienda;
    if (rol === 'administrador' && !ip_asignada) datos.ip_asignada = null;
    if (rol === 'administrador' && !tienda) datos.tienda = null;

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
            // Guardar tienda en localStorage para filtrado de actividades
            if (p.tienda) {
                try {
                    let userData = JSON.parse(localStorage.getItem('usuario') || '{}');
                    userData.tienda = p.tienda;
                    localStorage.setItem('usuario', JSON.stringify(userData));
                } catch (e) {
                    console.warn('Error guardando tienda:', e);
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
    // Cargar meses disponibles desde la API
    cargarMesesDisponibles();

    // Establecer valores por defecto en los filtros
    const hoy = new Date();
    const anioSelect = document.getElementById('filtro-anio');

    if (anioSelect) anioSelect.value = hoy.getFullYear();

    if (!chartEvolucion) inicializarGraficos();
    cargarDatosEstadisticasReales();
}

async function cargarMesesDisponibles() {
    try {
        const response = await fetch('/api/tienda-caracas');
        if (!response.ok) return;

        const clientes = await response.json();
        const mesesConDatos = new Set();

        // Extraer meses de todas las fechas de cuota
        clientes.forEach(c => {
            for (let i = 1; i <= 11; i++) {
                const fechaCuota = c['fecha_cuota_' + i];
                if (fechaCuota) {
                    const fecha = new Date(fechaCuota);
                    if (!isNaN(fecha.getTime())) {
                        mesesConDatos.add(fecha.getMonth() + 1);
                    }
                }
            }
        });

        // Llenar el dropdown solo con meses que tienen datos
        const mesSelect = document.getElementById('filtro-mes');
        if (mesSelect) {
            const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            // Guardar el valor actual si existe
            const valorActual = mesSelect.value;

            // Limpiar opciones existentes
            mesSelect.innerHTML = '';

            // Agregar solo meses con datos
            const mesesOrdenados = Array.from(mesesConDatos).sort((a, b) => a - b);
            mesesOrdenados.forEach(mesNum => {
                const option = document.createElement('option');
                option.value = mesNum;
                option.textContent = mesesNombres[mesNum - 1];
                mesSelect.appendChild(option);
            });

            // Seleccionar el mes actual si está disponible, o el último mes con datos
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            if (mesesConDatos.has(mesActual)) {
                mesSelect.value = mesActual;
            } else if (mesesOrdenados.length > 0) {
                mesSelect.value = mesesOrdenados[mesesOrdenados.length - 1];
            }
        }
    } catch (error) {
        console.error('Error cargando meses disponibles:', error);
    }
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

        // Cargando estadisticas

        const response = await fetch('/api/tienda-caracas');
        if (!response.ok) throw new Error('Error HTTP: ' + response.status);

        const clientes = await response.json();
        // Clientes cargados

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

// Formatear fecha para reportes
function formatearFecha(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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


// ============================================
// MINI AGENDA DIGITAL - ACTIVIDADES PENDIENTES
// ============================================

let actividades = [];
let filtroActividades = 'pendientes';  // Por defecto solo mostrar pendientes

// Paginación del historial
let paginaHistorial = 1;
const actividadesPorPagina = 10;
let totalPaginasHistorial = 1;
let actividadesHistorialCache = [];

// Cargar actividades desde localStorage al iniciar
async function initAgenda() {
    await cargarActividadesAPI();
    actualizarFechaAgenda();
    renderizarActividades();
    actualizarStatsAgenda();
    cargarHistorialActividades();

    // Setear hora actual por defecto en el input
    const ahora = new Date();
    const horaStr = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
    const horaInput = document.getElementById('agendaHora');
    if (horaInput) horaInput.value = horaStr;
}

function actualizarFechaAgenda() {
    const fechaEl = document.getElementById('agendaFechaHoy');
    if (fechaEl) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const ahora = new Date();
        fechaEl.textContent = dias[ahora.getDay()] + ', ' + ahora.getDate() + ' de ' + meses[ahora.getMonth()] + ' de ' + ahora.getFullYear();
    }
}

async function cargarActividadesAPI() {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const tiendaUsuario = getTiendaUsuario();

        // cargarActividadesAPI

        let url = '/api/actividades?fecha=' + hoy;
        if (tiendaUsuario && !isAdmin()) {
            url += '&tienda=' + tiendaUsuario;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            actividades = data.actividades || [];
            // Actividades cargadas desde API
        } else {
            actividades = [];
            // No hay actividades en la API
        }
    } catch (e) {
        console.warn('Error cargando actividades desde API:', e);
        // Fallback a localStorage si la API falla
        cargarActividadesLocalStorageFallback();
    }
}

function cargarActividadesLocalStorageFallback() {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
        if (guardadas) {
            let todas = JSON.parse(guardadas);
            const tiendaUsuario = getTiendaUsuario();
            if (tiendaUsuario && !isAdmin()) {
                todas = todas.filter(a => !a.tienda || a.tienda === tiendaUsuario);
            }
            actividades = todas;
        } else {
            actividades = [];
        }
    } catch (e) {
        console.warn('Error fallback localStorage:', e);
        actividades = [];
    }
}

function getUserRole() {
    // Obtener el rol del usuario desde localStorage
    const userData = localStorage.getItem('usuario');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.rol || 'operador';
        } catch (e) {
            return 'operador';
        }
    }
    // Fallback: leer del token JWT
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.rol || payload.role || 'operador';
        } catch (e) {
            return 'operador';
        }
    }
    return 'operador';
}

function isAdmin() {
    return getUserRole() === 'administrador';
}

function getTiendaUsuario() {
    // Obtener la tienda del usuario desde localStorage
    const userData = localStorage.getItem('usuario');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.tienda) {
                return user.tienda;
            }
        } catch (e) {
            console.warn('Error parseando usuario:', e);
        }
    }
    // Fallback: leer del token JWT
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.tienda) {
                return payload.tienda;
            }
        } catch (e) {
            console.warn('Error parseando token:', e);
        }
    }
    return null;
}

async function guardarActividadAPI(actividad) {
    try {
        const response = await fetch('/api/actividades', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify(actividad)
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            // Actividad guardada en API
            return data.actividad;
        } else {
            throw new Error(data.error || 'Error al guardar actividad');
        }
    } catch (e) {
        console.warn('Error guardando actividad en API:', e);
        // Fallback a localStorage
        guardarActividadLocalStorageFallback(actividad);
        return null;
    }
}

function guardarActividadLocalStorageFallback(actividad) {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        let actividades = [];
        const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
        if (guardadas) {
            actividades = JSON.parse(guardadas);
        }
        actividades.push(actividad);
        localStorage.setItem('agenda_actividades_' + hoy, JSON.stringify(actividades));
    } catch (e) {
        console.warn('Error fallback localStorage:', e);
    }
}

async function agregarActividad() {
    const descripcionInput = document.getElementById('agendaDescripcion');
    const horaInput = document.getElementById('agendaHora');
    const prioridadInput = document.getElementById('agendaPrioridad');
    const tiendaInput = document.getElementById('agendaTienda');

    const descripcion = descripcionInput.value.trim();
    const hora = horaInput.value;
    const prioridad = prioridadInput.value;
    const tienda = tiendaInput ? tiendaInput.value : 'caracas';

    if (!descripcion) {
        mostrarAlerta('Ingresa una descripción para la actividad', 'warning');
        descripcionInput.focus();
        return;
    }

    if (!hora) {
        mostrarAlerta('Selecciona una hora para la actividad', 'warning');
        horaInput.focus();
        return;
    }

    const actividad = {
        descripcion: descripcion,
        hora: hora,
        prioridad: prioridad,
        tienda: tienda,
        estado: 'pendiente',
        fecha: new Date().toISOString().split('T')[0]
    };

    showLoading(true);

    try {
        const response = await fetch('/api/actividades', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify(actividad)
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            // Limpiar formulario
            descripcionInput.value = '';
            prioridadInput.value = 'media';

            // Actualizar hora al momento actual
            const ahora = new Date();
            horaInput.value = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');

            // Recargar actividades desde la API
            await cargarActividadesAPI();
            renderizarActividades();
            actualizarStatsAgenda();
            await actualizarWidgetActividades();
            mostrarAlerta('Actividad agregada exitosamente', 'success');
        } else {
            throw new Error(data.error || 'Error al crear actividad');
        }
    } catch (e) {
        console.error('Error agregando actividad:', e);
        mostrarAlerta('Error al agregar actividad: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function toggleActividad(id) {
    const actividad = actividades.find(a => a.id === id);
    if (!actividad) return;

    const nuevoEstado = actividad.estado === 'pendiente' ? 'completada' : 'pendiente';

    showLoading(true);

    try {
        const response = await fetch('/api/actividades/' + id, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            if (nuevoEstado === 'completada') {
                mostrarAlerta('¡Actividad completada!', 'success');
            }

            // Recargar actividades desde la API
            await cargarActividadesAPI();
            renderizarActividades();
            actualizarStatsAgenda();
            await cargarHistorialActividades();
            await actualizarWidgetActividades();
        } else {
            throw new Error(data.error || 'Error al actualizar actividad');
        }
    } catch (e) {
        console.error('Error toggle actividad:', e);
        mostrarAlerta('Error al actualizar actividad: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function eliminarActividad(id) {
    const actividad = actividades.find(a => a.id === id);
    if (!actividad) return;

    mostrarModalCorporativo(
        '¿Eliminar Actividad?',
        '¿Estás seguro de que deseas eliminar esta actividad?\n\n<strong>' + escapeHtml(actividad.descripcion) + '</strong>\n\nHora: ' + actividad.hora + '\nPrioridad: ' + actividad.prioridad.toUpperCase(),
        'warning',
        [
            {
                texto: 'Cancelar',
                estilo: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;'
            },
            {
                texto: 'Sí, Eliminar',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #e53e3e, #c53030); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                accion: async () => {
                    showLoading(true);
                    try {
                        const response = await fetch('/api/actividades/' + id, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });

                        if (!response.ok) {
                            throw new Error('Error HTTP: ' + response.status);
                        }

                        const data = await response.json();

                        if (data.exito) {
                            await cargarActividadesAPI();
                            renderizarActividades();
                            actualizarStatsAgenda();
                            cargarHistorialActividades();
                            actualizarWidgetActividades();
                            mostrarAlerta('Actividad eliminada', 'success');
                        } else {
                            throw new Error(data.error || 'Error al eliminar');
                        }
                    } catch (e) {
                        console.error('Error eliminando actividad:', e);
                        mostrarAlerta('Error al eliminar: ' + e.message, 'error');
                    } finally {
                        showLoading(false);
                    }
                }
            }
        ]
    );
}

function editarActividad(id) {
    const actividad = actividades.find(a => a.id === id);
    if (!actividad) return;

    // Crear modal de edición inline
    const modalExistente = document.getElementById('modal-editar-actividad');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-editar-actividad';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:3000; justify-content:center; align-items:center; backdrop-filter:blur(4px); padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:450px; padding:30px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); animation:modalIn 0.3s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="color:#1a3a5c; margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-pen" style="color:#3182ce;"></i> Editar Actividad
                </h3>
                <button onclick="cerrarModalEditarActividad()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#718096; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.2s;" onmouseover="this.style.background='#f0f0f0';" onmouseout="this.style.background='none';">&times;</button>
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:0.8rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Descripción</label>
                <textarea id="editarActividadTexto" rows="3" style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:10px; font-size:0.95rem; resize:vertical; transition:all 0.2s; font-family:inherit;" onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)';" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';">${escapeHtml(actividad.descripcion)}</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button onclick="cerrarModalEditarActividad()" style="padding:10px 20px; background:#f0f0f0; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; color:#666; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='#e0e0e0';" onmouseout="this.style.background='#f0f0f0';">Cancelar</button>
                <button onclick="guardarEdicionActividad(${id})" style="padding:10px 24px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; font-weight:600; transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">Guardar Cambios</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus en el textarea
    setTimeout(() => {
        const textarea = document.getElementById('editarActividadTexto');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }, 100);
}

function cerrarModalEditarActividad() {
    const modal = document.getElementById('modal-editar-actividad');
    if (modal) modal.remove();
}

async function guardarEdicionActividad(id) {
    const textarea = document.getElementById('editarActividadTexto');
    if (!textarea) return;

    const descripcion = textarea.value.trim();
    if (!descripcion) {
        mostrarAlerta('La descripción no puede estar vacía', 'warning');
        return;
    }

    showLoading(true);
    try {
        // Actualizar via API
        const response = await fetch('/api/actividades/' + id, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ descripcion: descripcion })
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            // Actualizar local
            const actividad = actividades.find(a => a.id === id);
            if (actividad) {
                actividad.descripcion = descripcion;
            }
            guardarActividadesLocalStorage();
            renderizarActividades();
            await actualizarWidgetActividades();
            cerrarModalEditarActividad();
            mostrarAlerta('Actividad actualizada', 'success');
        } else {
            throw new Error(data.error || 'Error al actualizar');
        }
    } catch (e) {
        console.error('Error editando actividad:', e);
        mostrarAlerta('Error: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

function filtrarActividades(filtro) {
    filtroActividades = filtro;

    // Actualizar botones activos
    document.querySelectorAll('.agenda-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnActivo = document.querySelector('.agenda-filter[data-filter="' + filtro + '"]');
    if (btnActivo) btnActivo.classList.add('active');

    renderizarActividades();
}

function renderizarActividades() {
    const lista = document.getElementById('agendaLista');
    if (!lista) return;

    let actividadesFiltradas = actividades;
    if (filtroActividades === 'pendientes') {
        actividadesFiltradas = actividades.filter(a => a.estado === 'pendiente');
    } else if (filtroActividades === 'completadas') {
        actividadesFiltradas = actividades.filter(a => a.estado === 'completada');
    }

    // Ordenar por hora
    actividadesFiltradas.sort((a, b) => a.hora.localeCompare(b.hora));

    if (actividadesFiltradas.length === 0) {
        let mensaje = 'No hay actividades para hoy';
        let submensaje = 'Agrega tu primera actividad usando el formulario de arriba';
        let icono = 'fa-clipboard-check';

        if (filtroActividades === 'pendientes') {
            mensaje = 'No hay actividades pendientes';
            submensaje = '¡Todas las actividades han sido completadas!';
            icono = 'fa-check-circle';
        } else if (filtroActividades === 'completadas') {
            mensaje = 'No hay actividades completadas';
            submensaje = 'Comienza a completar tus actividades';
            icono = 'fa-hourglass-half';
        }

        lista.innerHTML = `
            <div class="agenda-empty">
                <i class="fas ${icono}"></i>
                <p>${mensaje}</p>
                <span>${submensaje}</span>
            </div>
        `;
        return;
    }

    lista.innerHTML = actividadesFiltradas.map(act => {
        // Normalizar campos (BD usa snake_case, localStorage usa camelCase)
        const id = act.id;
        const descripcion = act.descripcion;
        const descripcionExtra = act.descripcion_extra || act.descripcionExtra || '';
        const hora = act.hora;
        const prioridad = act.prioridad;
        const tienda = act.tienda;
        const estado = act.estado;
        const fechaCompletada = act.fecha_completada || act.fechaCompletada || null;

        const isCompletada = estado === 'completada';
        const prioridadClass = 'prioridad-' + prioridad;
        const fechaCompletadaFormateada = fechaCompletada ? formatearFechaHora(fechaCompletada) : '';
        const tiendaNombre = {
            'caracas': 'Caracas',
            'maracay': 'Maracay',
            'maracaibo': 'Maracaibo'
        }[tienda] || tienda || 'General';

        const descripcionExtraHtml = descripcionExtra ? 
            `<div style="margin-top:6px; padding:8px 12px; background:#f0fff4; border-radius:8px; border-left:3px solid #48bb78; font-size:0.85rem; color:#2d3748; line-height:1.4;">
                <div style="font-size:0.7rem; font-weight:600; color:#48bb78; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
                    <i class="fas fa-sticky-note" style="font-size:0.65rem;"></i> Nota / Descripción adicional
                </div>
                ${escapeHtml(descripcionExtra)}
            </div>` : '';

        return `
            <div class="agenda-item ${isCompletada ? 'completada' : ''} ${prioridadClass}">
                <div class="agenda-checkbox ${isCompletada ? 'checked' : ''}" onclick="toggleActividad(${id})">
                    ${isCompletada ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="agenda-info">
                    <div class="agenda-descripcion">${escapeHtml(descripcion)}</div>
                    <div class="agenda-meta">
                        <span class="agenda-hora-tag"><i class="far fa-clock"></i> ${hora}</span>
                        <span class="agenda-prioridad-tag ${prioridad}">${prioridad.toUpperCase()}</span>
                        <span class="agenda-estado-tag ${estado}">${isCompletada ? 'Completada' : 'Pendiente'}</span>
                        <span class="agenda-tienda-tag" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:#667eea; background:#f0f4f8; padding:2px 8px; border-radius:6px; font-weight:600;">
                            <i class="fas fa-store" style="font-size:0.65rem;"></i> ${tiendaNombre}
                        </span>
                        ${fechaCompletadaFormateada ? '<span class="agenda-fecha-fin"><i class="fas fa-check-double"></i> ' + fechaCompletadaFormateada + '</span>' : ''}
                    </div>
                    ${descripcionExtraHtml}
                </div>
                <div class="agenda-acciones">
                    <button class="agenda-btn-accion editar" onclick="editarActividad(${id})" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="agenda-btn-accion eliminar" onclick="eliminarActividad(${id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function actualizarStatsAgenda() {
    const total = actividades.length;
    const pendientes = actividades.filter(a => a.estado === 'pendiente').length;
    const completadas = actividades.filter(a => a.estado === 'completada').length;

    const totalEl = document.getElementById('agendaTotal');
    const pendientesEl = document.getElementById('agendaPendientes');
    const completadasEl = document.getElementById('agendaCompletadas');

    if (totalEl) totalEl.textContent = total;
    if (pendientesEl) pendientesEl.textContent = pendientes;
    if (completadasEl) completadasEl.textContent = completadas;
}

async function cargarHistorialActividades() {
    const historial = document.getElementById('agendaHistorial');
    const paginacion = document.getElementById('agendaHistorialPaginacion');
    if (!historial) return;

    const filtroFecha = document.getElementById('agendaFiltroFecha')?.value || 'hoy';

    // Calcular rango de fechas según el filtro
    const hoy = new Date();
    let fechaDesde, fechaHasta;

    fechaHasta = hoy.toISOString().split('T')[0];

    if (filtroFecha === 'hoy') {
        fechaDesde = fechaHasta;
    } else if (filtroFecha === 'ayer') {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        fechaDesde = ayer.toISOString().split('T')[0];
        fechaHasta = fechaDesde;
    } else if (filtroFecha === 'semana') {
        const semana = new Date(hoy);
        semana.setDate(semana.getDate() - 7);
        fechaDesde = semana.toISOString().split('T')[0];
    } else if (filtroFecha === 'mes') {
        const mes = new Date(hoy);
        mes.setDate(mes.getDate() - 30);
        fechaDesde = mes.toISOString().split('T')[0];
    }

    // Cargar desde la API
    let actividadesHistorial = [];
    try {
        const tiendaUsuario = getTiendaUsuario();
        let url = '/api/actividades?estado=completada';

        // Si es operador, filtrar por tienda
        if (tiendaUsuario && !isAdmin()) {
            url += '&tienda=' + tiendaUsuario;
        }

        // Agregar filtro de fecha si aplica
        if (fechaDesde) {
            url += '&fecha_desde=' + fechaDesde;
        }
        if (fechaHasta) {
            url += '&fecha_hasta=' + fechaHasta;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                actividadesHistorial = data.actividades || [];
            }
        }
    } catch (e) {
        console.warn('Error cargando historial desde API:', e);
        // Fallback a localStorage
        actividadesHistorial = cargarHistorialLocalStorage(filtroFecha);
    }

    // Ordenar por fecha de completado (más reciente primero)
    actividadesHistorial.sort((a, b) => {
        const fechaA = a.fecha_completada || a.fechaCompletada ? new Date(a.fecha_completada || a.fechaCompletada) : new Date(0);
        const fechaB = b.fecha_completada || b.fechaCompletada ? new Date(b.fecha_completada || b.fechaCompletada) : new Date(0);
        return fechaB - fechaA;
    });

    // Guardar en cache para paginación
    actividadesHistorialCache = actividadesHistorial;
    totalPaginasHistorial = Math.ceil(actividadesHistorial.length / actividadesPorPagina) || 1;

    // Asegurar que la página actual sea válida
    if (paginaHistorial > totalPaginasHistorial) {
        paginaHistorial = totalPaginasHistorial;
    }

    renderizarHistorialPaginado();
}

// Función auxiliar para fallback a localStorage
function cargarHistorialLocalStorage(filtroFecha) {
    const hoy = new Date();
    let actividadesHistorial = [];

    if (filtroFecha === 'hoy') {
        const key = 'agenda_actividades_' + hoy.toISOString().split('T')[0];
        const guardadas = localStorage.getItem(key);
        if (guardadas) actividadesHistorial = JSON.parse(guardadas).filter(a => a.estado === 'completada');
    } else if (filtroFecha === 'ayer') {
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const key = 'agenda_actividades_' + ayer.toISOString().split('T')[0];
        const guardadas = localStorage.getItem(key);
        if (guardadas) actividadesHistorial = JSON.parse(guardadas).filter(a => a.estado === 'completada');
    } else if (filtroFecha === 'semana') {
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - i);
            const key = 'agenda_actividades_' + fecha.toISOString().split('T')[0];
            const guardadas = localStorage.getItem(key);
            if (guardadas) actividadesHistorial = actividadesHistorial.concat(JSON.parse(guardadas).filter(a => a.estado === 'completada'));
        }
    } else if (filtroFecha === 'mes') {
        for (let i = 0; i < 30; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(fecha.getDate() - i);
            const key = 'agenda_actividades_' + fecha.toISOString().split('T')[0];
            const guardadas = localStorage.getItem(key);
            if (guardadas) actividadesHistorial = actividadesHistorial.concat(JSON.parse(guardadas).filter(a => a.estado === 'completada'));
        }
    }
    return actividadesHistorial;
}

// Renderizar historial con paginación
function renderizarHistorialPaginado() {
    const historial = document.getElementById('agendaHistorial');
    const paginacion = document.getElementById('agendaHistorialPaginacion');
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnSiguiente = document.getElementById('btnPaginaSiguiente');
    const infoPagina = document.getElementById('infoPaginaHistorial');

    if (!historial) return;

    if (actividadesHistorialCache.length === 0) {
        historial.innerHTML = `
            <div class="agenda-empty">
                <i class="fas fa-inbox"></i>
                <p>No hay actividades completadas en este período</p>
            </div>
        `;
        if (paginacion) paginacion.style.display = 'none';
        return;
    }

    // Calcular slice para la página actual
    const inicio = (paginaHistorial - 1) * actividadesPorPagina;
    const fin = inicio + actividadesPorPagina;
    const actividadesPagina = actividadesHistorialCache.slice(inicio, fin);

    historial.innerHTML = actividadesPagina.map(act => {
        const fechaComp = act.fecha_completada || act.fechaCompletada ? formatearFechaHora(act.fecha_completada || act.fechaCompletada) : '';
        const descripcionExtra = act.descripcion_extra || act.descripcionExtra ? 
            `<div style="font-size:0.75rem; color:#48bb78; margin-top:4px; font-style:italic;"><i class="fas fa-comment-alt"></i> ${escapeHtml(act.descripcion_extra || act.descripcionExtra)}</div>` : '';
        return `
            <div class="agenda-historial-item">
                <div class="agenda-info">
                    <div class="agenda-descripcion">${escapeHtml(act.descripcion)}</div>
                    ${descripcionExtra}
                    <div class="agenda-meta">
                        <span class="agenda-hora-tag"><i class="far fa-clock"></i> ${act.hora}</span>
                        <span class="agenda-prioridad-tag ${act.prioridad}">${act.prioridad.toUpperCase()}</span>
                        <span class="agenda-tienda-tag">${act.tienda || 'General'}</span>
                    </div>
                </div>
                <div class="agenda-fecha-completada">
                    <i class="fas fa-check-circle"></i> ${fechaComp}
                </div>
            </div>
        `;
    }).join('');

    // Actualizar controles de paginación
    if (paginacion) paginacion.style.display = 'flex';
    if (infoPagina) infoPagina.textContent = `Página ${paginaHistorial} de ${totalPaginasHistorial} (${actividadesHistorialCache.length} actividades)`;
    if (btnAnterior) btnAnterior.disabled = paginaHistorial <= 1;
    if (btnSiguiente) btnSiguiente.disabled = paginaHistorial >= totalPaginasHistorial;
}

// Cambiar página del historial
function cambiarPaginaHistorial(direccion) {
    const nuevaPagina = paginaHistorial + direccion;
    if (nuevaPagina < 1 || nuevaPagina > totalPaginasHistorial) return;

    paginaHistorial = nuevaPagina;
    renderizarHistorialPaginado();

    // Scroll suave al inicio del historial
    const historial = document.getElementById('agendaHistorial');
    if (historial) {
        historial.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function formatearFechaHora(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Permitir agregar actividad con Enter
document.addEventListener('DOMContentLoaded', function() {
    const descripcionInput = document.getElementById('agendaDescripcion');
    if (descripcionInput) {
        descripcionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                agregarActividad();
            }
        });
    }
});




// ============================================
// DETECCION Y AJUSTE PARA MOVIL
// ============================================
function esMovil() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function ajustarVistaMovil() {
    const isMobile = esMovil();
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (isMobile) {
        // En móvil: simplificar interfaz

        // 1. Ocultar módulos de tiendas en el menú (todos)
        ['nav-caracas', 'nav-maracay', 'nav-maracaibo'].forEach(id => {
            const nav = document.getElementById(id);
            if (nav) nav.style.display = 'none';
        });

        // 2. Ocultar Actividades Pendientes
        const navActividades = document.getElementById('nav-actividades-pendientes');
        if (navActividades) navActividades.style.display = 'none';

        // 3. Mostrar solo Dashboard, Usuarios y Tasas
        ['nav-dashboard', 'nav-usuarios', 'nav-tasas'].forEach(id => {
            const nav = document.getElementById(id);
            if (nav) nav.style.display = 'flex';
        });

        // 4. Si estamos en una sección de tienda, redirigir a dashboard
        const seccionActual = localStorage.getItem('seccion_actual');
        if (seccionActual && ['clientes', 'creditos', 'pagos', 'reportes'].includes(seccionActual)) {
            mostrarSeccion('dashboard');
        }

        // 5. Ocultar sidebar por defecto en móvil (mostrar hamburguesa)
        if (sidebar) {
            sidebar.classList.add('sidebar-mobile');
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.transition = 'transform 0.3s ease';
        }

        // 6. Ajustar main content
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
        }

        // Vista móvil activada
    } else {
        // En desktop: aplicar reglas normales de rol/tienda
        ocultarMenuSegunRol();

        // Restaurar sidebar
        if (sidebar) {
            sidebar.classList.remove('sidebar-mobile');
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.width = '250px';
        }

        if (mainContent) {
            mainContent.style.marginLeft = '250px';
            mainContent.style.width = 'calc(100% - 250px)';
        }
    }
}

// Escuchar cambios de tamaño de pantalla
window.addEventListener('resize', () => {
    ajustarVistaMovil();
});

// ============================================
// ============================================
// OCULTAR MENU SEGUN ROL Y TIENDA
// ============================================
function ocultarMenuSegunRol() {
    // Si es móvil, la vista ya fue ajustada por ajustarVistaMovil()
    if (esMovil()) {
        return;
    }

    if (isAdmin()) {
        // Administrador ve todo, no ocultar nada
        return;
    }

    // --- OPERADOR: ocultar todo lo que no corresponde a su tienda ---
    const tiendaUsuario = getTiendaUsuario(); // 'caracas', 'maracay', 'maracaibo' o null

    // 1. Ocultar módulos de tiendas que NO le corresponden
    const tiendas = ['caracas', 'maracay', 'maracaibo'];
    tiendas.forEach(tienda => {
        const nav = document.getElementById('nav-' + tienda);
        if (nav) {
            // Si es operador, solo muestra su tienda asignada
            if (tiendaUsuario && tienda === tiendaUsuario) {
                nav.style.display = 'flex'; // o 'block' según el CSS
            } else {
                nav.style.display = 'none';
            }
        }
    });

    // 2. Ocultar Actividades Pendientes (solo admin)
    const navActividades = document.getElementById('nav-actividades-pendientes');
    if (navActividades) navActividades.style.display = 'none';

    // 3. Ocultar Gestión de Usuarios (solo admin)
    const navUsuarios = document.getElementById('nav-usuarios');
    if (navUsuarios) navUsuarios.style.display = 'none';

    // 4. Ocultar enlace "Ver todas →" del widget (no pueden acceder al módulo)
    const widgetLinks = document.querySelectorAll('.actividades-widget-link');
    widgetLinks.forEach(link => link.style.display = 'none');

    // 5. Si el operador NO tiene tienda asignada, ocultar todos los módulos de tienda
    if (!tiendaUsuario) {
        tiendas.forEach(tienda => {
            const nav = document.getElementById('nav-' + tienda);
            if (nav) nav.style.display = 'none';
        });
    }
}

// Alias para compatibilidad con código anterior
function ocultarActividadesSiNoAdmin() {
    ocultarMenuSegunRol();
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que se cargue el usuario y luego ajustar vista
    setTimeout(() => {
        ajustarVistaMovil(); // Esto también llama a ocultarMenuSegunRol si es desktop
    }, 300);
});

// ============================================
// ============================================
// WIDGET ACTIVIDADES - DASHBOARD
// ============================================

async function actualizarWidgetActividades() {
    const widgetList = document.getElementById('actividadesWidgetList');
    const widgetCount = document.getElementById('actividadesWidgetCount');
    if (!widgetList) return;

    // Mostrar indicador sutil de actualización
    const widgetCard = document.getElementById('widget-actividades');
    if (widgetCard) {
        widgetCard.style.transition = 'box-shadow 0.3s ease';
        widgetCard.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.3)';
        setTimeout(() => {
            widgetCard.style.boxShadow = '';
        }, 500);
    }

    // Cargar actividades desde la API (no solo localStorage)
    const hoy = new Date().toISOString().split('T')[0];
    let actividadesHoy = [];

    try {
        const tiendaUsuario = getTiendaUsuario();
        let url = '/api/actividades?fecha=' + hoy;
        if (tiendaUsuario && !isAdmin()) {
            url += '&tienda=' + tiendaUsuario;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                actividadesHoy = data.actividades || [];
            }
        }
    } catch (e) {
        console.warn('Error cargando actividades para widget:', e);
        // Fallback a localStorage
        try {
            const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
            if (guardadas) {
                actividadesHoy = JSON.parse(guardadas);
            }
        } catch (e2) {
            console.warn('Error fallback localStorage:', e2);
        }
    }

    // Filtrar por tienda del usuario si es operador (doble verificación)
    const tiendaUsuario = getTiendaUsuario();
    // Widget actividades actualizado

    if (tiendaUsuario && !isAdmin()) {
        const antes = actividadesHoy.length;
        actividadesHoy = actividadesHoy.filter(a => {
            const match = !a.tienda || a.tienda === tiendaUsuario;
            // Filtrando actividad por tienda
            return match;
        });
        // Actividades filtradas
    }

    // Filtrar solo pendientes
    const pendientes = actividadesHoy.filter(a => a.estado === 'pendiente');

    // Ordenar por hora
    pendientes.sort((a, b) => a.hora.localeCompare(b.hora));

    if (pendientes.length === 0) {
        widgetList.innerHTML = `
            <div class="actividades-widget-empty">
                <i class="fas fa-clipboard-check" style="font-size:1.5rem; margin-bottom:8px; display:block; opacity:0.5;"></i>
                <p style="margin:0; font-size:0.85rem; color:#718096;">No hay actividades pendientes</p>
                <span style="font-size:0.75rem; color:#a0aec0;">¡Tu día está libre!</span>
            </div>
        `;
        if (widgetCount) widgetCount.textContent = '0 pendientes';
        return;
    }

    // Mostrar máximo 5 actividades en el widget
    const maxMostrar = 5;
    const actividadesMostrar = pendientes.slice(0, maxMostrar);
    const restantes = pendientes.length - maxMostrar;

    widgetList.innerHTML = actividadesMostrar.map(act => {
        const prioridadColor = {
            'baja': '#e2e8f0',
            'media': '#ebf8ff',
            'alta': '#fffaf0',
            'urgente': '#fff5f5'
        }[act.prioridad] || '#e2e8f0';

        const prioridadBorder = {
            'baja': '#cbd5e1',
            'media': '#667eea',
            'alta': '#ed8936',
            'urgente': '#e53e3e'
        }[act.prioridad] || '#cbd5e1';

        const descripcionExtra = (act.descripcion_extra || act.descripcionExtra) ? 
            `<div style="font-size:0.75rem; color:#48bb78; margin-top:4px; font-style:italic; display:flex; align-items:center; gap:4px;"><i class="fas fa-comment-alt" style="font-size:0.65rem;"></i> ${escapeHtml(act.descripcion_extra || act.descripcionExtra)}</div>` : '';

        return `
            <div class="actividades-widget-item" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:${prioridadColor}; border-radius:10px; border-left:3px solid ${prioridadBorder}; transition:all 0.2s; cursor:pointer;" 
                 onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';" 
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                <div style="width:22px; height:22px; border:2px solid #cbd5e1; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:white; transition:all 0.2s; cursor:pointer;" 
                     onmouseover="this.style.borderColor='#48bb78';" 
                     onmouseout="this.style.borderColor='#cbd5e1';"
                     onclick="event.stopPropagation(); completarActividadDesdeWidget(${act.id})">
                    <i class="fas fa-check" style="font-size:0.7rem; color:#48bb78; opacity:0; transition:opacity 0.2s;"></i>
                </div>
                <div style="flex:1; min-width:0;" onclick="event.stopPropagation();">
                    <div style="font-size:0.85rem; font-weight:500; color:#2d3748; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(act.descripcion)}</div>
                    <div style="font-size:0.7rem; color:#718096; margin-top:2px; display:flex; align-items:center; gap:6px;">
                        <span><i class="far fa-clock" style="margin-right:2px;"></i> ${act.hora}</span>
                        <span style="text-transform:uppercase; font-weight:600; font-size:0.65rem; padding:1px 6px; border-radius:4px; background:white; color:#718096;">${act.prioridad}</span>
                    </div>
                    ${descripcionExtra}
                </div>
                <button onclick="event.stopPropagation(); abrirModalDescripcionWidget(${act.id})" 
                        style="flex-shrink:0; padding:4px 10px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:6px; font-size:0.7rem; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 2px 8px rgba(102,126,234,0.3)';"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                    <i class="fas fa-plus" style="margin-right:3px; font-size:0.6rem;"></i> Añadir descripción
                </button>
            </div>
        `;
    }).join('');

    if (restantes > 0) {
        const esOperador = getUserRole() === 'operador';
        const onclickHandler = esOperador ? 
            `onclick="event.stopPropagation(); mostrarModalTodasActividadesOperador(); return false;"` : 
            `onclick="mostrarSeccion('reportes'); return false;"`;

        widgetList.innerHTML += `
            <div style="text-align:center; padding:8px; font-size:0.8rem; color:#667eea; font-weight:600; cursor:pointer; border-radius:8px; transition:all 0.2s;" 
                 onmouseover="this.style.background='#f0f4f8';" 
                 onmouseout="this.style.background='none';"
                 ${onclickHandler}>
                +${restantes} actividad${restantes > 1 ? 'es' : ''} más →
            </div>
        `;
    }

    if (widgetCount) {
        widgetCount.textContent = pendientes.length + ' pendiente' + (pendientes.length > 1 ? 's' : '');
    }
}

async function completarActividadDesdeWidget(id) {
    // Completar via API primero
    try {
        const response = await fetch('/api/actividades/' + id, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ estado: 'completada' })
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();
        if (!data.exito) {
            throw new Error(data.error || 'Error al completar');
        }
    } catch (e) {
        console.warn('Error completando via API:', e);
        // Fallback a localStorage
        const hoy = new Date().toISOString().split('T')[0];
        let actividadesHoy = [];
        try {
            const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
            if (guardadas) actividadesHoy = JSON.parse(guardadas);
        } catch (e2) { console.warn('Error:', e2); return; }

        const actividad = actividadesHoy.find(a => a.id === id);
        if (!actividad || actividad.estado !== 'pendiente') return;
        actividad.estado = 'completada';
        actividad.fechaCompletada = new Date().toISOString();
        try {
            localStorage.setItem('agenda_actividades_' + hoy, JSON.stringify(actividadesHoy));
        } catch (e3) { console.warn('Error guardando:', e3); return; }
    }

    // Actualizar widget y historial
    await actualizarWidgetActividades();
    await cargarHistorialActividades();

    // Mostrar notificación sutil
    mostrarAlerta('✓ Actividad completada', 'success');

    // Si estamos en la sección de actividades, actualizar también
    const contentReportes = document.getElementById('contentReportes');
    if (contentReportes && !contentReportes.classList.contains('hidden')) {
        await cargarActividadesAPI();
        renderizarActividades();
        actualizarStatsAgenda();
        cargarHistorialActividades();
    }
}

// Actualizar widget cada vez que se muestra el dashboard
const originalMostrarSeccionWidget = mostrarSeccion;
mostrarSeccion = function(seccion) {
    originalMostrarSeccionWidget(seccion);
    if (seccion === 'dashboard') {
        actualizarWidgetActividades();
    }
};

// Actualizar widget periódicamente (cada 30 segundos)
setInterval(() => { actualizarWidgetActividades().catch(e => console.error(e)); }, 10000);

// Inicializar widget al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => { actualizarWidgetActividades().catch(e => console.error(e)); }, 500);
});


// ============================================
// MODAL AÑADIR DESCRIPCIÓN - WIDGET
// ============================================

async function abrirModalDescripcionWidget(id) {
    const hoy = new Date().toISOString().split('T')[0];
    let actividadesHoy = [];

    // Cargar desde API primero
    try {
        const response = await fetch('/api/actividades/' + id, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito && data.actividad) {
                actividadesHoy = [data.actividad];
            }
        }
    } catch (e) {
        console.warn('Error cargando desde API:', e);
    }

    // Fallback a localStorage
    if (actividadesHoy.length === 0) {
        try {
            const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
            if (guardadas) {
                actividadesHoy = JSON.parse(guardadas);
            }
        } catch (e) {
            console.warn('Error:', e);
            return;
        }
    }

    const actividad = actividadesHoy.find(a => a.id === id);
    if (!actividad) return;

    // Cerrar modal existente
    const modalExistente = document.getElementById('modal-descripcion-widget');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-descripcion-widget';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:3000; justify-content:center; align-items:center; backdrop-filter:blur(4px); padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px; padding:30px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); animation:modalIn 0.3s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="color:#1a3a5c; margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-comment-alt" style="color:#667eea;"></i> Añadir Descripción
                </h3>
                <button onclick="cerrarModalDescripcionWidget()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#718096; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.2s;" onmouseover="this.style.background='#f0f0f0';" onmouseout="this.style.background='none';">&times;</button>
            </div>
            <div style="margin-bottom:16px; padding:12px; background:#f8fafc; border-radius:10px; border-left:3px solid #667eea;">
                <div style="font-size:0.85rem; font-weight:600; color:#2d3748; margin-bottom:4px;">${escapeHtml(actividad.descripcion)}</div>
                <div style="font-size:0.75rem; color:#718096; display:flex; align-items:center; gap:8px;">
                    <span><i class="far fa-clock" style="margin-right:2px;"></i> ${actividad.hora}</span>
                    <span style="text-transform:uppercase; font-weight:600; font-size:0.65rem; padding:1px 6px; border-radius:4px; background:white; color:#718096;">${actividad.prioridad}</span>
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <label style="display:block; font-size:0.8rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Descripción adicional</label>
                <textarea id="descripcionWidgetTexto" rows="4" placeholder="Escribe aquí los detalles, instrucciones o notas adicionales para esta actividad..." style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:10px; font-size:0.95rem; resize:vertical; transition:all 0.2s; font-family:inherit;" onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)';" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';">${actividad.descripcionExtra ? escapeHtml(actividad.descripcionExtra) : ''}</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button onclick="cerrarModalDescripcionWidget()" style="padding:10px 20px; background:#f0f0f0; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; color:#666; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='#e0e0e0';" onmouseout="this.style.background='#f0f0f0';">Cancelar</button>
                <button onclick="guardarDescripcionWidget(${id})" style="padding:10px 24px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; font-weight:600; transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">Guardar Descripción</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        const textarea = document.getElementById('descripcionWidgetTexto');
        if (textarea) {
            textarea.focus();
            if (textarea.value) {
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }
        }
    }, 100);
}

function cerrarModalDescripcionWidget() {
    const modal = document.getElementById('modal-descripcion-widget');
    if (modal) modal.remove();
}

async function guardarDescripcionWidget(id) {
    const textarea = document.getElementById('descripcionWidgetTexto');
    if (!textarea) return;

    const descripcion_extra = textarea.value.trim();

    showLoading(true);

    try {
        const response = await fetch('/api/actividades/' + id, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ descripcion_extra: descripcion_extra })
        });

        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }

        const data = await response.json();

        if (data.exito) {
            // Actualizar widget
            await actualizarWidgetActividades();

            // Si estamos en la sección de actividades, actualizar también
            const contentReportes = document.getElementById('contentReportes');
            if (contentReportes && !contentReportes.classList.contains('hidden')) {
                await cargarActividadesAPI();
                renderizarActividades();
            }

            cerrarModalDescripcionWidget();
            mostrarAlerta('Descripción añadida exitosamente', 'success');
        } else {
            throw new Error(data.error || 'Error al guardar descripción');
        }
    } catch (e) {
        console.error('Error guardando descripción:', e);
        mostrarAlerta('Error: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// MODAL TODAS ACTIVIDADES - PARA OPERADORES
// ============================================

async function mostrarModalTodasActividadesOperador() {
    const hoy = new Date().toISOString().split('T')[0];
    let actividadesHoy = [];

    // Cargar desde API primero
    try {
        const tiendaUsuario = getTiendaUsuario();
        let url = '/api/actividades?fecha=' + hoy;
        if (tiendaUsuario && !isAdmin()) {
            url += '&tienda=' + tiendaUsuario;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                actividadesHoy = data.actividades || [];
            }
        }
    } catch (e) {
        console.warn('Error cargando desde API:', e);
        // Fallback a localStorage
        try {
            const guardadas = localStorage.getItem('agenda_actividades_' + hoy);
            if (guardadas) {
                actividadesHoy = JSON.parse(guardadas);
            }
        } catch (e2) {
            console.warn('Error:', e2);
        }
    }

    // Filtrar por tienda del usuario si es operador
    const tiendaUsuario = getTiendaUsuario();
    // Widget actividades actualizado

    if (tiendaUsuario && !isAdmin()) {
        const antes = actividadesHoy.length;
        actividadesHoy = actividadesHoy.filter(a => {
            const match = !a.tienda || a.tienda === tiendaUsuario;
            // Filtrando actividad por tienda
            return match;
        });
        // Actividades filtradas
    }

    const pendientes = actividadesHoy.filter(a => a.estado === 'pendiente');
    pendientes.sort((a, b) => a.hora.localeCompare(b.hora));

    let listaHtml = '';
    if (pendientes.length === 0) {
        listaHtml = `
            <div style="text-align:center; padding:40px 20px; color:#a0aec0;">
                <i class="fas fa-clipboard-check" style="font-size:3rem; margin-bottom:12px; display:block; opacity:0.5;"></i>
                <p style="font-size:1rem; font-weight:600; margin-bottom:4px;">No hay actividades pendientes</p>
                <span style="font-size:0.85rem;">¡Tu día está libre!</span>
            </div>
        `;
    } else {
        listaHtml = pendientes.map(act => {
            const prioridadBorder = {
                'baja': '#cbd5e1',
                'media': '#667eea',
                'alta': '#ed8936',
                'urgente': '#e53e3e'
            }[act.prioridad] || '#cbd5e1';

            const descripcionExtra = act.descripcionExtra ? 
                `<div style="font-size:0.8rem; color:#48bb78; margin-top:6px; font-style:italic; padding:6px 10px; background:#f0fff4; border-radius:6px; display:flex; align-items:center; gap:6px;"><i class="fas fa-comment-alt" style="font-size:0.7rem;"></i> ${escapeHtml(act.descripcionExtra)}</div>` : '';

            return `
                <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:#f8fafc; border-radius:12px; border-left:3px solid ${prioridadBorder}; margin-bottom:10px; transition:all 0.2s;"
                     onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';" 
                     onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                    <div style="width:24px; height:24px; border:2px solid #cbd5e1; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:white; cursor:pointer; transition:all 0.2s; margin-top:2px;"
                         onmouseover="this.style.borderColor='#48bb78';" 
                         onmouseout="this.style.borderColor='#cbd5e1';"
                         onclick="completarActividadDesdeModalOperador(${act.id})">
                        <i class="fas fa-check" style="font-size:0.8rem; color:#48bb78; opacity:0; transition:opacity 0.2s;"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:0.95rem; font-weight:500; color:#2d3748; margin-bottom:4px;">${escapeHtml(act.descripcion)}</div>
                        <div style="font-size:0.75rem; color:#718096; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                            <span style="display:flex; align-items:center; gap:4px;"><i class="far fa-clock"></i> ${act.hora}</span>
                            <span style="text-transform:uppercase; font-weight:600; font-size:0.65rem; padding:2px 8px; border-radius:4px; background:#e2e8f0; color:#64748b;">${act.prioridad}</span>
                        </div>
                        ${descripcionExtra}
                    </div>
                    <button onclick="abrirModalDescripcionWidget(${act.id})" 
                            style="flex-shrink:0; padding:6px 12px; background:linear-gradient(135deg, #667eea, #764ba2); color:white; border:none; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap; margin-top:2px;"
                            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 2px 8px rgba(102,126,234,0.3)';"
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <i class="fas fa-plus" style="margin-right:3px; font-size:0.6rem;"></i> Añadir descripción
                    </button>
                </div>
            `;
        }).join('');
    }

    mostrarModalCorporativo(
        'Mis Actividades Pendientes',
        `<div style="max-height:400px; overflow-y:auto; padding-right:8px;">${listaHtml}</div>`,
        'info',
        [{
            texto: 'Cerrar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]
    );
}

async function completarActividadDesdeModalOperador(id) {
    await completarActividadDesdeWidget(id);

    // Recargar el modal después de completar
    setTimeout(() => {
        mostrarModalTodasActividadesOperador();
    }, 300);
}

// ============================================
// EXPORTAR A PDF
// ============================================
function exportToPDF() {
    // Detectar qué sección está activa para exportar los datos correctos
    const seccionActual = localStorage.getItem('seccion_actual') || 'dashboard';

    let titulo = 'Reporte';
    let headers = [];
    let rows = [];
    let filename = 'reporte_' + new Date().toISOString().split('T')[0] + '.pdf';

    // Según la sección activa, obtener los datos
    if (seccionActual === 'clientes' || document.getElementById('contentClientes')?.classList.contains('active')) {
        titulo = 'Busqueda Tienda Caracas';
        headers = [['Nro', 'Factura', 'Nombre', 'Cédula', 'Monto Factura', 'Cuotas', 'Deuda', 'Estado']];

        const tabla = document.querySelector('#contentClientes table, .tienda-caracas-table');
        if (tabla) {
            const filas = tabla.querySelectorAll('tbody tr');
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll('td');
                if (celdas.length > 0) {
                    rows.push(Array.from(celdas).slice(0, 8).map(c => c.textContent.trim()));
                }
            });
        }

        filename = 'busqueda_caracas_' + new Date().toISOString().split('T')[0] + '.pdf';

    } else if (seccionActual === 'creditos' || document.getElementById('contentCreditos')?.classList.contains('active')) {
        titulo = 'Reporte Tienda Maracay';
        headers = [['Nro', 'Factura', 'Nombre', 'Cédula', 'Monto', 'Cuotas', 'Deuda', 'Estado']];

        const tabla = document.querySelector('#contentCreditos table, .tienda-maracay-table');
        if (tabla) {
            const filas = tabla.querySelectorAll('tbody tr');
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll('td');
                if (celdas.length > 0) {
                    rows.push(Array.from(celdas).slice(0, 8).map(c => c.textContent.trim()));
                }
            });
        }

        filename = 'reporte_maracay_' + new Date().toISOString().split('T')[0] + '.pdf';

    } else if (seccionActual === 'pagos' || document.getElementById('contentPagos')?.classList.contains('active')) {
        titulo = 'Reporte Tienda Maracaibo';
        headers = [['Nro', 'Factura', 'Nombre', 'Cédula', 'Monto', 'Cuotas', 'Deuda', 'Estado']];

        const tabla = document.querySelector('#contentPagos table, .tienda-maracaibo-table');
        if (tabla) {
            const filas = tabla.querySelectorAll('tbody tr');
            filas.forEach(fila => {
                const celdas = fila.querySelectorAll('td');
                if (celdas.length > 0) {
                    rows.push(Array.from(celdas).slice(0, 8).map(c => c.textContent.trim()));
                }
            });
        }

        filename = 'reporte_maracaibo_' + new Date().toISOString().split('T')[0] + '.pdf';

    } else if (seccionActual === 'reportes' || document.getElementById('contentReportes')?.classList.contains('active')) {
        titulo = 'Reporte de Actividades';
        headers = [['Descripción', 'Hora', 'Prioridad', 'Tienda', 'Estado', 'Fecha']];

        const filtro = filtroActividades || 'todas';
        let actividadesExportar = actividades || [];

        if (filtro === 'pendientes') {
            actividadesExportar = actividadesExportar.filter(a => a.estado === 'pendiente');
            titulo = 'Actividades Pendientes';
        } else if (filtro === 'completadas') {
            actividadesExportar = actividadesExportar.filter(a => a.estado === 'completada');
            titulo = 'Actividades Completadas';
        }

        rows = actividadesExportar.map(a => [
            a.descripcion || '',
            a.hora || '',
            (a.prioridad || '').toUpperCase(),
            a.tienda || '',
            a.estado === 'completada' ? 'Completada' : 'Pendiente',
            a.fecha || new Date().toISOString().split('T')[0]
        ]);

        filename = 'actividades_' + new Date().toISOString().split('T')[0] + '.pdf';

    } else {
        titulo = 'Resumen del Sistema';
        headers = [['Concepto', 'Valor']];
        rows = [
            ['Fecha', new Date().toLocaleDateString('es-VE')],
            ['Hora', new Date().toLocaleTimeString('es-VE')],
            ['Total Actividades Hoy', (actividades || []).length.toString()],
            ['Pendientes', (actividades || []).filter(a => a.estado === 'pendiente').length.toString()],
            ['Completadas', (actividades || []).filter(a => a.estado === 'completada').length.toString()],
        ];
        filename = 'resumen_' + new Date().toISOString().split('T')[0] + '.pdf';
    }

    // Generar PDF con jsPDF
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        mostrarAlerta('Error: Librería PDF no cargada. Recarga la página.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
    const doc = new jsPDF('l', 'mm', 'a4');

    // Encabezado
    doc.setFontSize(18);
    doc.setTextColor(26, 54, 93);
    doc.text(titulo, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generado: ' + new Date().toLocaleString('es-VE'), 14, 28);
    doc.text('Usuario: ' + (usuarioActual?.nombre || 'Administrador'), 14, 33);

    doc.setDrawColor(26, 54, 93);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 280, 36);

    // Tabla
    if (typeof doc.autoTable === 'function') {
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 42,
            theme: 'striped',
            headStyles: {
                fillColor: [26, 54, 93],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [50, 50, 50]
            },
            alternateRowStyles: {
                fillColor: [240, 248, 255]
            },
            margin: { top: 42, left: 14, right: 14 },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            didDrawPage: function(data) {
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('Inversora IPSFA - Sistema de Créditos', 14, doc.internal.pageSize.height - 10);
                doc.text('Página ' + data.pageNumber, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
            }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        let y = 45;
        rows.forEach(row => {
            doc.text(row.join(' | '), 14, y);
            y += 7;
        });
    }

    doc.save(filename);
    mostrarAlerta('PDF exportado correctamente', 'success');
}


// ============================================
// REPORTES TIENDA CARACAS (INTEGRADO EN PANEL)
// ============================================

let datosBusquedaCaracas = [];
let resumenBusquedaCaracas = {};
let paginaBusqueda = 1;
let registrosPorPaginaBusqueda = 10;
let totalPaginasBusqueda = 1;

function mostrarBusqueda() {
    document.getElementById('tc-menu-principal').style.display = 'none';
    document.getElementById('tc-base-datos').style.display = 'none';
    document.getElementById('tc-conciliaciones').style.display = 'none';
    document.getElementById('tc-busqueda').style.display = 'block';

    // Set fechas por defecto
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('busq-fecha-desde').value = primerDia.toISOString().split('T')[0];
    document.getElementById('busq-fecha-hasta').value = hoy.toISOString().split('T')[0];
}

async function generarBusquedaCaracas() {
    showLoading(true);

    try {
        const filtros = {
            fecha_desde: document.getElementById('busq-fecha-desde').value || null,
            fecha_hasta: document.getElementById('busq-fecha-hasta').value || null,
            estado: document.getElementById('busq-estado').value,
            monto_min: document.getElementById('busq-monto-min').value || null,
            monto_max: document.getElementById('busq-monto-max').value || null,
            nombre_cliente: document.getElementById('busq-nombre').value || null
        };

        const response = await fetch('/api/reportes/caracas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(filtros)
        });

        const data = await response.json();

        if (!data.exito) {
            throw new Error(data.error || 'Error al generar reporte');
        }

        datosBusquedaCaracas = data.datos || [];
        resumenBusquedaCaracas = data.resumen || {};

        // Mostrar resumen
        document.getElementById('busq-resumen').style.display = 'grid';
        document.getElementById('busq-res-total').textContent = formatNumber(resumenBusquedaCaracas.total_clientes || 0);
        document.getElementById('busq-res-deuda').textContent = formatCurrency(resumenBusquedaCaracas.total_deuda || 0);
        document.getElementById('busq-res-pagado').textContent = formatCurrency(resumenBusquedaCaracas.total_depositado || 0);
        document.getElementById('busq-res-mora').textContent = formatNumber(resumenBusquedaCaracas.clientes_mora || 0);
        document.getElementById('busq-res-promedio').textContent = formatCurrency(resumenBusquedaCaracas.promedio_deuda || 0);

        // Mostrar tabla
        document.getElementById('busq-tabla-container').style.display = 'block';
        document.getElementById('busq-contador').textContent = datosBusquedaCaracas.length + ' registros';

        const tbody = document.getElementById('busq-tbody');
        // Inicializar paginación
        paginaBusqueda = 1;
        registrosPorPaginaBusqueda = 10;
        totalPaginasBusqueda = Math.ceil(datosBusquedaCaracas.length / registrosPorPaginaBusqueda) || 1;

        // Renderizar tabla paginada
        renderizarTablaBusqueda();

        // Mostrar gráficos
        document.getElementById('busq-graficos').style.display = 'grid';
        renderizarGraficosBusqueda();

        // Mostrar exportar
        document.getElementById('busq-exportar').style.display = 'block';

        mostrarAlerta('Busqueda generada: ' + data.total + ' registros', 'success');

    } catch (e) {
        console.error('Error:', e);
        mostrarAlerta('Error: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

function calcularEstadoBusqueda(row) {
    const deuda = parseFloat(row.deuda) || 0;
    const depositado = parseFloat(row.monto_depositados) || 0;
    const total = parseFloat(row.monto_factura) || 0;
    const fecha = new Date(row.fecha_factura);
    const dias = (new Date() - fecha) / (1000 * 60 * 60 * 24);

    if (deuda <= 0 || depositado >= total) {
        return { texto: 'Pagado', style: 'background:#d1fae5;color:#059669;' };
    }
    if (dias > 30 && deuda > 0) {
        return { texto: 'En Mora', style: 'background:#fee2e2;color:#dc2626;' };
    }
    return { texto: 'Pendiente', style: 'background:#fef3c7;color:#d97706;' };
}

function renderizarGraficosBusqueda() {
    const porEstado = {
        pendiente: datosBusquedaCaracas.filter(r => calcularEstadoBusqueda(r).texto === 'Pendiente').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0),
        pagado: datosBusquedaCaracas.filter(r => calcularEstadoBusqueda(r).texto === 'Pagado').reduce((s, r) => s + (parseFloat(r.monto_depositados) || 0), 0),
        mora: datosBusquedaCaracas.filter(r => calcularEstadoBusqueda(r).texto === 'En Mora').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0)
    };

    const maxValor = Math.max(porEstado.pendiente, porEstado.pagado, porEstado.mora, 1);

    document.getElementById('busq-graf-barras').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pendiente</div>
                <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                    <div style="height:100%;width:${(porEstado.pendiente/maxValor*100)}%;background:linear-gradient(90deg,#f6e05e,#d69e2e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                        <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pendiente)}</span>
                    </div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pagado</div>
                <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                    <div style="height:100%;width:${(porEstado.pagado/maxValor*100)}%;background:linear-gradient(90deg,#68d391,#38a169);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                        <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pagado)}</span>
                    </div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">En Mora</div>
                <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                    <div style="height:100%;width:${(porEstado.mora/maxValor*100)}%;background:linear-gradient(90deg,#fc8181,#e53e3e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                        <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.mora)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const total = resumenBusquedaCaracas.total_facturado || 1;
    const pagadoPct = ((resumenBusquedaCaracas.total_depositado || 0) / total * 100).toFixed(1);
    const pendientePct = ((resumenBusquedaCaracas.total_deuda || 0) / total * 100).toFixed(1);

    document.getElementById('busq-graf-pastel').innerHTML = `
        <div style="position:relative;width:180px;height:180px;">
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="20"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#48bb78" stroke-width="20" 
                    stroke-dasharray="${pagadoPct * 2.51} 251" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f56565" stroke-width="20" 
                    stroke-dasharray="${pendientePct * 2.51} 251" 
                    stroke-dashoffset="${-pagadoPct * 2.51}" stroke-linecap="round"/>
            </svg>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;font-size:13px;">
                <div style="width:16px;height:16px;border-radius:4px;background:#48bb78;"></div>
                <span style="color:#4a5568;">Pagado</span>
                <span style="font-weight:600;color:#1a365d;margin-left:auto;">${pagadoPct}%</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;font-size:13px;">
                <div style="width:16px;height:16px;border-radius:4px;background:#f56565;"></div>
                <span style="color:#4a5568;">Pendiente</span>
                <span style="font-weight:600;color:#1a365d;margin-left:auto;">${pendientePct}%</span>
            </div>
        </div>
    `;
}


// ============================================
// RENDERIZAR TABLA DE BÚSQUEDA CON PAGINACIÓN
// ============================================
function renderizarTablaBusqueda() {
    const tbody = document.getElementById('busq-tbody');
    const contador = document.getElementById('busq-contador');
    if (!tbody) return;

    // Calcular índices para la página actual
    const inicio = (paginaBusqueda - 1) * registrosPorPaginaBusqueda;
    const fin = inicio + registrosPorPaginaBusqueda;
    const datosPagina = datosBusquedaCaracas.slice(inicio, fin);
    totalPaginasBusqueda = Math.ceil(datosBusquedaCaracas.length / registrosPorPaginaBusqueda) || 1;

    if (contador) {
        contador.textContent = datosBusquedaCaracas.length + ' registros (Página ' + paginaBusqueda + ' de ' + totalPaginasBusqueda + ')';
    }

    if (datosPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#718096;">No hay registros que coincidan con los filtros</td></tr>';
        return;
    }

    tbody.innerHTML = datosPagina.map((row, i) => {
        const estado = calcularEstadoBusqueda(row);
        const numeroReal = inicio + i + 1;
        return `<tr>
            <td>${numeroReal}</td>
            <td>${row.nro_factura || '-'}</td>
            <td>${row.nombre_apellido || '-'}</td>
            <td>${row.cedula || '-'}</td>
            <td style="text-align:right;font-family:monospace;font-weight:600;">${formatCurrency(row.monto_factura || 0)}</td>
            <td>${row.cuotas || '-'}</td>
            <td style="text-align:right;font-family:monospace;color:#38a169;">${formatCurrency(row.monto_depositados || 0)}</td>
            <td style="text-align:right;font-family:monospace;color:#e53e3e;">${formatCurrency(row.deuda || 0)}</td>
            <td><span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;${estado.style}">${estado.texto}</span></td>
            <td>${formatearFecha(row.fecha_factura)}</td>
        </tr>`;
    }).join('');

    // Actualizar controles de paginación
    actualizarControlesPaginacionBusqueda();
}

function actualizarControlesPaginacionBusqueda() {
    // Eliminar paginación anterior si existe
    const paginacionAnterior = document.getElementById('busq-paginacion');
    if (paginacionAnterior) paginacionAnterior.remove();

    if (totalPaginasBusqueda <= 1) return;

    const tablaContainer = document.getElementById('busq-tabla-container');
    if (!tablaContainer) return;

    const paginacionDiv = document.createElement('div');
    paginacionDiv.id = 'busq-paginacion';
    paginacionDiv.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;padding:15px;border-top:1px solid #e2e8f0;';

    // Botón Primera
    const btnPrimera = crearBotonPaginacion('|<', () => irAPaginaBusqueda(1), paginaBusqueda === 1);
    paginacionDiv.appendChild(btnPrimera);

    // Botón Anterior
    const btnAnterior = crearBotonPaginacion('<', () => irAPaginaBusqueda(paginaBusqueda - 1), paginaBusqueda === 1);
    paginacionDiv.appendChild(btnAnterior);

    // Info de página
    const infoPagina = document.createElement('span');
    infoPagina.style.cssText = 'font-size:13px;color:#64748b;font-weight:500;margin:0 10px;';
    infoPagina.textContent = 'Página ' + paginaBusqueda + ' de ' + totalPaginasBusqueda;
    paginacionDiv.appendChild(infoPagina);

    // Botón Siguiente
    const btnSiguiente = crearBotonPaginacion('>', () => irAPaginaBusqueda(paginaBusqueda + 1), paginaBusqueda >= totalPaginasBusqueda);
    paginacionDiv.appendChild(btnSiguiente);

    // Botón Última
    const btnUltima = crearBotonPaginacion('>|', () => irAPaginaBusqueda(totalPaginasBusqueda), paginaBusqueda >= totalPaginasBusqueda);
    paginacionDiv.appendChild(btnUltima);

    // Select de registros por página
    const selectLabel = document.createElement('span');
    selectLabel.style.cssText = 'font-size:12px;color:#718096;margin-left:15px;';
    selectLabel.textContent = 'Mostrar:';
    paginacionDiv.appendChild(selectLabel);

    const selectRegistros = document.createElement('select');
    selectRegistros.style.cssText = 'padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;';
    [10, 25, 50, 100].forEach(num => {
        const option = document.createElement('option');
        option.value = num;
        option.textContent = num;
        if (num === registrosPorPaginaBusqueda) option.selected = true;
        selectRegistros.appendChild(option);
    });
    selectRegistros.onchange = function() {
        registrosPorPaginaBusqueda = parseInt(this.value);
        paginaBusqueda = 1;
        totalPaginasBusqueda = Math.ceil(datosBusquedaCaracas.length / registrosPorPaginaBusqueda) || 1;
        renderizarTablaBusqueda();
    };
    paginacionDiv.appendChild(selectRegistros);

    tablaContainer.appendChild(paginacionDiv);
}

function crearBotonPaginacion(texto, onClick, disabled) {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.style.cssText = 'padding:8px 14px;border:1px solid #e2e8f0;background:white;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#4a5568;transition:all 0.2s;';
    if (disabled) {
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.disabled = true;
    } else {
        btn.onmouseover = function() { this.style.background = '#1a365d'; this.style.color = 'white'; this.style.borderColor = '#1a365d'; };
        btn.onmouseout = function() { this.style.background = 'white'; this.style.color = '#4a5568'; this.style.borderColor = '#e2e8f0'; };
        btn.onclick = onClick;
    }
    return btn;
}

function irAPaginaBusqueda(pagina) {
    if (pagina < 1 || pagina > totalPaginasBusqueda) return;
    paginaBusqueda = pagina;
    renderizarTablaBusqueda();
    // Scroll suave al inicio de la tabla
    const tablaContainer = document.getElementById('busq-tabla-container');
    if (tablaContainer) tablaContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limpiarFiltrosBusqueda() {
    document.getElementById('busq-fecha-desde').value = '';
    document.getElementById('busq-fecha-hasta').value = '';
    document.getElementById('busq-estado').value = 'todos';
    document.getElementById('busq-monto-min').value = '';
    document.getElementById('busq-monto-max').value = '';
    document.getElementById('busq-nombre').value = '';

    document.getElementById('busq-resumen').style.display = 'none';
    document.getElementById('busq-tabla-container').style.display = 'none';
    document.getElementById('busq-graficos').style.display = 'none';
    document.getElementById('busq-exportar').style.display = 'none';

    // Limpiar paginación
    const paginacionAnterior = document.getElementById('busq-paginacion');
    if (paginacionAnterior) paginacionAnterior.remove();
    paginaBusqueda = 1;
    totalPaginasBusqueda = 1;
}

function exportarBusquedaExcel() {
    if (datosBusquedaCaracas.length === 0) {
        mostrarAlerta('No hay datos para exportar', 'error');
        return;
    }

    const datosExcel = datosBusquedaCaracas.map(row => ({
        'Nro Factura': row.nro_factura || '',
        'Cliente': row.nombre_apellido || '',
        'Cédula': row.cedula || '',
        'Monto Factura': parseFloat(row.monto_factura) || 0,
        'Cuotas': row.cuotas || '',
        'Depositado': parseFloat(row.monto_depositados) || 0,
        'Deuda': parseFloat(row.deuda) || 0,
        'Estado': calcularEstadoBusqueda(row).texto,
        'Fecha Factura': row.fecha_factura || ''
    }));

    datosExcel.push({});
    datosExcel.push({
        'Nro Factura': 'RESUMEN',
        'Cliente': 'Total Clientes: ' + resumenBusquedaCaracas.total_clientes,
        'Monto Factura': resumenBusquedaCaracas.total_facturado,
        'Depositado': resumenBusquedaCaracas.total_depositado,
        'Deuda': resumenBusquedaCaracas.total_deuda,
        'Estado': 'Clientes Mora: ' + resumenBusquedaCaracas.clientes_mora
    });

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Caracas');
    ws['!cols'] = [{wch:12},{wch:30},{wch:15},{wch:15},{wch:10},{wch:15},{wch:15},{wch:12},{wch:15}];
    XLSX.writeFile(wb, 'busqueda_caracas_' + new Date().toISOString().split('T')[0] + '.xlsx');
    mostrarAlerta('Excel exportado correctamente', 'success');
}

function exportarBusquedaPDF() {
    if (datosBusquedaCaracas.length === 0) {
        mostrarAlerta('No hay datos para exportar', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // ============================================
    // FUNCION PARA CARGAR LOGO COMO BASE64
    // ============================================
    function cargarLogoComoBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = function() {
                reject(new Error('No se pudo cargar el logo'));
            };
            img.src = url;
        });
    }

    // ============================================
    // GENERAR PDF
    // ============================================
    async function generarPDF() {
        let logoBase64 = null;
        try {
            logoBase64 = await cargarLogoComoBase64('assets/logo.png');
        } catch (e) {
            console.log('Logo no disponible, continuando sin logo');
        }

        // --- ENCABEZADO ---
        let currentY = 12;

        // Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', margin, currentY, 50, 38);
        }

        // Titulo centrado (al lado del logo, centrado verticalmente)
        doc.setFontSize(20);
        doc.setTextColor(26, 54, 93);
        doc.setFont('helvetica', 'bold');
        const titulo = 'Gestion de Creditos Inversora IPSFA C.A';
        const tituloWidth = doc.getTextWidth(titulo);
        doc.text(titulo, (pageWidth - tituloWidth) / 2, currentY + 16);

        // Subtitulo centrado
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        const subtitulo = 'Reporte de Busqueda Tienda Caracas';
        const subtituloWidth = doc.getTextWidth(subtitulo);
        doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, currentY + 24);

        // Fecha y total centrados
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const fechaTexto = 'Fecha: ' + new Date().toLocaleDateString('es-VE') + '  |  Hora: ' + new Date().toLocaleTimeString('es-VE') + '  |  Total Registros: ' + datosBusquedaCaracas.length;
        const fechaWidth = doc.getTextWidth(fechaTexto);
        doc.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY + 32);

        currentY += 48;

        // Linea separadora
        doc.setDrawColor(26, 54, 93);
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);

        currentY += 8;

        // --- TABLA DE DATOS (sin Cuotas y sin Estado) ---
        const headers = [['Nro', 'Factura', 'Cliente', 'Cedula', 'Telefono', 'Monto', 'Depositado', 'Deuda', 'Fecha']];
        const rows = datosBusquedaCaracas.map((row, i) => [
            i + 1, 
            row.nro_factura || '-', 
            row.nombre_apellido || '-', 
            row.cedula || '-', 
            row.telefono || '-',
            formatCurrency(row.monto_factura || 0), 
            formatCurrency(row.monto_depositados || 0), 
            formatCurrency(row.deuda || 0),
            formatearFecha(row.fecha_factura)
        ]);

        // Calcular anchos de columnas proporcionales al ancho total
        const colNro = 10;
        const colFactura = 18;
        const colCliente = 50;
        const colCedula = 22;
        const colTelefono = 25;
        const colMonto = 28;
        const colDepositado = 28;
        const colDeuda = 28;
        const colFecha = 22;
        const totalColWidth = colNro + colFactura + colCliente + colCedula + colTelefono + colMonto + colDepositado + colDeuda + colFecha;

        // Ajustar al ancho del contenido
        const scaleFactor = contentWidth / totalColWidth;

        doc.autoTable({
            head: headers, 
            body: rows, 
            startY: currentY, 
            theme: 'striped',
            headStyles: { 
                fillColor: [26, 54, 93], 
                textColor: [255, 255, 255], 
                fontSize: 9, 
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle'
            },
            bodyStyles: { 
                fontSize: 8, 
                textColor: [50, 50, 50],
                valign: 'middle'
            },
            alternateRowStyles: { fillColor: [240, 248, 255] },
            margin: { top: 20, left: margin, right: margin },
            styles: { 
                overflow: 'linebreak', 
                cellWidth: 'wrap',
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            columnStyles: { 
                0: {cellWidth: colNro * scaleFactor, halign: 'center'}, 
                1: {cellWidth: colFactura * scaleFactor, halign: 'center'}, 
                2: {cellWidth: colCliente * scaleFactor, halign: 'left'}, 
                3: {cellWidth: colCedula * scaleFactor, halign: 'center'}, 
                4: {cellWidth: colTelefono * scaleFactor, halign: 'center'},
                5: {cellWidth: colMonto * scaleFactor, halign: 'right'}, 
                6: {cellWidth: colDepositado * scaleFactor, halign: 'right'}, 
                7: {cellWidth: colDeuda * scaleFactor, halign: 'right'}, 
                8: {cellWidth: colFecha * scaleFactor, halign: 'center'}
            },
            didDrawPage: function(data) {
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('Inversora IPSFA - Sistema de Creditos', margin, pageHeight - 10);
                doc.text('Pagina ' + data.pageNumber, pageWidth - margin - 20, pageHeight - 10);
            }
        });

        // --- LEYENDA DE SUMATORIAS AL FINAL ---
        const finalY = doc.lastAutoTable.finalY + 10;

        // Calcular sumatorias
        const totalFacturado = datosBusquedaCaracas.reduce((sum, r) => sum + (parseFloat(r.monto_factura) || 0), 0);
        const totalDepositado = datosBusquedaCaracas.reduce((sum, r) => sum + (parseFloat(r.monto_depositados) || 0), 0);
        const totalDeuda = datosBusquedaCaracas.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0);

        // Verificar si hay espacio suficiente, si no, agregar nueva página
        if (finalY + 50 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY = finalY;
        }

        // Fondo del resumen (mismo ancho que la tabla)
        const resumenHeight = 42;
        doc.setFillColor(26, 54, 93);
        doc.rect(margin, currentY, contentWidth, resumenHeight, 'F');

        // Titulo del resumen centrado
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        const tituloResumen = 'TOTALES DEL REPORTE';
        const tituloResumenWidth = doc.getTextWidth(tituloResumen);
        doc.text(tituloResumen, (pageWidth - tituloResumenWidth) / 2, currentY + 8);

        // Linea separadora
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.3);
        doc.line(margin + 5, currentY + 12, pageWidth - margin - 5, currentY + 12);

        // Tres columnas de sumatorias distribuidas equitativamente
        const colWidth = contentWidth / 3;
        const col1X = margin + 10;
        const col2X = margin + colWidth + 10;
        const col3X = margin + (colWidth * 2) + 10;

        // Etiquetas
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL MONTO FACTURADO', col1X, currentY + 20);
        doc.text('TOTAL DEPOSITADO', col2X, currentY + 20);
        doc.text('TOTAL DEUDA PENDIENTE', col3X, currentY + 20);

        // Valores
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(251, 191, 36); // Amarillo
        doc.text(formatCurrency(totalFacturado), col1X, currentY + 30);

        doc.setTextColor(74, 222, 128); // Verde
        doc.text(formatCurrency(totalDepositado), col2X, currentY + 30);

        doc.setTextColor(248, 113, 113); // Rojo
        doc.text(formatCurrency(totalDeuda), col3X, currentY + 30);

        // Total clientes centrado
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        const clientesTexto = datosBusquedaCaracas.length + ' clientes en el reporte';
        const clientesWidth = doc.getTextWidth(clientesTexto);
        doc.text(clientesTexto, (pageWidth - clientesWidth) / 2, currentY + 38);

        doc.save('busqueda_caracas_' + new Date().toISOString().split('T')[0] + '.pdf');
        mostrarAlerta('PDF exportado correctamente', 'success');
    }

    generarPDF().catch(err => {
        console.error('Error generando PDF:', err);
        mostrarAlerta('Error al generar PDF: ' + err.message, 'error');
    });
}function volverMenuPrincipalCaracas() {
    document.getElementById('tc-base-datos').style.display = 'none';
    document.getElementById('tc-conciliaciones').style.display = 'none';
    document.getElementById('tc-busqueda').style.display = 'none';
    document.getElementById('tc-menu-principal').style.display = 'grid';
}

