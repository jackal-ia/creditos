// ============================================================
// TIENDA MARACAIBO - MÓDULO DE GESTIÓN
// Envuelto en IIFE para aislar variables y evitar colisiones
// ============================================================
(function() {
    'use strict';

    // Variable global para recordar la tienda activa actual
    window.tiendaActiva = window.tiendaActiva || null;

/**
 * TIENDA MARACAIBO - MÓDULO DE GESTIÓN (Versión SPA - CORREGIDO)
 * 
 * REGLAS DE NEGOCIO:
 * - Cuotas: muestra cuotas pagadas reales
 * - Deuda = monto_factura - monto_depositado (suma de cuotas)
 * - Deudores: deuda > 0
 * - Al día: deuda <= 0
 * - Facturas abiertas: deuda > 0
 * - Facturas canceladas: deuda <= 0
 * - Moneda: Bs (Bolívares)
 * - Total recaudado: suma de monto_depositados
 * - Total deuda: suma de deuda
 */

// ==================== CONFIGURACIÓN ====================
var API_BASE_URL_MB = window.location.origin + '/api';
var ITEMS_PER_PAGE_DEFAULT_MB = 25;

// ==================== ESTADO ====================
let allDataMB = [];
let filteredDataMB = [];
let currentPageMB = 1;
let itemsPerPageMB = ITEMS_PER_PAGE_DEFAULT_MB;
let currentFilterMB = 'all';
let isInitializedMB = false;
let currentEditIdMB = null;
let currentEditItemMB = null;

// ==================== INICIALIZACIÓN ====================
function initTiendaMaracaibo() {
    if (window.isInitializedMB) {
        console.log('Tienda Caracas ya inicializado');
        return;
    }

    console.log('🚀 Tienda Caracas - Inicializando módulo');

    // Cargar datos
    loadData().then(() => {
        updateSummaryMB();
        renderTableMB();
        updateFilterCountsMB();
        window.isInitializedMB = true;
    });
}

// ==================== CARGA DE DATOS ====================
async function loadData() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        allDataMB = await response.json();
        allDataMB = allDataMB.map(item => processItemData(item));
        filteredDataMB = [...allDataMB];

        console.log(`✅ ${allDataMB.length} registros cargados`);

    } catch (error) {
        console.warn('⚠️ No se pudo conectar al backend:', error);
        console.log('📦 Usando datos de ejemplo...');

        allDataMB = getSampleData().map(item => processItemData(item));
        filteredDataMB = [...allDataMB];
    }

    showLoading(false);
}

// ==================== PROCESAR DATOS ====================
function processItemData(item) {
    let montoDepositado = 0;
    let cuotasPagadas = 0;
    const totalCuotas = 11;

    for (let i = 1; i <= totalCuotas; i++) {
        const cuota = parseNumberES(item[`cuota_${i}`]);
        if (cuota > 0) {
            montoDepositado += cuota;
            cuotasPagadas++;
        }
    }

    const montoFactura = parseNumberES(item.monto_factura);
    let deuda = montoFactura - montoDepositado;

    if (Math.abs(montoFactura - montoDepositado) < 0.01) {
        deuda = 0;
    }

    item.monto_depositados = montoDepositado;
    item.deuda = deuda;
    item.cuotas_pagadas = cuotasPagadas;
    item.total_cuotas = totalCuotas;

    return item;
}

// ==================== PARSEAR NÚMEROS CON FORMATO ESPAÑOL ====================
/**
 * Convierte un valor numérico que puede estar en formato español
 * (punto como separador de miles, coma como decimal) a número JavaScript.
 * Ej: "80.075,55" -> 80075.55
 * Ej: "1.234,56" -> 1234.56
 * Ej: "1234.56"  -> 1234.56 (formato inglés, sin miles)
 * Ej: 1234.56     -> 1234.56 (ya es número)
 */
function parseNumberES(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    let str = String(value).trim();
    if (!str) return 0;

    if (!isNaN(str) && !str.includes(',')) {
        return parseFloat(str);
    }

    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    let cleaned;
    if (lastComma > lastDot && lastComma !== -1) {
        cleaned = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma && lastDot !== -1) {
        cleaned = str.replace(/,/g, '');
    } else {
        cleaned = str.replace(/[.,]/g, '');
    }

    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
}



function getSampleData() {
    return [
        {
            id: 1, numero: 1, nro_factura: '7693',
            nombre_apellido: 'ANDRES AELINO MANZANO SOTO',
            monto_factura: 10836.23, fecha_factura: '2025-02-17',
            cedula: '7959439',
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
            cedula: '14247261',
            cuota_1: 4352.00, fecha_cuota_1: '2025-03-06', tasa_cuota_1: 64.45,
            cuota_2: 2729.00, fecha_cuota_2: '2025-03-28', tasa_cuota_2: 69.27,
            cuota_3: 3427.00, fecha_cuota_3: '2025-04-30', tasa_cuota_3: 86.63,
            cuota_4: 3766.20, fecha_cuota_4: '2025-05-30', tasa_cuota_4: 96.62,
            cuota_5: 44.04, fecha_cuota_5: '2025-06-30', tasa_cuota_5: 107.36
        }
    ];
}

// ==================== FILTROS RÁPIDOS ====================
function applyQuickFilterMB(filter) {
    currentFilterMB = filter;

    document.querySelectorAll('#contentPagos .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#contentPagos [data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    applyFiltersMB();
}

// ==================== APLICAR FILTROS ====================
function applyFiltersMB() {
    const searchGeneral = document.getElementById('search-general-mb')?.value.toLowerCase().trim() || '';
    const searchFactura = document.getElementById('search-factura-mb')?.value.trim() || '';
    const searchCedula = document.getElementById('search-cedula-mb')?.value.trim() || '';
    const fechaDesde = document.getElementById('fecha-desde-mb')?.value || '';
    const fechaHasta = document.getElementById('fecha-hasta-mb')?.value || '';
    const montoMin = parseFloat(document.getElementById('monto-min-mb')?.value) || 0;
    const montoMax = parseFloat(document.getElementById('monto-max-mb')?.value) || Infinity;

    filteredDataMB = allDataMB.filter(item => {
        if (currentFilterMB !== 'all') {
            const deuda = item.deuda || 0;
            if (currentFilterMB === 'deudores' && !(deuda > 0)) return false;
            if (currentFilterMB === 'incompletos' && !(item.cuotas_pagadas > 0 && item.cuotas_pagadas < item.total_cuotas)) return false;
            if (currentFilterMB === 'aldia' && !(deuda <= 0)) return false;
            if (currentFilterMB === 'abiertas' && !(deuda > 0)) return false;
            if (currentFilterMB === 'canceladas' && !(deuda <= 0)) return false;
        }

        if (searchGeneral && !item.nombre_apellido?.toLowerCase().includes(searchGeneral)) return false;
        if (searchFactura && !item.nro_factura?.includes(searchFactura)) return false;
        if (searchCedula && !item.cedula?.includes(searchCedula)) return false;
        if (fechaDesde && item.fecha_factura < fechaDesde) return false;
        if (fechaHasta && item.fecha_factura > fechaHasta) return false;
        if (item.monto_factura < montoMin) return false;
        if (item.monto_factura > montoMax) return false;

        return true;
    });

    currentPageMB = 1;
    updateSummaryMB();
    renderTableMB();
}

// ==================== LIMPIAR FILTROS ====================
function clearFiltersMB() {
    const sg = document.getElementById('search-general-mb');
    const sf = document.getElementById('search-factura-mb');
    const sc = document.getElementById('search-cedula-mb');
    const fd = document.getElementById('fecha-desde-mb');
    const fh = document.getElementById('fecha-hasta-mb');
    const mm = document.getElementById('monto-min-mb');
    const mx = document.getElementById('monto-max-mb');

    if (sg) sg.value = '';
    if (sf) sf.value = '';
    if (sc) sc.value = '';
    if (fd) fd.value = '';
    if (fh) fh.value = '';
    if (mm) mm.value = '';
    if (mx) mx.value = '';

    currentFilterMB = 'all';
    document.querySelectorAll('#contentPagos .filter-btn').forEach(btn => btn.classList.remove('active'));
    const allBtn = document.querySelector('#contentPagos [data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');

    applyFiltersMB();
}

// ==================== DEBOUNCE ====================
let debounceTimerMB;
function debouncedFilterMB() {
    clearTimeout(debounceTimerMB);
    debounceTimerMB = setTimeout(applyFiltersMB, 300);
}

// ==================== DETERMINAR ESTADO ====================
function getEstado(item) {
    const deuda = item.deuda || 0;
    const cuotasPagadas = item.cuotas_pagadas || 0;
    const totalCuotas = item.total_cuotas || 9;
    const montoFactura = item.monto_factura || 0;
    const montoDepositado = item.monto_depositados || 0;

    if (Math.abs(montoFactura - montoDepositado) < 0.01 || deuda === 0) {
        return 'cancelada';
    }

    if (deuda > 0) {
        if (cuotasPagadas === 0) return 'abierta';
        if (cuotasPagadas < totalCuotas) return 'incompleto';
        return 'deudor';
    }

    return 'cancelada';
}

// ==================== ACTUALIZAR RESUMEN ====================
function updateSummaryMB() {
    const totalClientes = filteredDataMB.length;
    const totalFacturado = filteredDataMB.reduce((sum, item) => sum + (item.monto_factura || 0), 0);
    const totalDeuda = filteredDataMB.reduce((sum, item) => sum + (item.deuda || 0), 0);
    const totalRecaudado = filteredDataMB.reduce((sum, item) => sum + (item.monto_depositados || 0), 0);

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('total-clientes-mb', totalClientes);
    setText('total-facturado-mb', formatCurrency(totalFacturado));
    setText('total-deuda-mb', formatCurrency(totalDeuda));
    setText('total-recaudado-mb', formatCurrency(totalRecaudado));
}

// ==================== ACTUALIZAR CONTADORES ====================
function updateFilterCountsMB() {
    const counts = {
        all: allDataMB.length,
        deudores: allDataMB.filter(item => (item.deuda || 0) > 0).length,
        incompletos: allDataMB.filter(item => {
            const cp = item.cuotas_pagadas || 0;
            return cp > 0 && cp < (item.total_cuotas || 9);
        }).length,
        aldia: allDataMB.filter(item => (item.deuda || 0) <= 0).length,
        abiertas: allDataMB.filter(item => (item.deuda || 0) > 0).length,
        canceladas: allDataMB.filter(item => (item.deuda || 0) <= 0).length
    };

    const setCount = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setCount('count-all-mb', counts.all);
    setCount('count-deudores-mb', counts.deudores);
    setCount('count-incompletos-mb', counts.incompletos);
    setCount('count-aldia-mb', counts.aldia);
    setCount('count-abiertas-mb', counts.abiertas);
    setCount('count-canceladas-mb', counts.canceladas);
}

// ==================== RENDERIZAR TABLA ====================
function renderTableMB() {
    const tbody = document.getElementById('tabla-body-mb');
    if (!tbody) return;

    const start = (currentPageMB - 1) * itemsPerPageMB;
    const end = start + itemsPerPageMB;
    const pageData = filteredDataMB.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No se encontraron registros
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map(item => createRowHTMLMB(item)).join('');
    }

    updatePaginationMB();
}

function createRowHTMLMB(item) {
    const estado = getEstado(item);
    const cuotasPagadas = item.cuotas_pagadas || 0;
    const totalCuotas = item.total_cuotas || 9;
    const porcentaje = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;

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
                    <span class="cuotas-text">${cuotasPagadas}</span>
                </div>
            </td>
            <td class="monto">${formatCurrency(item.monto_depositados)}</td>
            <td class="monto-deuda">${formatCurrency(item.deuda)}</td>
            <td>
                <span class="estado-badge ${estadoClass}">
                    <i class="fas ${estadoIcon}"></i>
                    ${estadoText}
                </span>
            </td>
            <td>
                <div class="acciones">
                    <button class="btn-action btn-view" onclick="verDetalleMB(${item.id})" title="Ver y editar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="confirmarEliminarClienteMB(${item.id})" title="Eliminar registro">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ==================== PAGINACIÓN ====================
function updatePaginationMB() {
    const totalPages = getTotalPagesMB();

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    const setDisabled = (id, disabled) => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    };

    setText('pagina-info-mb', `Página ${currentPageMB} de ${totalPages}`);
    setDisabled('btn-primero-mb', currentPageMB === 1);
    setDisabled('btn-anterior-mb', currentPageMB === 1);
    setDisabled('btn-siguiente-mb', currentPageMB >= totalPages);
    setDisabled('btn-ultimo-mb', currentPageMB >= totalPages);
}

function getTotalPagesMB() {
    return Math.ceil(filteredDataMB.length / itemsPerPageMB) || 1;
}

function goToPageMB(page) {
    const totalPages = getTotalPagesMB();
    if (page < 1 || page > totalPages) return;

    currentPageMB = page;
    renderTableMB();

    const tableContainer = document.querySelector('#contentPagos .table-container');
    if (tableContainer) tableContainer.scrollIntoView({ behavior: 'smooth' });
}

function changeItemsPerPageMB() {
    const select = document.getElementById('registros-por-pagina-mb');
    if (select) {
        itemsPerPageMB = parseInt(select.value);
        currentPageMB = 1;
        renderTableMB();
    }
}

// ==================== MODAL EDICIÓN ====================
function verDetalleMB(id) {
    const item = allDataMB.find(d => d.id === id);
    if (!item) return;

    currentEditIdMB = id;
    currentEditItemMB = item;

    // Eliminar modal anterior si existe (para recrear con el rol correcto)
    const modalAnterior = document.getElementById('modal-editar-cliente-mb');
    if (modalAnterior) {
        modalAnterior.remove();
    }

    // Crear el modal dinámicamente con el rol actual
    const modal = createModalElementMB();
    document.body.appendChild(modal);

    // Llenar el formulario
    fillFormDataMB(item);

    // Mostrar modal
    modal.style.display = 'flex';
}

// ==================== VERIFICAR ROL DEL USUARIO ====================
function getUserRoleMB() {
    // Obtener el rol del usuario desde localStorage
    // La clave es 'usuario' (no 'user')
    const userData = localStorage.getItem('usuario');

    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.rol || 'operador';
        } catch (e) {
            return 'operador';
        }
    }
    return 'operador';
}

function isAdminMB() {
    return getUserRoleMB() === 'administrador';
}

function isOperadorMB() {
    return getUserRoleMB() === 'operador';
}

// ==================== MODAL ====================
function createModalElementMB() {
    const modal = document.createElement('div');
    modal.id = 'modal-editar-cliente-mb';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;';

    const isAdminUser = isAdminMB();
    const modalTitle = isAdminUser ? 'Editar Cliente' : 'Ver Cliente';
    const cuotasTitle = isAdminUser ? 'Cuotas (Editables)' : 'Cuotas (Solo Lectura)';
    const saveButton = isAdminUser ? `
        <button type="submit" style="padding:10px 20px; background:#1a3a5c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
    ` : '';

    modal.innerHTML = `
        <div style="background:white; border-radius:8px; width:90%; max-width:800px; max-height:90vh; overflow-y:auto; padding:25px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
                <h3 style="color:#1a3a5c; margin:0;"><i class="fas fa-user"></i> ${modalTitle}</h3>
                <button onclick="closeModalMB()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#666;">&times;</button>
            </div>

            <form id="form-editar-cliente" onsubmit="event.preventDefault(); ${isAdminUser ? 'guardarCambiosMB()' : 'closeModalMB()'};">
                <!-- Información Principal - SOLO LECTURA (excepto Teléfono) -->
                <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
                    <h4 style="color:#1a3a5c; font-size:14px; margin-bottom:12px;"><i class="fas fa-id-card"></i> Información Principal</h4>
                    <div style="display:flex; gap:15px; margin-bottom:12px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">N° Factura</label>
                            <input type="text" id="edit-nro-factura" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                        <div style="flex:2;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Nombre y Apellido</label>
                            <input type="text" id="edit-nombre" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Cédula</label>
                            <input type="text" id="edit-cedula" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Fecha Factura</label>
                            <input type="text" id="edit-fecha-factura" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                    </div>
                    <div style="display:flex; gap:15px; margin-top:12px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;"><i class="fas fa-phone"></i> Teléfono</label>
                            <input type="text" id="edit-telefono" placeholder="N° de teléfono" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:12px; transition: all 0.3s;" onfocus="this.style.borderColor='#1a3a5c'; this.style.boxShadow='0 0 0 3px rgba(26, 58, 92, 0.1)';" onblur="this.style.borderColor='#ddd'; this.style.boxShadow='none';">
                        </div>
                        <div style="flex:1;"></div>
                    </div>
                </div>

                <!-- Montos - SOLO LECTURA -->
                <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
                    <h4 style="color:#1a3a5c; font-size:14px; margin-bottom:12px;"><i class="fas fa-money-bill-wave"></i> Montos</h4>
                    <div style="display:flex; gap:15px; margin-bottom:12px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Monto Factura (Bs)</label>
                            <input type="text" id="edit-monto-factura" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Monto Depositado (Bs)</label>
                            <input type="text" id="edit-monto-depositado" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Deuda (Bs)</label>
                            <input type="text" id="edit-deuda" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; background:#f5f5f5;" readonly>
                        </div>
                    </div>
                </div>

                <!-- Cuotas -->
                <div style="margin-bottom:20px;">
                    <h4 style="color:#1a3a5c; font-size:14px; margin-bottom:12px;"><i class="fas fa-list-ol"></i> ${cuotasTitle}</h4>
                    <div id="edit-cuotas-container-mb" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;"></div>
                </div>

                <!-- Sección Eliminar Cuotas (SOLO ADMIN) -->
                ${isAdminUser ? `
                <div id="eliminar-cuotas-section-mb" style="margin-bottom:20px; padding:20px; background:#fff5f5; border-radius:8px; border:1px solid #fed7d7; display:none;">
                    <h4 style="color:#c53030; font-size:14px; margin-bottom:12px;"><i class="fas fa-trash-alt"></i> Eliminar Cuotas</h4>
                    <p style="font-size:12px; color:#718096; margin-bottom:12px;">Seleccione las cuotas que desea eliminar permanentemente:</p>
                    <div id="eliminar-cuotas-list-mb" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                        <!-- Los checkboxes se generan dinámicamente en fillFormData -->
                    </div>
                    <button type="button" onclick="confirmarEliminarCuotasMB()" style="padding:10px 20px; background:linear-gradient(135deg, #e53e3e, #c53030); color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-weight:600;">
                        <i class="fas fa-trash-alt"></i> Borrar Cuotas Seleccionadas
                    </button>
                </div>
                ` : ''}

                <!-- Botones -->
                <div style="display:flex; justify-content:flex-end; gap:12px; padding-top:15px; border-top:1px solid #eee;">
                    <button type="button" onclick="closeModalMB()" style="padding:10px 20px; background:#f0f0f0; border:none; border-radius:4px; cursor:pointer; font-size:14px;">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                    ${saveButton}
                </div>
            </form>
        </div>
    `;

    return modal;
}

function fillFormDataMB(item) {
    const modal = document.getElementById('modal-editar-cliente-mb');
    if (!modal) return;

    const setVal = (id, val) => {
        const el = modal.querySelector('#' + id);
        if (el) el.value = val || '';
    };

    setVal('edit-nro-factura', item.nro_factura);
    setVal('edit-nombre', item.nombre_apellido);
    setVal('edit-cedula', item.cedula);
    setVal('edit-telefono', item.telefono);

    // Formatear fecha de factura para mostrar (DD/MM/YYYY)
    let fechaFacturaFormateada = '';
    if (item.fecha_factura) {
        const fechaObj = new Date(item.fecha_factura);
        if (!isNaN(fechaObj)) {
            fechaFacturaFormateada = fechaObj.toLocaleDateString('es-VE', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } else {
            fechaFacturaFormateada = item.fecha_factura;
        }
    }
    setVal('edit-fecha-factura', fechaFacturaFormateada);

    // Formatear montos con separador de miles
    setVal('edit-monto-factura', formatNumber(item.monto_factura));
    setVal('edit-monto-depositado', formatNumber(item.monto_depositados));
    setVal('edit-deuda', formatNumber(item.deuda));

    // Verificar si el usuario es admin o operador
    const isAdminUser = isAdminMB();
    const readonlyAttr = isAdminUser ? '' : 'readonly style="background:#f5f5f5; cursor:not-allowed;"';
    const disabledAttr = isAdminUser ? '' : 'disabled';

    // Generar campos de cuotas - SOLO las que tienen datos en la BD
    const container = modal.querySelector('#edit-cuotas-container-mb');
    if (container) {
        let html = '';
        let cuotasMostradas = 0;

        // Contar cuotas existentes en la BD (cuotas con monto > 0)
        let cuotasExistentes = 0;
        for (let i = 1; i <= 11; i++) {
            const cuota = parseNumberES(item[`cuota_${i}`]);
            if (cuota > 0) {
                cuotasExistentes++;
            }
        }

        // Mostrar SOLO las cuotas que existen en la BD
        for (let i = 1; i <= 11; i++) {
            const cuota = item[`cuota_${i}`];  // valor original, puede estar formateado
            const ref = item[`ref_cuota_${i}`];
            const fecha = item[`fecha_cuota_${i}`];
            const tasa = item[`tasa_cuota_${i}`];
            const dolar = item[`dolar_depositado_cuota_${i}`];

            // Solo mostrar cuota si tiene monto > 0 en la BD
            const tieneDatos = (parseNumberES(cuota) > 0);

            if (tieneDatos) {
                cuotasMostradas++;

                // Formatear fecha para input type="date" (YYYY-MM-DD)
                let fechaFormateada = '';
                if (fecha) {
                    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        fechaFormateada = fecha;
                    } else {
                        const fechaObj = new Date(fecha);
                        if (!isNaN(fechaObj)) {
                            fechaFormateada = fechaObj.toISOString().split('T')[0];
                        }
                    }
                }

                // Formatear dólar depositado
                let dolarFormateado = '';
                if (dolar && dolar > 0) {
                    dolarFormateado = parseNumberES(dolar).toFixed(2) + ' $';
                }

                // Si es operador, mostrar valores como texto en lugar de inputs
                if (!isAdminUser) {
                    html += `
                        <div style="background:#f8f9fa; padding:12px; border-radius:6px; border-left:3px solid #1a3a5c;">
                            <h5 style="color:#1a3a5c; font-size:12px; margin:0 0 8px 0;">Cuota ${i}</h5>
                            <div style="margin-bottom:6px;">
                                <label style="font-size:11px; color:#666;">Monto (Bs)</label>
                                <div style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px; background:#f5f5f5;">${cuota || '0.00'}</div>
                            </div>
                            <div style="margin-bottom:6px;">
                                <label style="font-size:11px; color:#666;">Referencia</label>
                                <div style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px; background:#f5f5f5;">${ref || '-'}</div>
                            </div>
                            <div style="display:flex; gap:6px; margin-bottom:6px;">
                                <div style="flex:1;">
                                    <label style="font-size:11px; color:#666;">Fecha</label>
                                    <div style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px; background:#f5f5f5;">${fechaFormateada || '-'}</div>
                                </div>
                                <div style="flex:1;">
                                    <label style="font-size:11px; color:#666;">Tasa BCV</label>
                                    <div style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px; background:#f5f5f5;">${tasa || '-'}</div>
                                </div>
                            </div>
                            <div style="background:#e3f2fd; padding:6px; border-radius:4px; text-align:center;">
                                <label style="font-size:11px; color:#666;">Dólar Depositado</label>
                                <div style="font-size:13px; font-weight:600; color:#1a3a5c;">${dolarFormateado || '0.00 $'}</div>
                            </div>
                        </div>
                    `;
                } else {
                    // Admin puede editar
                    html += `
                        <div style="background:#f8f9fa; padding:12px; border-radius:6px; border-left:3px solid #1a3a5c;">
                            <h5 style="color:#1a3a5c; font-size:12px; margin:0 0 8px 0;">Cuota ${i}</h5>
                            <div style="margin-bottom:6px;">
                                <label style="font-size:11px; color:#666;">Monto (Bs)</label>
                                <input type="number" step="0.01" id="edit-cuota-${i}" value="${cuota || ''}" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px;">
                            </div>
                            <div style="margin-bottom:6px;">
                                <label style="font-size:11px; color:#666;">Referencia</label>
                                <input type="text" id="edit-ref-${i}" value="${ref || ''}" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px;">
                            </div>
                            <div style="display:flex; gap:6px; margin-bottom:6px;">
                                <div style="flex:1;">
                                    <label style="font-size:11px; color:#666;">Fecha</label>
                                    <input type="date" id="edit-fecha-${i}" value="${fechaFormateada}" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px;">
                                </div>
                                <div style="flex:1;">
                                    <label style="font-size:11px; color:#666;">Tasa BCV</label>
                                    <input type="number" step="0.0001" id="edit-tasa-${i}" value="${tasa || ''}" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:12px;">
                                </div>
                            </div>
                            <div style="background:#e3f2fd; padding:6px; border-radius:4px; text-align:center;">
                                <label style="font-size:11px; color:#666;">Dólar Depositado</label>
                                <div style="font-size:13px; font-weight:600; color:#1a3a5c;">${dolarFormateado || '0.00 $'}</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Si no hay cuotas, mostrar mensaje
        if (cuotasMostradas === 0) {
            html = '<p style="color:#999; text-align:center; padding:20px;">No hay cuotas registradas</p>';
        }

        container.innerHTML = html;
    }

    // Generar checklist de cuotas para eliminar (SOLO ADMIN y SOLO si hay cuotas)
    if (isAdminUser) {
        const eliminarSection = modal.querySelector('#eliminar-cuotas-section-mb');
        const eliminarList = modal.querySelector('#eliminar-cuotas-list-mb');

        if (eliminarSection && eliminarList) {
            let checkboxesHtml = '';
            let cuotasParaEliminar = 0;

            for (let i = 1; i <= 11; i++) {
                const cuota = item[`cuota_${i}`];
                const tieneDatos = (parseNumberES(cuota) > 0);

                if (tieneDatos) {
                    cuotasParaEliminar++;
                    const ref = item[`ref_cuota_${i}`] || '-';
                    const fecha = item[`fecha_cuota_${i}`] || '-';

                    checkboxesHtml += `
                        <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:white; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; transition:all 0.2s; font-size:12px;" 
                               onmouseover="this.style.borderColor='#e53e3e'; this.style.background='#fff5f5';" 
                               onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white';">
                            <input type="checkbox" name="eliminar-cuota" value="${i}" style="width:16px; height:16px; cursor:pointer; accent-color:#e53e3e;">
                            <div>
                                <strong style="color:#2d3748;">Cuota ${i}</strong>
                                <div style="font-size:11px; color:#718096; margin-top:2px;">
                                    ${formatCurrency(cuota)} | Ref: ${ref} | ${formatDate(fecha)}
                                </div>
                            </div>
                        </label>
                    `;
                }
            }

            if (cuotasParaEliminar > 0) {
                eliminarList.innerHTML = checkboxesHtml;
                eliminarSection.style.display = 'block';
            } else {
                eliminarList.innerHTML = '<p style="color:#999; font-size:12px;">No hay cuotas para eliminar</p>';
                eliminarSection.style.display = 'none';
            }
        }
    }
}

function closeModalMB() {
    const modal = document.getElementById('modal-editar-cliente-mb');
    if (modal) {
        modal.style.display = 'none';
        modal.remove(); // DESTRUIR del DOM para evitar conflictos con otras tiendas
    }
    currentEditIdMB = null;
    currentEditItemMB = null;
}

async function guardarCambiosMB() {
    if (!currentEditIdMB || !currentEditItemMB) return;

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    // Aseguramos conservar todas las propiedades estructurales puras del item original
    // para que no se altere el número de factura ni el monto por configuraciones regionales remotas.
    const data = {
        id: currentEditItemMB.id,
        numero: currentEditItemMB.numero,
        nro_factura: currentEditItemMB.nro_factura, 
        nombre_apellido: currentEditItemMB.nombre_apellido,
        cedula: currentEditItemMB.cedula,
        telefono: getVal('edit-telefono') ? getVal('edit-telefono').trim() : '',
        fecha_factura: currentEditItemMB.fecha_factura || null,
        // CRITICAL FIX: monto_factura debe venir del item original, NO del input formateado
        // El input usa formatNumber() que convierte 39035.88 → "39.035,88"
        // Si se lee del input, parseNumberES("39.035,88") → 39.035 (¡pierde 88% del valor!)
        monto_factura: typeof currentEditItemMB.monto_factura === 'number' 
            ? currentEditItemMB.monto_factura 
            : parseNumberES(currentEditItemMB.monto_factura)
    };

    let cuotasEditadas = false;
    let montoDepositado = 0;

    for (let i = 1; i <= 11; i++) {
        const cuotaOriginal = parseNumberES(currentEditItemMB[`cuota_${i}`]);

        if (cuotaOriginal > 0) {
            // Limpiamos los inputs de cuotas con parseNumberES por seguridad
            const cuotaInput = parseNumberES(getVal(`edit-cuota-${i}`));
            const refInput = getVal(`edit-ref-${i}`) ? getVal(`edit-ref-${i}`).trim() : '';
            const fechaInput = getVal(`edit-fecha-${i}`);
            const tasaInput = parseNumberES(getVal(`edit-tasa-${i}`));

            const refOriginal = currentEditItemMB[`ref_cuota_${i}`] || '';
            const fechaOriginal = currentEditItemMB[`fecha_cuota_${i}`] || '';
            const tasaOriginal = parseNumberES(currentEditItemMB[`tasa_cuota_${i}`]);

            if (cuotaInput !== cuotaOriginal || 
                refInput !== refOriginal || 
                fechaInput !== fechaOriginal || 
                tasaInput !== tasaOriginal) {
                cuotasEditadas = true;
            }

            data[`cuota_${i}`] = cuotaInput;
            data[`ref_cuota_${i}`] = refInput;
            data[`fecha_cuota_${i}`] = fechaInput;
            data[`tasa_cuota_${i}`] = tasaInput;

            if (cuotaInput > 0) {
                montoDepositado += cuotaInput;
            }
        }
    }

    if (!cuotasEditadas) {
        data.monto_depositados = parseNumberES(currentEditItemMB.monto_depositados);
        data.deuda = parseNumberES(currentEditItemMB.deuda);
    } else {
        data.monto_depositados = montoDepositado;
        data.deuda = data.monto_factura - montoDepositado;

        if (Math.abs(data.monto_factura - montoDepositado) < 0.01) {
            data.deuda = 0;
        }
    }

    try {
        showLoading(true);

        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo/${currentEditIdMB}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        const index = allDataMB.findIndex(d => d.id === currentEditIdMB);
        if (index !== -1) {
            // Guardamos el objeto completamente procesado e inmunizado localmente
            allDataMB[index] = processItemData({...allDataMB[index], ...data});
        }

        applyFiltersMB();
        updateSummaryMB();
        updateFilterCountsMB();
        closeModalMB();

        alert('✅ Cambios guardados exitosamente');

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('❌ Error al guardar: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function editarClienteMB(id) {
    verDetalleMB(id);
}

// ==================== ELIMINAR CLIENTE ====================
function confirmarEliminarClienteMB(id) {
    const item = allDataMB.find(d => d.id === id);
    if (!item) return;

    mostrarModalCorporativo(
        '¿Eliminar Registro?',
        `¿Está seguro de que desea eliminar el registro?\n\nFactura N°: ${item.nro_factura || 'N/A'}\nCliente: ${item.nombre_apellido || 'N/A'}\n\n⚠️ Esta acción no se puede deshacer.`,
        'warning',
        [
            {
                texto: 'Cancelar',
                estilo: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;',
                accion: () => {
                    // Solo cierra el modal
                }
            },
            {
                texto: 'Sí, Eliminar',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #dc3545, #c53030); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                accion: () => {
                    eliminarClienteMB(id);
                }
            }
        ]
    );
}

async function eliminarClienteMB(id) {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        if (result.success || result.message) {
            mostrarModalCorporativo(
                'Registro Eliminado',
                'El registro ha sido eliminado exitosamente.',
                'exito',
                [{
                    texto: 'Aceptar',
                    estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                    accion: () => {
                        // Recargar datos
                        loadData().then(() => {
                            updateSummaryMB();
                            renderTableMB();
                            updateFilterCountsMB();
                        });
                    }
                }]
            );
        } else {
            mostrarModalCorporativo('Error', result.error || 'No se pudo eliminar el registro', 'error');
        }

    } catch (error) {
        console.error('Error eliminando cliente:', error);
        mostrarModalCorporativo('Error', 'Error al eliminar: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== EXPORTACIÓN ====================
function exportToExcelMB() {
    const headers = ['N°', 'Factura', 'Nombre', 'Monto Factura (Bs)', 'Fecha Factura', 'Cédula', 'Cuotas Pagadas', 'Monto Depositado (Bs)', 'Deuda (Bs)', 'Estado'];

    const rows = filteredDataMB.map(item => [
        item.numero, item.nro_factura, item.nombre_apellido,
        item.monto_factura, item.fecha_factura, item.cedula,
        item.cuotas_pagadas, item.monto_depositados, item.deuda,
        getEstado(item)
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

    downloadFile(csv, 'tienda_maracaibo.csv', 'text/csv');
}

function exportToPDFMB() {
    alert('Exportación a PDF en desarrollo.\nUse Imprimir → Guardar como PDF.');
    printTableMB();
}

function printTableMB() {
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
    if (value === null || value === undefined) return '-';

    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    if (num === 0) return '0 Bs';

    return new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    }).format(num) + ' Bs';
}

function formatNumber(value) {
    if (value === null || value === undefined) return '';

    const num = parseFloat(value);
    if (isNaN(num)) return '';

    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showLoading(show) {
    console.log(show ? '⏳ Cargando...' : '✅ Listo');
}

// ==================== NAVEGACIÓN MENÚ PRINCIPAL ====================
function mostrarBaseDatosMaracaibo() {
    const menu = document.getElementById('tmb-menu-principal');
    const baseDatos = document.getElementById('tmb-base-datos');
    const conciliaciones = document.getElementById('tmb-conciliaciones');
    const busqueda = document.getElementById('tmb-busqueda');

    if (menu) menu.style.display = 'none';
    if (conciliaciones) conciliaciones.style.display = 'none';
    if (busqueda) busqueda.style.display = 'none';
    if (baseDatos) {
        baseDatos.style.display = 'block';
        // SIEMPRE inicializar datos al entrar a base de datos
        window.isInitializedMB = false;
        initTiendaMaracaibo();
    }
}

function mostrarMenuPrincipalMaracaibo() {
    const menu = document.getElementById('tmb-menu-principal');
    const baseDatos = document.getElementById('tmb-base-datos');
    const conciliaciones = document.getElementById('tmb-conciliaciones');
    const busqueda = document.getElementById('tmb-busqueda');

    if (menu) menu.style.display = 'grid';
    if (baseDatos) baseDatos.style.display = 'none';
    if (conciliaciones) conciliaciones.style.display = 'none';
    if (busqueda) busqueda.style.display = 'none';
}


// ==================== CONCILIACIONES BANCARIAS ====================
// Variables de estado
let conciliacionClienteActualMB = null;
let conciliacionTasaActualMB = null;

// ==================== MODAL CORPORATIVO ====================
function mostrarModalCorporativo(titulo, mensaje, tipo, botones) {
    const modal = document.getElementById('modal-corporativo');
    if (!modal) {
        // Fallback si no existe el modal
        alert(titulo + '\n\n' + mensaje);
        if (botones && botones[0] && botones[0].accion) botones[0].accion();
        return;
    }

    const iconDiv = document.getElementById('modal-corp-icon');
    const tituloEl = document.getElementById('modal-corp-titulo');
    const mensajeEl = document.getElementById('modal-corp-mensaje');
    const botonesDiv = document.getElementById('modal-corp-botones');

    const iconos = {
        'exito': { icon: '✅', bg: '#e8f5e9', color: '#28a745' },
        'error': { icon: '❌', bg: '#fce8e8', color: '#dc3545' },
        'warning': { icon: '⚠️', bg: '#fff3e0', color: '#ed8936' },
        'info': { icon: 'ℹ️', bg: '#e3f2fd', color: '#2c5282' },
        'pregunta': { icon: '❓', bg: '#e3f2fd', color: '#2c5282' }
    };

    const config = iconos[tipo] || iconos['info'];
    iconDiv.textContent = config.icon;
    iconDiv.style.background = config.bg;
    iconDiv.style.color = config.color;

    tituloEl.textContent = titulo;
    mensajeEl.innerHTML = mensaje.replace(/\n/g, '<br>');

    botonesDiv.innerHTML = '';
    if (botones && botones.length > 0) {
        botones.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.texto;
            button.style.cssText = btn.estilo || 'padding: 10px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.3s;';
            button.onclick = () => {
                cerrarModalCorporativo();
                if (btn.accion) btn.accion();
            };
            botonesDiv.appendChild(button);
        });
    } else {
        const btnAceptar = document.createElement('button');
        btnAceptar.textContent = 'Aceptar';
        btnAceptar.style.cssText = 'padding: 10px 24px; background: linear-gradient(135deg, #1a3a5c, #2c5282); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;';
        btnAceptar.onclick = cerrarModalCorporativo;
        botonesDiv.appendChild(btnAceptar);
    }

    modal.style.display = 'flex';
}

function cerrarModalCorporativo() {
    const modal = document.getElementById('modal-corporativo');
    if (modal) modal.style.display = 'none';
}

function volverABuscarFacturaMB() {
    document.getElementById('concmb-resultado-encontrada').style.display = 'none';
    document.getElementById('concmb-resultado-nueva').style.display = 'none';
    document.getElementById('concmb-mensaje-inicial').style.display = 'block';
    document.getElementById('concmb-factura-buscar').value = '';
    document.getElementById('concmb-factura-buscar').focus();
    conciliacionClienteActualMB = null;
}

// ==================== NAVEGACIÓN ====================
function mostrarConciliacionesMaracaibo() {
    const menu = document.getElementById('tmb-menu-principal');
    const baseDatos = document.getElementById('tmb-base-datos');
    const conciliaciones = document.getElementById('tmb-conciliaciones');
    const busqueda = document.getElementById('tmb-busqueda');

    if (menu) menu.style.display = 'none';
    if (baseDatos) baseDatos.style.display = 'none';
    if (busqueda) busqueda.style.display = 'none';
    if (conciliaciones) {
        conciliaciones.style.display = 'block';
        limpiarFormularioConciliacionMB();
        limpiarFormularioNuevaConciliacionMB();
        document.getElementById('concmb-resultado-encontrada').style.display = 'none';
        document.getElementById('concmb-resultado-nueva').style.display = 'none';
        document.getElementById('concmb-mensaje-inicial').style.display = 'block';
        document.getElementById('concmb-factura-buscar').value = '';
        document.getElementById('concmb-factura-buscar').focus();
    }
}

// ==================== BUSCAR FACTURA ====================
async function buscarFacturaConciliacionMB() {
    const nroFactura = document.getElementById('concmb-factura-buscar').value.trim();
    if (!nroFactura) {
        mostrarModalCorporativo('Validación', 'Ingrese un número de factura', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-factura-buscar').focus()
        }]);
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();
        const cliente = data.find(c => c.nro_factura === nroFactura);

        document.getElementById('concmb-mensaje-inicial').style.display = 'none';

        if (cliente) {
            conciliacionClienteActualMB = processItemData(cliente);
            mostrarClienteEncontradoMB(conciliacionClienteActualMB);
        } else {
            conciliacionClienteActualMB = null;
            mostrarFacturaNoEncontradaMB(nroFactura);
        }

    } catch (error) {
        console.error('Error buscando factura:', error);
        mostrarModalCorporativo('Error', 'Error al buscar la factura: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== MOSTRAR CLIENTE ENCONTRADO ====================
function mostrarClienteEncontradoMB(cliente) {
    document.getElementById('concmb-resultado-encontrada').style.display = 'block';
    document.getElementById('concmb-resultado-nueva').style.display = 'none';

    document.getElementById('concmb-info-factura').textContent = cliente.nro_factura || '-';
    document.getElementById('concmb-info-nombre').textContent = cliente.nombre_apellido || '-';
    document.getElementById('concmb-info-cedula').textContent = cliente.cedula || '-';
    document.getElementById('concmb-info-monto').textContent = formatCurrency(cliente.monto_factura);
    document.getElementById('concmb-info-deuda').textContent = formatCurrency(cliente.deuda);
    document.getElementById('concmb-info-cuotas').textContent = `${cliente.cuotas_pagadas || 0} de ${cliente.total_cuotas || 11}`;

    // Cargar historial de cuotas siempre (visible para info)
    cargarHistorialCuotasMB(cliente);

    // Verificar si la deuda es 0 o menor
    const deuda = parseNumberES(cliente.deuda);
    if (deuda <= 0) {
        // Factura cancelada - mostrar modal ANTES de permitir ingresar datos
        mostrarModalCorporativo(
            '¡Factura Cancelada!',
            'La factura ha sido cancelada completamente.\n\n¿Desea registrar una cuota adicional?',
            'exito',
            [
                {
                    texto: 'No, volver a búsqueda',
                    estilo: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;',
                    accion: () => {
                        // Ocultar todo y volver a búsqueda
                        document.getElementById('concmb-resultado-encontrada').style.display = 'none';
                        volverABuscarFacturaMB();
                    }
                },
                {
                    texto: 'Sí, agregar cuota',
                    estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                    accion: () => {
                        // Mostrar formulario para agregar cuota adicional
                        mostrarFormularioCuotaMB(cliente);
                    }
                }
            ]
        );
        // Ocultar el formulario de cuota hasta que el usuario decida
        ocultarFormularioCuotaMB();
    } else {
        // Deuda > 0, mostrar formulario normalmente
        mostrarFormularioCuotaMB(cliente);
    }
}

function mostrarFormularioCuotaMB(cliente) {
    const siguienteCuota = (cliente.cuotas_pagadas || 0) + 1;
    document.getElementById('concmb-cuota-numero').value = siguienteCuota > 11 ? 11 : siguienteCuota;
    document.getElementById('concmb-cuota-fecha').value = new Date().toISOString().split('T')[0];
    limpiarFormularioConciliacionMB();
    obtenerTasaPorFechaConciliacionMB();

    // Asegurar que el formulario de cuota esté visible
    const formCuota = document.querySelector('#concmb-resultado-encontrada .card:last-of-type');
    if (formCuota) formCuota.style.display = 'block';
}

function ocultarFormularioCuotaMB() {
    // Ocultar el formulario de cuota (el último card que contiene el formulario)
    const cards = document.querySelectorAll('#concmb-resultado-encontrada .card');
    cards.forEach((card, index) => {
        // El último card es el formulario de cuota
        if (index === cards.length - 1) {
            card.style.display = 'none';
        }
    });
}

// ==================== MOSTRAR FACTURA NO ENCONTRADA ====================
function mostrarFacturaNoEncontradaMB(nroFactura) {
    const resEncontrada = document.getElementById('concmb-resultado-encontrada');
    const resNueva = document.getElementById('concmb-resultado-nueva');
    const msgInicial = document.getElementById('concmb-mensaje-inicial');
    const noEncontrada = document.getElementById('concmb-no-encontrada');
    const numeroEl = document.getElementById('concmb-no-encontrada-numero');

    if (resEncontrada) resEncontrada.style.display = 'none';
    if (resNueva) resNueva.style.display = 'none';
    if (msgInicial) msgInicial.style.display = 'none';
    if (noEncontrada) {
        noEncontrada.style.display = 'block';
        if (numeroEl) numeroEl.textContent = nroFactura;
    }
}

function mostrarFormularioNuevoRegistroMB() {
    const noEncontrada = document.getElementById('concmb-no-encontrada');
    const nroFactura = document.getElementById('concmb-factura-buscar')?.value.trim() || '';

    if (noEncontrada) noEncontrada.style.display = 'none';
    mostrarNuevoRegistroMB(nroFactura);
}

// ==================== MOSTRAR NUEVO REGISTRO ====================
function mostrarNuevoRegistroMB(nroFactura) {
    document.getElementById('concmb-resultado-encontrada').style.display = 'none';
    document.getElementById('concmb-resultado-nueva').style.display = 'block';

    document.getElementById('concmb-nueva-factura').value = nroFactura;
    document.getElementById('concmb-nueva-fecha-factura').value = new Date().toISOString().split('T')[0];
    document.getElementById('concmb-nueva-cuota-fecha').value = new Date().toISOString().split('T')[0];

    document.getElementById('concmb-nueva-nombre').value = '';
    document.getElementById('concmb-nueva-cedula').value = '';
    document.getElementById('concmb-nueva-monto').value = '';
    document.getElementById('concmb-nueva-cuota-monto').value = '';
    document.getElementById('concmb-nueva-cuota-ref').value = '';
    document.getElementById('concmb-nueva-cuota-tasa').value = '';
    document.getElementById('concmb-nueva-cuota-dolar').value = '';
    document.getElementById('concmb-nueva-tasa-mensaje').textContent = '';

    obtenerTasaNuevaConciliacionMB();
}

// ==================== OBTENER TASA BCV POR FECHA ====================
async function obtenerTasaPorFechaConciliacionMB() {
    const fecha = document.getElementById('concmb-cuota-fecha').value;
    if (!fecha) return;

    const tasaInput = document.getElementById('concmb-cuota-tasa');
    const mensaje = document.getElementById('concmb-tasa-mensaje');

    mensaje.textContent = '⏳ Consultando tasa BCV...';
    mensaje.style.color = '#2c5282';

    let data = null;
    const token = localStorage.getItem('token');

    // FIX: Intentar tasa por fecha, capturar 404 y cualquier error
    try {
        const response = await fetch('/api/bcv/fecha/' + fecha, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (response.ok) {
            data = await response.json();
        } else {
            console.warn('Tasa por fecha devolvió ' + response.status + ', usando fallback');
        }
    } catch (e) {
        console.warn('Error fetch tasa fecha:', e.message);
    }

    // Si no hay datos válidos, intentar tasa actual
    if (!data || !data.exito || !data.tasa) {
        mensaje.textContent = '⚠️ No hay tasa histórica. Consultando tasa actual...';
        mensaje.style.color = '#ed8936';

        try {
            const response = await fetch('/api/bcv/actual', {
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });
            if (response.ok) {
                data = await response.json();
            }
        } catch (e) {
            console.warn('Error fetch tasa actual:', e.message);
        }

        if (data && data.exito && data.tasa && data.tasa.current) {
            tasaInput.value = data.tasa.current.usd.toFixed(4);
            conciliacionTasaActualMB = data.tasa.current.usd;
            mensaje.textContent = '✅ Tasa actual: ' + data.tasa.current.usd.toFixed(4) + ' Bs (fecha: ' + data.tasa.current.date + ')';
            mensaje.style.color = '#28a745';
            calcularDolarConciliacionMB();
            return;
        }
    }

    // Si tenemos datos de fecha válidos
    if (data && data.exito && data.tasa) {
        tasaInput.value = data.tasa.usd.toFixed(4);
        conciliacionTasaActualMB = data.tasa.usd;
        mensaje.textContent = '✅ Tasa BCV obtenida: ' + data.tasa.date;
        mensaje.style.color = '#28a745';
        calcularDolarConciliacionMB();
        return;
    }

    // Fallback final: tasa hardcodeada
    tasaInput.value = '721.3456';
    conciliacionTasaActualMB = 721.3456;
    mensaje.textContent = '⚠️ Usando tasa por defecto: 721.3456 Bs';
    mensaje.style.color = '#ed8936';
    calcularDolarConciliacionMB();
}

async function obtenerTasaNuevaConciliacionMB() {
    const fecha = document.getElementById('concmb-nueva-cuota-fecha').value;
    if (!fecha) return;

    const tasaInput = document.getElementById('concmb-nueva-cuota-tasa');
    const mensaje = document.getElementById('concmb-nueva-tasa-mensaje');

    mensaje.textContent = '⏳ Consultando tasa BCV...';
    mensaje.style.color = '#2c5282';

    let data = null;
    const token = localStorage.getItem('token');

    // FIX: Intentar tasa por fecha, capturar 404 y cualquier error
    try {
        const response = await fetch('/api/bcv/fecha/' + fecha, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (response.ok) {
            data = await response.json();
        } else {
            console.warn('Tasa por fecha devolvió ' + response.status + ', usando fallback');
        }
    } catch (e) {
        console.warn('Error fetch tasa fecha:', e.message);
    }

    // Si no hay datos válidos, intentar tasa actual
    if (!data || !data.exito || !data.tasa) {
        mensaje.textContent = '⚠️ No hay tasa histórica. Consultando tasa actual...';
        mensaje.style.color = '#ed8936';

        try {
            const response = await fetch('/api/bcv/actual', {
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });
            if (response.ok) {
                data = await response.json();
            }
        } catch (e) {
            console.warn('Error fetch tasa actual:', e.message);
        }

        if (data && data.exito && data.tasa && data.tasa.current) {
            tasaInput.value = data.tasa.current.usd.toFixed(4);
            conciliacionTasaActualMB = data.tasa.current.usd;
            mensaje.textContent = '✅ Tasa actual: ' + data.tasa.current.usd.toFixed(4) + ' Bs (fecha: ' + data.tasa.current.date + ')';
            mensaje.style.color = '#28a745';
            calcularDolarNuevaConciliacionMB();
            return;
        }
    }

    // Si tenemos datos de fecha válidos
    if (data && data.exito && data.tasa) {
        tasaInput.value = data.tasa.usd.toFixed(4);
        conciliacionTasaActualMB = data.tasa.usd;
        mensaje.textContent = '✅ Tasa BCV obtenida: ' + data.tasa.date;
        mensaje.style.color = '#28a745';
        calcularDolarNuevaConciliacionMB();
        return;
    }

    // Fallback final: tasa hardcodeada
    tasaInput.value = '721.3456';
    conciliacionTasaActualMB = 721.3456;
    mensaje.textContent = '⚠️ Usando tasa por defecto: 721.3456 Bs';
    mensaje.style.color = '#ed8936';
    calcularDolarNuevaConciliacionMB();
}

// ==================== CALCULAR DÓLAR DEPOSITADO ====================
function calcularDolarConciliacionMB() {
    const monto = parseFloat(document.getElementById('concmb-cuota-monto').value) || 0;
    const tasa = parseFloat(document.getElementById('concmb-cuota-tasa').value) || 0;

    if (monto > 0 && tasa > 0) {
        const dolar = monto / tasa;
        document.getElementById('concmb-cuota-dolar').value = dolar.toFixed(2);
    } else {
        document.getElementById('concmb-cuota-dolar').value = '';
    }
}

function calcularDolarNuevaConciliacionMB() {
    const monto = parseFloat(document.getElementById('concmb-nueva-cuota-monto').value) || 0;
    const tasa = parseFloat(document.getElementById('concmb-nueva-cuota-tasa').value) || 0;

    if (monto > 0 && tasa > 0) {
        const dolar = monto / tasa;
        document.getElementById('concmb-nueva-cuota-dolar').value = dolar.toFixed(2);
    } else {
        document.getElementById('concmb-nueva-cuota-dolar').value = '';
    }
}

// ==================== CARGAR HISTORIAL DE CUOTAS ====================
function cargarHistorialCuotasMB(cliente) {
    const tbody = document.getElementById('concmb-tabla-cuotas-body');
    if (!tbody) return;

    let html = '';
    let tieneCuotas = false;

    for (let i = 1; i <= 11; i++) {
        const cuota = cliente[`cuota_${i}`];
        const ref = cliente[`ref_cuota_${i}`];
        const fecha = cliente[`fecha_cuota_${i}`];
        const tasa = cliente[`tasa_cuota_${i}`];
        const dolar = cliente[`dolar_depositado_cuota_${i}`];

        if (parseNumberES(cuota) > 0) {
            tieneCuotas = true;
            html += `
                <tr>
                    <td><strong>Cuota ${i}</strong></td>
                    <td class="monto">${formatCurrency(cuota)}</td>
                    <td>${ref || '-'}</td>
                    <td>${formatDate(fecha)}</td>
                    <td>${parseNumberES(tasa) > 0 ? parseNumberES(tasa).toFixed(4) : '-'}</td>
                    <td class="monto">${parseNumberES(dolar) > 0 ? parseNumberES(dolar).toFixed(2) + ' $' : '-'}</td>
                </tr>
            `;
        }
    }

    if (!tieneCuotas) {
        html = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay cuotas registradas</td></tr>';
    }

    tbody.innerHTML = html;
}

// ==================== GUARDAR CUOTA (CLIENTE EXISTENTE) ====================
async function guardarCuotaConciliacionMB() {
    if (!conciliacionClienteActualMB) {
        mostrarModalCorporativo('Error', 'No hay cliente seleccionado', 'error');
        return;
    }

    const cuotaNum = parseInt(document.getElementById('concmb-cuota-numero').value);
    const monto = parseFloat(document.getElementById('concmb-cuota-monto').value);
    const ref = document.getElementById('concmb-cuota-ref').value.trim();
    const fecha = document.getElementById('concmb-cuota-fecha').value;
    const tasa = parseFloat(document.getElementById('concmb-cuota-tasa').value);
    const dolar = parseFloat(document.getElementById('concmb-cuota-dolar').value);

    if (!monto || monto <= 0) {
        mostrarModalCorporativo('Validación', 'Ingrese un monto válido', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-cuota-monto').focus()
        }]);
        return;
    }
    if (!ref) {
        mostrarModalCorporativo('Validación', 'Ingrese la referencia del depósito', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-cuota-ref').focus()
        }]);
        return;
    }
    if (!fecha) {
        mostrarModalCorporativo('Validación', 'Seleccione la fecha del depósito', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }
    if (!tasa || tasa <= 0) {
        mostrarModalCorporativo('Validación', 'La tasa BCV es obligatoria. Seleccione una fecha válida.', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }

    const data = {};
    data[`cuota_${cuotaNum}`] = monto;
    data[`ref_cuota_${cuotaNum}`] = ref;
    data[`fecha_cuota_${cuotaNum}`] = fecha;
    data[`tasa_cuota_${cuotaNum}`] = tasa;
    data[`dolar_depositado_cuota_${cuotaNum}`] = dolar || (monto / tasa);

    let montoDepositado = 0;
    for (let i = 1; i <= 11; i++) {
        if (i === cuotaNum) {
            montoDepositado += monto;
        } else {
            const c = parseNumberES(conciliacionClienteActualMB[`cuota_${i}`]);
            montoDepositado += c;
        }
    }

    const montoFactura = parseNumberES(conciliacionClienteActualMB.monto_factura);
    let deuda = montoFactura - montoDepositado;
    if (Math.abs(deuda) < 0.01) deuda = 0;

    data.monto_depositados = montoDepositado;
    data.deuda = deuda;

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo/${conciliacionClienteActualMB.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const result = await response.json();

        if (result.success || result.message) {
            const refreshResponse = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo/${conciliacionClienteActualMB.id}`);
            if (refreshResponse.ok) {
                const refreshed = await refreshResponse.json();
                conciliacionClienteActualMB = processItemData(refreshed);
            }

            await loadData();

            if (deuda <= 0) {
                // Factura cancelada después de guardar - ocultar formulario y mostrar modal
                ocultarFormularioCuotaMB();
                mostrarModalCorporativo(
                    '¡Factura Cancelada!',
                    'La factura ha sido cancelada completamente.\n\n¿Desea registrar una cuota adicional?',
                    'exito',
                    [
                        {
                            texto: 'No, volver a búsqueda',
                            estilo: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;',
                            accion: () => {
                                document.getElementById('concmb-resultado-encontrada').style.display = 'none';
                                volverABuscarFacturaMB();
                            }
                        },
                        {
                            texto: 'Sí, agregar cuota',
                            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                            accion: () => {
                                mostrarFormularioCuotaMB(conciliacionClienteActualMB);
                            }
                        }
                    ]
                );} else {
                mostrarModalCorporativo(
                    '¡Cuota Guardada!',
                    `Cuota ${cuotaNum} guardada exitosamente.\n\nDeuda restante: ${formatCurrency(deuda)}`,
                    'exito',
                    [{
                        texto: 'Aceptar',
                        estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                        accion: () => {
                            volverABuscarFacturaMB();
                        }
                    }]
                );
            }
        } else {
            mostrarModalCorporativo('Error', result.error || 'No se pudo guardar', 'error');
        }

    } catch (error) {
        console.error('Error guardando cuota:', error);
        mostrarModalCorporativo('Error', 'Error al guardar: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== GUARDAR NUEVO REGISTRO + CUOTA 1 ====================
async function guardarNuevaConciliacionMB() {
    const nroFactura = document.getElementById('concmb-nueva-factura').value.trim();
    const nombre = document.getElementById('concmb-nueva-nombre').value.trim();
    const cedula = document.getElementById('concmb-nueva-cedula').value.trim();
    const montoFactura = parseFloat(document.getElementById('concmb-nueva-monto').value);
    const fechaFactura = document.getElementById('concmb-nueva-fecha-factura').value;

    const cuotaMonto = parseFloat(document.getElementById('concmb-nueva-cuota-monto').value);
    const cuotaRef = document.getElementById('concmb-nueva-cuota-ref').value.trim();
    const cuotaFecha = document.getElementById('concmb-nueva-cuota-fecha').value;
    const cuotaTasa = parseFloat(document.getElementById('concmb-nueva-cuota-tasa').value);
    const cuotaDolar = parseFloat(document.getElementById('concmb-nueva-cuota-dolar').value);

    if (!nroFactura) {
        mostrarModalCorporativo('Validación', 'N° de factura es obligatorio', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }
    if (!nombre) {
        mostrarModalCorporativo('Validación', 'Nombre y apellido es obligatorio', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-nueva-nombre').focus()
        }]);
        return;
    }
    if (!montoFactura || montoFactura <= 0) {
        mostrarModalCorporativo('Validación', 'Monto de factura es obligatorio', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-nueva-monto').focus()
        }]);
        return;
    }
    if (!fechaFactura) {
        mostrarModalCorporativo('Validación', 'Fecha de factura es obligatoria', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }
    if (!cuotaMonto || cuotaMonto <= 0) {
        mostrarModalCorporativo('Validación', 'Ingrese el monto del depósito', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-nueva-cuota-monto').focus()
        }]);
        return;
    }
    if (!cuotaRef) {
        mostrarModalCorporativo('Validación', 'Ingrese la referencia del depósito', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
            accion: () => document.getElementById('concmb-nueva-cuota-ref').focus()
        }]);
        return;
    }
    if (!cuotaFecha) {
        mostrarModalCorporativo('Validación', 'Seleccione la fecha del depósito', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }
    if (!cuotaTasa || cuotaTasa <= 0) {
        mostrarModalCorporativo('Validación', 'La tasa BCV es obligatoria', 'warning', [{
            texto: 'Aceptar',
            estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
        }]);
        return;
    }

    const dolarCalculado = cuotaDolar || (cuotaMonto / cuotaTasa);
    const deuda = montoFactura - cuotaMonto;

    const data = {
        numero: nroFactura,
        nro_factura: nroFactura,
        nombre_apellido: nombre,
        cedula: cedula,
        monto_factura: montoFactura,
        fecha_factura: fechaFactura,
        monto_depositados: cuotaMonto,
        deuda: deuda > 0 ? deuda : 0,
        cuota_1: cuotaMonto,
        ref_cuota_1: cuotaRef,
        fecha_cuota_1: cuotaFecha,
        tasa_cuota_1: cuotaTasa,
        dolar_depositado_cuota_1: dolarCalculado
    };

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        mostrarModalCorporativo(
            '¡Registro Creado!',
            `Registro creado exitosamente.\n\nFactura: ${nroFactura}\nCliente: ${nombre}\nDeuda: ${formatCurrency(deuda > 0 ? deuda : 0)}`,
            'exito',
            [{
                texto: 'Aceptar',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                accion: () => {
                    volverABuscarFacturaMB();
                }
            }]
        );

        await loadData();

    } catch (error) {
        console.error('Error creando registro:', error);
        mostrarModalCorporativo('Error', 'Error al crear registro: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== LIMPIAR FORMULARIOS ====================
function limpiarFormularioConciliacionMB() {
    document.getElementById('concmb-cuota-monto').value = '';
    document.getElementById('concmb-cuota-ref').value = '';
    document.getElementById('concmb-cuota-tasa').value = '';
    document.getElementById('concmb-cuota-dolar').value = '';
    document.getElementById('concmb-tasa-mensaje').textContent = '';
}

function limpiarFormularioNuevaConciliacionMB() {
    document.getElementById('concmb-nueva-nombre').value = '';
    document.getElementById('concmb-nueva-cedula').value = '';
    document.getElementById('concmb-nueva-monto').value = '';
    document.getElementById('concmb-nueva-fecha-factura').value = new Date().toISOString().split('T')[0];
    document.getElementById('concmb-nueva-cuota-monto').value = '';
    document.getElementById('concmb-nueva-cuota-ref').value = '';
    document.getElementById('concmb-nueva-cuota-tasa').value = '';
    document.getElementById('concmb-nueva-cuota-dolar').value = '';
    document.getElementById('concmb-nueva-tasa-mensaje').textContent = '';
}


// ==================== NAVEGACIÓN - FUNCIONES FALTANTES ====================
function mostrarBusquedaMaracaibo() {
    const menu = document.getElementById('tmb-menu-principal');
    const baseDatos = document.getElementById('tmb-base-datos');
    const conciliaciones = document.getElementById('tmb-conciliaciones');
    const busqueda = document.getElementById('tmb-busqueda');

    if (menu) menu.style.display = 'none';
    if (baseDatos) baseDatos.style.display = 'none';
    if (conciliaciones) conciliaciones.style.display = 'none';
    if (busqueda) busqueda.style.display = 'block';
}

function volverMenuPrincipalMaracaibo() {
    // Vuelve al menú principal de Maracaibo
    mostrarMenuPrincipalMaracaibo();
}

// ==================== INTEGRACIÓN CON PANEL.JS ====================
// Esta función se ejecuta cuando panel.js carga esta sección
// Se asegura de que el menú principal se muestre al entrar a clientes
if (typeof window.mostrarSeccion === 'function') {
    const originalMostrarSeccionMB = window.mostrarSeccion;
    window.mostrarSeccion = function(seccion, tiendaPredefinida) {
        // Si viene tienda predefinida, guardarla como activa
        if (tiendaPredefinida) {
            window.tiendaActiva = tiendaPredefinida;
        }
        // Si entramos al módulo de pagos de Maracaibo, marcar tienda activa
        if (seccion === 'pagos') {
            window.tiendaActiva = 'maracaibo';
        }
        originalMostrarSeccionMB(seccion, tiendaPredefinida);
        if (seccion === 'pagos') {
            window.isInitializedMB = false;
            mostrarMenuPrincipalMaracaibo();
        }
    };
}


// ==================== ELIMINAR CUOTAS ====================
let cuotasAEliminarMB = [];

function confirmarEliminarCuotasMB() {
    // Obtener cuotas seleccionadas
    const checkboxes = document.querySelectorAll('input[name="eliminar-cuota"]:checked');
    cuotasAEliminarMB = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (cuotasAEliminarMB.length === 0) {
        mostrarModalCorporativo(
            'Selección Vacía',
            'No ha seleccionado ninguna cuota para eliminar.\n\nPor favor, marque al menos una cuota del checklist.',
            'warning',
            [{
                texto: 'Entendido',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
            }]
        );
        return;
    }

    // GUARDAR COPIA LOCAL de los datos necesarios antes de mostrar el modal
    // (currentEditItemMB puede perderse si el modal de edición se cierra)
    const datosConfirmacion = {
        id: currentEditIdMB,
        nro_factura: currentEditItemMB ? currentEditItemMB.nro_factura : 'N/A',
        nombre_apellido: currentEditItemMB ? currentEditItemMB.nombre_apellido : 'N/A',
        monto_factura: currentEditItemMB ? parseNumberES(currentEditItemMB.monto_factura) : 0,
        cuotas: {}
    };

    // Guardar datos de cada cuota seleccionada
    cuotasAEliminarMB.forEach(num => {
        if (currentEditItemMB) {
            datosConfirmacion.cuotas[num] = {
                monto: currentEditItemMB[`cuota_${num}`] || 0,
                ref: currentEditItemMB[`ref_cuota_${num}`] || '-',
                fecha: currentEditItemMB[`fecha_cuota_${num}`] || '-',
                tasa: currentEditItemMB[`tasa_cuota_${num}`] || '-',
                dolar: currentEditItemMB[`dolar_depositado_cuota_${num}`] || '-'
            };
        }
    });

    // Guardar también los datos de las cuotas NO seleccionadas para el cálculo
    datosConfirmacion.cuotasNoSeleccionadas = {};
    for (let i = 1; i <= 11; i++) {
        if (!cuotasAEliminarMB.includes(i) && currentEditItemMB) {
            datosConfirmacion.cuotasNoSeleccionadas[i] = {
                cuota: currentEditItemMB[`cuota_${i}`],
                ref: currentEditItemMB[`ref_cuota_${i}`],
                fecha: currentEditItemMB[`fecha_cuota_${i}`],
                tasa: currentEditItemMB[`tasa_cuota_${i}`],
                dolar: currentEditItemMB[`dolar_depositado_cuota_${i}`]
            };
        }
    }

    // Construir mensaje detallado
    let detalleCuotas = '';
    cuotasAEliminarMB.forEach(num => {
        const cuota = datosConfirmacion.cuotas[num] ? datosConfirmacion.cuotas[num].monto : 0;
        const ref = datosConfirmacion.cuotas[num] ? datosConfirmacion.cuotas[num].ref : '-';
        detalleCuotas += `\n• Cuota ${num}: ${formatCurrency(cuota)} (Ref: ${ref})`;
    });

    mostrarModalCorporativo(
        '¿Confirmar Eliminación?',
        `¿Está seguro de que desea eliminar ${cuotasAEliminarMB.length} cuota(s) seleccionada(s)?\n\n<strong>Factura:</strong> ${datosConfirmacion.nro_factura || 'N/A'}\n<strong>Cliente:</strong> ${datosConfirmacion.nombre_apellido || 'N/A'}\n\n<strong>Cuotas a eliminar:</strong>${detalleCuotas}\n\n⚠️ <strong>ADVERTENCIA:</strong> Esta acción no se puede deshacer. Los montos depositados serán recalculados y la deuda se actualizará automáticamente.`,
        'warning',
        [
            {
                texto: 'Cancelar',
                estilo: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;'
            },
            {
                texto: 'Sí, Eliminar Cuotas',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #e53e3e, #c53030); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
                accion: () => {
                    ejecutarEliminarCuotasMB(datosConfirmacion);
                }
            }
        ]
    );
}

async function ejecutarEliminarCuotasMB(datosConfirmacion) {
    if (!datosConfirmacion || !datosConfirmacion.id || cuotasAEliminarMB.length === 0) return;

    showLoading(true);

    try {
        // Preparar datos: setear a null las cuotas seleccionadas
        const data = {};
        let montoDepositado = 0;

        for (let i = 1; i <= 11; i++) {
            if (cuotasAEliminarMB.includes(i)) {
                // Eliminar cuota: setear todos los campos a null/0
                data[`cuota_${i}`] = null;
                data[`ref_cuota_${i}`] = null;
                data[`fecha_cuota_${i}`] = null;
                data[`tasa_cuota_${i}`] = null;
                data[`dolar_depositado_cuota_${i}`] = null;
            } else {
                // Mantener cuota existente y sumar al total depositado
                const cuotaData = datosConfirmacion.cuotasNoSeleccionadas[i];
                const cuota = cuotaData ? parseNumberES(cuotaData.cuota) : 0;
                if (cuota > 0) {
                    montoDepositado += cuota;
                    data[`cuota_${i}`] = cuotaData.cuota;
                    data[`ref_cuota_${i}`] = cuotaData.ref;
                    data[`fecha_cuota_${i}`] = cuotaData.fecha;
                    data[`tasa_cuota_${i}`] = cuotaData.tasa;
                    data[`dolar_depositado_cuota_${i}`] = cuotaData.dolar;
                }
            }
        }

        // Recalcular deuda
        const montoFactura = parseNumberES(datosConfirmacion.monto_factura);
        let deuda = montoFactura - montoDepositado;
        if (Math.abs(deuda) < 0.01) deuda = 0;

        data.monto_depositados = montoDepositado;
        data.deuda = deuda;

        // Enviar a la API
        const response = await fetch(`${API_BASE_URL_MB}/tienda-maracaibo/${datosConfirmacion.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        // Actualizar datos locales
        const index = allDataMB.findIndex(d => d.id === datosConfirmacion.id);
        if (index !== -1) {
            // Actualizar el item en memoria
            cuotasAEliminarMB.forEach(i => {
                allDataMB[index][`cuota_${i}`] = null;
                allDataMB[index][`ref_cuota_${i}`] = null;
                allDataMB[index][`fecha_cuota_${i}`] = null;
                allDataMB[index][`tasa_cuota_${i}`] = null;
                allDataMB[index][`dolar_depositado_cuota_${i}`] = null;
            });
            allDataMB[index].monto_depositados = montoDepositado;
            allDataMB[index].deuda = deuda;

            // Reprocesar el item
            allDataMB[index] = processItemData(allDataMB[index]);
        }

        // Refrescar la vista
        applyFiltersMB();
        updateSummaryMB();
        updateFilterCountsMB();

        // Cerrar modal de edición y mostrar éxito
        closeModalMB();

        mostrarModalCorporativo(
            '¡Cuotas Eliminadas!',
            `Se han eliminado ${cuotasAEliminarMB.length} cuota(s) exitosamente.\n\n<strong>Factura:</strong> ${datosConfirmacion.nro_factura || 'N/A'}\n<strong>Nueva Deuda:</strong> ${formatCurrency(deuda)}\n<strong>Total Depositado:</strong> ${formatCurrency(montoDepositado)}`,
            'exito',
            [{
                texto: 'Aceptar',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
            }]
        );

        cuotasAEliminarMB = [];

    } catch (error) {
        console.error('Error eliminando cuotas:', error);
        mostrarModalCorporativo(
            'Error',
            'Error al eliminar las cuotas: ' + error.message,
            'error',
            [{
                texto: 'Aceptar',
                estilo: 'padding: 10px 24px; background: linear-gradient(135deg, #e53e3e, #c53030); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;'
            }]
        );
    } finally {
        showLoading(false);
    }
}



    // Exponer funciones necesarias al scope global
    window.isInitializedMB = isInitializedMB;
    window.initTiendaMaracaibo = initTiendaMaracaibo;
    window.mostrarBaseDatosMaracaibo = mostrarBaseDatosMaracaibo;
    window.mostrarMenuPrincipalMaracaibo = mostrarMenuPrincipalMaracaibo;
    window.mostrarConciliacionesMaracaibo = mostrarConciliacionesMaracaibo;
    window.mostrarBusquedaMaracaibo = mostrarBusquedaMaracaibo;
    window.volverMenuPrincipalMaracaibo = volverMenuPrincipalMaracaibo;
    window.applyQuickFilterMB = applyQuickFilterMB;
    window.applyFiltersMB = applyFiltersMB;
    window.clearFiltersMB = clearFiltersMB;
    window.debouncedFilterMB = debouncedFilterMB;
    window.goToPageMB = goToPageMB;
    window.changeItemsPerPageMB = changeItemsPerPageMB;
    window.verDetalleMB = verDetalleMB;
    window.closeModalMB = closeModalMB;
    window.guardarCambiosMB = guardarCambiosMB;
    window.confirmarEliminarClienteMB = confirmarEliminarClienteMB;
    window.eliminarClienteMB = eliminarClienteMB;
    window.exportToExcelMB = exportToExcelMB;
    window.exportToPDFMB = exportToPDFMB;
    window.printTableMB = printTableMB;
    window.buscarFacturaConciliacionMB = buscarFacturaConciliacionMB;
    window.volverABuscarFacturaMB = volverABuscarFacturaMB;
    window.mostrarFormularioNuevoRegistroMB = mostrarFormularioNuevoRegistroMB;
    window.guardarCuotaConciliacionMB = guardarCuotaConciliacionMB;
    window.guardarNuevaConciliacionMB = guardarNuevaConciliacionMB;
    window.calcularDolarConciliacionMB = calcularDolarConciliacionMB;
    window.calcularDolarNuevaConciliacionMB = calcularDolarNuevaConciliacionMB;
    window.obtenerTasaPorFechaConciliacionMB = obtenerTasaPorFechaConciliacionMB;
    window.obtenerTasaNuevaConciliacionMB = obtenerTasaNuevaConciliacionMB;
    window.confirmarEliminarCuotasMB = confirmarEliminarCuotasMB;
    window.editarClienteMB = editarClienteMB;

})();
// Fin de IIFE Tienda Maracaibo
