/**
 * TIENDA CARACAS - MÓDULO DE GESTIÓN
 * Lógica de filtros, búsqueda, paginación y conexión a API
 */

// ==================== CONFIGURACIÓN ====================
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta según tu backend
const ITEMS_PER_PAGE_DEFAULT = 25;

// ==================== ESTADO ====================
let allData = [];           // Todos los datos cargados
let filteredData = [];      // Datos filtrados actualmente
let currentPage = 1;
let itemsPerPage = ITEMS_PER_PAGE_DEFAULT;
let currentFilter = 'all';  // Filtro activo

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Tienda Caracas - Módulo iniciado');

    // Cargar datos desde el backend
    await loadData();

    // Inicializar eventos
    initEventListeners();

    // Actualizar resumen
    updateSummary();

    // Renderizar tabla inicial
    renderTable();

    // Actualizar contadores de filtros
    updateFilterCounts();
});

// ==================== CARGA DE DATOS ====================
async function loadData() {
    showLoading(true);

    try {
        // Intentar cargar desde la API
        const response = await fetch(`${API_BASE_URL}/tienda-caracas`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        allData = await response.json();
        filteredData = [...allData];

        console.log(`✅ ${allData.length} registros cargados`);

    } catch (error) {
        console.warn('⚠️ No se pudo conectar al backend:', error);
        console.log('📦 Usando datos de ejemplo...');

        // Datos de ejemplo para pruebas (quitar en producción)
        allData = getSampleData();
        filteredData = [...allData];
    }

    showLoading(false);
}

// Datos de ejemplo para pruebas (eliminar cuando el backend esté listo)
function getSampleData() {
    return [
        {
            id: 1, numero: 1, nro_factura: '7693',
            nombre_apellido: 'ANDRES AELINO MANZANO SOTO',
            monto_factura: 10836.23, fecha_factura: '2025-02-17',
            cedula: '7959439', monto_pendiente: null,
            monto_depositados: null, deuda: null,
            cuota_1: 1862.10, fecha_cuota_1: '2025-02-17', tasa_cuota_1: 62.07,
            cuota_2: 2460.00, fecha_cuota_2: '2025-03-17', tasa_cuota_2: 66.55,
            cuota_3: 2850.00, fecha_cuota_3: '2025-04-15', tasa_cuota_3: 78.59,
            cuota_4: 3440.00, fecha_cuota_4: '2025-05-19', tasa_cuota_4: 94.76,
            cuota_5: 224.19, fecha_cuota_5: '2026-01-20', tasa_cuota_5: 344.50
        },
        {
            id: 2, numero: 2, nro_factura: '7965',
            nombre_apellido: 'JAIER ENRIQUE CASTILLO ILLEGAS',
            monto_factura: 14318.24, fecha_factura: '2025-03-06',
            cedula: '14247261', monto_pendiente: null,
            monto_depositados: null, deuda: null,
            cuota_1: 4352.00, fecha_cuota_1: '2025-03-06', tasa_cuota_1: 64.45,
            cuota_2: 2729.00, fecha_cuota_2: '2025-03-28', tasa_cuota_2: 69.27,
            cuota_3: 3427.00, fecha_cuota_3: '2025-04-30', tasa_cuota_3: 86.63,
            cuota_4: 3766.20, fecha_cuota_4: '2025-05-30', tasa_cuota_4: 96.62,
            cuota_5: 44.04, fecha_cuota_5: '2025-06-30', tasa_cuota_5: 107.36
        }
    ];
}

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
    // Filtros rápidos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            applyQuickFilter(filter);
        });
    });

    // Búsqueda general
    document.getElementById('search-general').addEventListener('input', debounce(applyFilters, 300));

    // Búsqueda por factura
    document.getElementById('search-factura').addEventListener('input', debounce(applyFilters, 300));

    // Búsqueda por cédula
    document.getElementById('search-cedula').addEventListener('input', debounce(applyFilters, 300));

    // Fechas
    document.getElementById('fecha-desde').addEventListener('change', applyFilters);
    document.getElementById('fecha-hasta').addEventListener('change', applyFilters);

    // Montos
    document.getElementById('monto-min').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('monto-max').addEventListener('input', debounce(applyFilters, 300));

    // Botones de búsqueda
    document.getElementById('btn-buscar').addEventListener('click', applyFilters);
    document.getElementById('btn-limpiar').addEventListener('click', clearFilters);

    // Paginación
    document.getElementById('btn-primero').addEventListener('click', () => goToPage(1));
    document.getElementById('btn-anterior').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('btn-siguiente').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('btn-ultimo').addEventListener('click', () => goToPage(getTotalPages()));
    document.getElementById('registros-por-pagina').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });

    // Exportación
    document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
    document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('btn-print').addEventListener('click', printTable);

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-detalle').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-detalle')) {
            closeModal();
        }
    });
}

// ==================== FILTROS RÁPIDOS ====================
function applyQuickFilter(filter) {
    currentFilter = filter;

    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    applyFilters();
}

// ==================== APLICAR FILTROS ====================
function applyFilters() {
    const searchGeneral = document.getElementById('search-general').value.toLowerCase().trim();
    const searchFactura = document.getElementById('search-factura').value.trim();
    const searchCedula = document.getElementById('search-cedula').value.trim();
    const fechaDesde = document.getElementById('fecha-desde').value;
    const fechaHasta = document.getElementById('fecha-hasta').value;
    const montoMin = parseFloat(document.getElementById('monto-min').value) || 0;
    const montoMax = parseFloat(document.getElementById('monto-max').value) || Infinity;

    filteredData = allData.filter(item => {
        // Filtro rápido (estado)
        if (currentFilter !== 'all') {
            const estado = getEstado(item);
            if (currentFilter === 'deudores' && estado !== 'deudor') return false;
            if (currentFilter === 'incompletos' && estado !== 'incompleto') return false;
            if (currentFilter === 'aldia' && estado !== 'aldia') return false;
            if (currentFilter === 'abiertas' && estado !== 'abierta') return false;
            if (currentFilter === 'canceladas' && estado !== 'cancelada') return false;
        }

        // Búsqueda general (nombre)
        if (searchGeneral && !item.nombre_apellido?.toLowerCase().includes(searchGeneral)) {
            return false;
        }

        // Búsqueda por factura
        if (searchFactura && !item.nro_factura?.includes(searchFactura)) {
            return false;
        }

        // Búsqueda por cédula
        if (searchCedula && !item.cedula?.includes(searchCedula)) {
            return false;
        }

        // Filtro por fecha
        if (fechaDesde && item.fecha_factura < fechaDesde) return false;
        if (fechaHasta && item.fecha_factura > fechaHasta) return false;

        // Filtro por monto
        if (item.monto_factura < montoMin) return false;
        if (item.monto_factura > montoMax) return false;

        return true;
    });

    currentPage = 1;
    updateSummary();
    renderTable();
}

// ==================== LIMPIAR FILTROS ====================
function clearFilters() {
    document.getElementById('search-general').value = '';
    document.getElementById('search-factura').value = '';
    document.getElementById('search-cedula').value = '';
    document.getElementById('fecha-desde').value = '';
    document.getElementById('fecha-hasta').value = '';
    document.getElementById('monto-min').value = '';
    document.getElementById('monto-max').value = '';

    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');

    applyFilters();
}

// ==================== DETERMINAR ESTADO ====================
function getEstado(item) {
    const cuotasPagadas = countCuotasPagadas(item);
    const totalCuotas = 9;
    const deuda = item.deuda || 0;

    if (deuda > 0) return 'deudor';
    if (cuotasPagadas === totalCuotas) return 'cancelada';
    if (cuotasPagadas === 0) return 'abierta';
    if (cuotasPagadas < totalCuotas) return 'incompleto';
    return 'aldia';
}

function countCuotasPagadas(item) {
    let count = 0;
    for (let i = 1; i <= 9; i++) {
        if (item[`cuota_${i}`] && item[`cuota_${i}`] > 0) {
            count++;
        }
    }
    return count;
}

// ==================== ACTUALIZAR RESUMEN ====================
function updateSummary() {
    const totalClientes = filteredData.length;
    const totalFacturado = filteredData.reduce((sum, item) => sum + (item.monto_factura || 0), 0);
    const totalDeuda = filteredData.reduce((sum, item) => sum + (item.deuda || 0), 0);
    const totalRecaudado = filteredData.reduce((sum, item) => sum + (item.monto_depositados || 0), 0);

    document.getElementById('total-clientes').textContent = totalClientes;
    document.getElementById('total-facturado').textContent = formatCurrency(totalFacturado);
    document.getElementById('total-deuda').textContent = formatCurrency(totalDeuda);
    document.getElementById('total-recaudado').textContent = formatCurrency(totalRecaudado);
}

// ==================== ACTUALIZAR CONTADORES DE FILTROS ====================
function updateFilterCounts() {
    const counts = {
        all: allData.length,
        deudores: allData.filter(item => getEstado(item) === 'deudor').length,
        incompletos: allData.filter(item => getEstado(item) === 'incompleto').length,
        aldia: allData.filter(item => getEstado(item) === 'aldia').length,
        abiertas: allData.filter(item => getEstado(item) === 'abierta').length,
        canceladas: allData.filter(item => getEstado(item) === 'cancelada').length
    };

    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-deudores').textContent = counts.deudores;
    document.getElementById('count-incompletos').textContent = counts.incompletos;
    document.getElementById('count-aldia').textContent = counts.aldia;
    document.getElementById('count-abiertas').textContent = counts.abiertas;
    document.getElementById('count-canceladas').textContent = counts.canceladas;
}

// ==================== RENDERIZAR TABLA ====================
function renderTable() {
    const tbody = document.getElementById('tabla-body');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No se encontraron registros
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map(item => createRowHTML(item)).join('');
    }

    updatePagination();
}

function createRowHTML(item) {
    const estado = getEstado(item);
    const cuotasPagadas = countCuotasPagadas(item);
    const totalCuotas = 9;
    const porcentaje = (cuotasPagadas / totalCuotas) * 100;

    const estadoClass = {
        'aldia': 'estado-aldia',
        'deudor': 'estado-deudor',
        'incompleto': 'estado-incompleto',
        'abierta': 'estado-abierta',
        'cancelada': 'estado-cancelada'
    }[estado];

    const estadoText = {
        'aldia': 'Al día',
        'deudor': 'Deudor',
        'incompleto': 'Incompleto',
        'abierta': 'Abierta',
        'cancelada': 'Cancelada'
    }[estado];

    const estadoIcon = {
        'aldia': 'fa-check-circle',
        'deudor': 'fa-exclamation-circle',
        'incompleto': 'fa-clock',
        'abierta': 'fa-folder-open',
        'cancelada': 'fa-check-double'
    }[estado];

    return `
        <tr class="fade-in">
            <td>${item.numero || ''}</td>
            <td><strong>${item.nro_factura || ''}</strong></td>
            <td>${item.nombre_apellido || ''}</td>
            <td class="monto">${formatCurrency(item.monto_factura)}</td>
            <td>${formatDate(item.fecha_factura)}</td>
            <td>${item.cedula || ''}</td>
            <td>
                <div class="cuotas-progress">
                    <div class="cuotas-bar">
                        <div class="cuotas-fill" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="cuotas-text">${cuotasPagadas}/${totalCuotas}</span>
                </div>
            </td>
            <td class="monto-deuda">${formatCurrency(item.deuda)}</td>
            <td>
                <span class="estado-badge ${estadoClass}">
                    <i class="fas ${estadoIcon}"></i>
                    ${estadoText}
                </span>
            </td>
            <td>
                <div class="acciones">
                    <button class="btn-action btn-view" onclick="verDetalle(${item.id})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editarCliente(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ==================== PAGINACIÓN ====================
function updatePagination() {
    const totalPages = getTotalPages();

    document.getElementById('pagina-info').textContent = 
        `Página ${currentPage} de ${totalPages}`;

    document.getElementById('btn-primero').disabled = currentPage === 1;
    document.getElementById('btn-anterior').disabled = currentPage === 1;
    document.getElementById('btn-siguiente').disabled = currentPage >= totalPages;
    document.getElementById('btn-ultimo').disabled = currentPage >= totalPages;
}

function getTotalPages() {
    return Math.ceil(filteredData.length / itemsPerPage) || 1;
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderTable();

    // Scroll al inicio de la tabla
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
}

// ==================== MODAL DETALLE ====================
function verDetalle(id) {
    const item = allData.find(d => d.id === id);
    if (!item) return;

    const modalBody = document.getElementById('modal-body');
    const estado = getEstado(item);
    const cuotasPagadas = countCuotasPagadas(item);

    modalBody.innerHTML = `
        <div class="cliente-detalle">
            <div class="detalle-grupo">
                <h4><i class="fas fa-user"></i> Información del Cliente</h4>
                <div class="detalle-item">
                    <span class="detalle-label">Nombre:</span>
                    <span class="detalle-value">${item.nombre_apellido}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Cédula:</span>
                    <span class="detalle-value">${item.cedula}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Factura N°:</span>
                    <span class="detalle-value">${item.nro_factura}</span>
                </div>
            </div>

            <div class="detalle-grupo">
                <h4><i class="fas fa-file-invoice"></i> Factura</h4>
                <div class="detalle-item">
                    <span class="detalle-label">Monto:</span>
                    <span class="detalle-value">${formatCurrency(item.monto_factura)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Fecha:</span>
                    <span class="detalle-value">${formatDate(item.fecha_factura)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Estado:</span>
                    <span class="detalle-value" style="color: ${getEstadoColor(estado)}">${estado.toUpperCase()}</span>
                </div>
            </div>

            <div class="detalle-grupo">
                <h4><i class="fas fa-money-bill-wave"></i> Financiero</h4>
                <div class="detalle-item">
                    <span class="detalle-label">Monto Pendiente:</span>
                    <span class="detalle-value">${formatCurrency(item.monto_pendiente)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Depositado:</span>
                    <span class="detalle-value">${formatCurrency(item.monto_depositados)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Deuda:</span>
                    <span class="detalle-value" style="color: ${item.deuda > 0 ? 'var(--danger)' : 'var(--success)'}">
                        ${formatCurrency(item.deuda)}
                    </span>
                </div>
            </div>

            <div class="detalle-grupo">
                <h4><i class="fas fa-chart-pie"></i> Resumen Cuotas</h4>
                <div class="detalle-item">
                    <span class="detalle-label">Cuotas Pagadas:</span>
                    <span class="detalle-value">${cuotasPagadas} de 9</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Progreso:</span>
                    <span class="detalle-value">${Math.round((cuotasPagadas/9)*100)}%</span>
                </div>
            </div>

            <div class="cuotas-detalle">
                <h4><i class="fas fa-list-ol"></i> Detalle de Cuotas</h4>
                ${generateCuotasHTML(item)}
            </div>
        </div>
    `;

    document.getElementById('modal-detalle').classList.add('active');
}

function generateCuotasHTML(item) {
    let html = '';
    for (let i = 1; i <= 9; i++) {
        const cuota = item[`cuota_${i}`];
        const fecha = item[`fecha_cuota_${i}`];
        const tasa = item[`tasa_cuota_${i}`];

        if (!cuota) continue;

        const isPagada = cuota > 0 && fecha;
        const estadoClass = isPagada ? 'pagada' : 'pendiente';
        const estadoText = isPagada ? 'Pagada' : 'Pendiente';

        html += `
            <div class="cuota-item ${estadoClass}">
                <div>
                    <strong>Cuota ${i}</strong>
                    <span style="color: #666; margin-left: 10px;">${formatCurrency(cuota)}</span>
                </div>
                <div style="text-align: right;">
                    <div>${formatDate(fecha)}</div>
                    <div style="font-size: 0.8rem; color: #666;">Tasa: ${tasa || '-'}</div>
                </div>
            </div>
        `;
    }
    return html || '<p style="color: #999; padding: 10px;">Sin cuotas registradas</p>';
}

function closeModal() {
    document.getElementById('modal-detalle').classList.remove('active');
}

function editarCliente(id) {
    // Implementar edición
    alert('Función de edición en desarrollo para ID: ' + id);
}

// ==================== EXPORTACIÓN ====================
function exportToExcel() {
    // Crear CSV
    const headers = [
        'N°', 'Factura', 'Nombre', 'Monto Factura', 'Fecha Factura', 'Cédula',
        'Monto Pendiente', 'Depositado', 'Deuda', 'Estado'
    ];

    const rows = filteredData.map(item => [
        item.numero, item.nro_factura, item.nombre_apellido,
        item.monto_factura, item.fecha_factura, item.cedula,
        item.monto_pendiente, item.monto_depositados, item.deuda,
        getEstado(item)
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell || ''}"`).join(','))
        .join('\n');

    downloadFile(csv, 'tienda_caracas.csv', 'text/csv');
}

function exportToPDF() {
    alert('Exportación a PDF en desarrollo.\nUse Imprimir → Guardar como PDF por ahora.');
    printTable();
}

function printTable() {
    window.print();
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== UTILIDADES ====================
function formatCurrency(value) {
    if (value === null || value === undefined || value === 0) return '-';
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getEstadoColor(estado) {
    const colors = {
        'aldia': 'var(--success)',
        'deudor': 'var(--danger)',
        'incompleto': '#f57c00',
        'abierta': 'var(--info)',
        'cancelada': 'var(--secondary)'
    };
    return colors[estado] || 'var(--dark)';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(show) {
    // Implementar overlay de carga si es necesario
    console.log(show ? '⏳ Cargando...' : '✅ Listo');
}

// ==================== RELOJ ====================
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('es-VE');
    document.getElementById('date').textContent = now.toLocaleDateString('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

setInterval(updateClock, 1000);
updateClock();
