// ============================================================
// MÓDULO GENÉRICO DE TIENDAS - Sistema de Créditos IPSFA
// ============================================================
// VERSIÓN: v6.6 (2026-07-19) — Modal Editar/Ver Cliente
//          corporativo en 2 columnas (ver LEEME-v6.6.md)
// Incluye: v6.5 (menú dashboard tienda) + v6.5.1 (scroll suave)
// REFACTOR v6: Un solo módulo reemplaza a:
//   - tienda-caracas-spa.js   (~2.100 líneas)
//   - tienda-maracay-spa.js   (~2.100 líneas)
//   - tienda-maracaibo-spa.js (~2.150 líneas)
//   - bloques duplicados de reportes de tiendas en panel.js
//   - funciones inline duplicadas en panel.html
//
// Cada tienda es una INSTANCIA de TiendaApp con su propia config.
// El HTML se genera dinámicamente con los mismos IDs/clases que
// antes (prefijos tc-/tm-/tmb-, conc-, busq-, etc.) para que el
// CSS existente siga aplicando sin cambios visuales.
//
// REGLAS DE NEGOCIO (idénticas a la versión original):
// - Cuotas: muestra cuotas pagadas reales
// - Deuda = monto_factura - monto_depositado (suma de cuotas)
// - Deudores: deuda > 0 | Al día: deuda <= 0
// - Facturas abiertas: deuda > 0 | Canceladas: deuda <= 0
// - Moneda: Bs (Bolívares) | Total de cuotas por factura: 30
//
// PARA AGREGAR UNA TIENDA NUEVA:
//   1. Crear la tabla en PostgreSQL (misma estructura)
//   2. Añadirla en TIENDAS de routes/tiendas.js
//   3. Añadir su entrada en TIENDAS_CONFIG (abajo)
//   4. Añadir nav-item + content-area vacío en panel.html
// ============================================================
(function () {
    'use strict';

    // ========================================================
    // v6.3: DETECCIÓN AUTOMÁTICA DE BANCO
    // Las cuentas bancarias venezolanas tienen 20 dígitos y los
    // primeros 4 identifican al banco (tabla oficial de códigos).
    // ========================================================
    const BANCOS_VENEZUELA = {
        '0102': 'Banco de Venezuela',
        '0104': 'Venezolano de Crédito',
        '0105': 'Banco Mercantil',
        '0108': 'BBVA Provincial',
        '0114': 'Bancaribe',
        '0115': 'Banco Exterior',
        '0128': 'Banco Caroní',
        '0134': 'Banesco',
        '0137': 'Banco Sofitasa',
        '0138': 'Banco Plaza',
        '0146': 'Bangente',
        '0151': 'BFC Banco Fondo Común',
        '0156': '100% Banco',
        '0157': 'DelSur Banco Universal',
        '0163': 'Banco del Tesoro',
        '0166': 'B.A.C. Banco Agrícola de Carabobo',
        '0168': 'Bancrecer',
        '0169': 'Mi Banco',
        '0171': 'Banco Activo',
        '0172': 'Bancamiga',
        '0173': 'Banco Internacional de Desarrollo',
        '0174': 'Banplus',
        '0175': 'Banco Bicentenario',
        '0176': 'N59 Banco Digital',
        '0177': 'BANFANB',
        '0178': 'N53 Banco de los Trabajadores',
        '0191': 'BNC Banco Nacional de Crédito',
        '0601': 'IMCP'
    };

    function detectarBanco(numeroCuenta) {
        const limpio = String(numeroCuenta || '').replace(/\D/g, '');
        if (limpio.length < 4) return '';
        return BANCOS_VENEZUELA[limpio.substring(0, 4)] || '';
    }

    // ========================================================
    // CONFIGURACIÓN DE TIENDAS
    // ========================================================
    // pfx:     prefijo de secciones internas (menu, base-datos...)
    // concPfx: prefijo de elementos de conciliaciones
    // busqPfx: prefijo de elementos de reportes
    // sfx:     sufijo de elementos de la tabla de base de datos
    // ========================================================
    const TIENDAS_CONFIG = {
        caracas: {
            key: 'caracas',
            nombre: 'Caracas',
            seccion: 'clientes',
            contentId: 'contentClientes',
            containerClass: 'tienda-caracas-container',
            pfx: 'tc',
            concPfx: 'conc',
            busqPfx: 'busq',
            sfx: '',
            api: '/api/tiendas/caracas',
            apiPagos: '/api/pagos/caracas',
            reportesApi: '/api/reportes/caracas'
        },
        maracay: {
            key: 'maracay',
            nombre: 'Maracay',
            seccion: 'creditos',
            contentId: 'contentMaracay',
            containerClass: 'tienda-maracay-container',
            pfx: 'tm',
            concPfx: 'concm',
            busqPfx: 'busqm',
            sfx: '-m',
            api: '/api/tiendas/maracay',
            apiPagos: '/api/pagos/maracay',
            reportesApi: '/api/reportes/maracay'
        },
        maracaibo: {
            key: 'maracaibo',
            nombre: 'Maracaibo',
            seccion: 'pagos',
            contentId: 'contentPagos',
            containerClass: 'tienda-maracaibo-container',
            pfx: 'tmb',
            concPfx: 'concmb',
            busqPfx: 'busqmb',
            sfx: '-mb',
            api: '/api/tiendas/maracaibo',
            apiPagos: '/api/pagos/maracaibo',
            reportesApi: '/api/reportes/maracaibo'
        }
    };

    const API_BASE_URL = window.location.origin + '/api';
    const TOTAL_CUOTAS = 30;
    const ITEMS_PER_PAGE_DEFAULT = 25;

    // ========================================================
    // v6.5 — MENÚ PRINCIPAL REDISEÑADO (dashboard operativo)
    // ========================================================
    const TM_COLORES = {
        caracas:   { acento: '#27ae60', suave: '#e3f2e9' },
        maracay:   { acento: '#7c5cbf', suave: '#efe9fa' },
        maracaibo: { acento: '#e67e22', suave: '#fdeee0' }
    };
    const TM_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const TM_CACHE_MS = 5 * 60 * 1000; // 5 minutos
    const TM_FMT = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function tmEsc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Monto numérico: acepta número JS o texto PG ("6664.97") vía parseNumberES
    function tmN(v) {
        if (v === null || v === undefined || v === '') return 0;
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        return parseNumberES(v);
    }

    // Parseo de fecha SIN new Date() (evita desfase UTC-4 Venezuela):
    // acepta "2026-07-19", "2026-07-19T10:00:00" o "19/07/2026"
    function tmParseFecha(v) {
        if (!v) return null;
        const s = String(v);
        let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return { anio: +m[1], mes: +m[2], dia: +m[3] };
        m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return { anio: +m[3], mes: +m[2], dia: +m[1] };
        return null;
    }


    // ========================================================
    // UTILIDADES COMPARTIDAS
    // (también se exponen en window: panel.js las usa y antes
    //  dependía de que tienda-caracas-spa.js las definiera)
    // ========================================================

    /**
     * Convierte un valor en formato español (punto=miles, coma=decimal)
     * a número JS. Ej: "80.075,55" -> 80075.55 | 1234.56 -> 1234.56
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
        const f = tmParseFecha(dateString);
        if (!f) return '-';
        return String(f.dia).padStart(2, '0') + '-' + String(f.mes).padStart(2, '0') + '-' + f.anio;
    }

    function showLoading(show) {
        console.log(show ? '⏳ Cargando...' : '✅ Listo');
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

    function redondearDecimales(valor, decimales = 2) {
        if (typeof valor !== 'number' || isNaN(valor) || !isFinite(valor)) return 0;
        const factor = Math.pow(10, decimales);
        return Math.round((valor + Number.EPSILON) * factor) / factor;
    }

    // --- Rol del usuario (lectura localStorage, misma clave 'usuario') ---
    function getUserRole() {
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
    function isAdminUser() { return getUserRole() === 'administrador'; }

    // --- Notificaciones: usa mostrarAlerta de panel.js si existe ---
    function notificar(mensaje, tipo) {
        if (typeof window.mostrarAlerta === 'function') {
            window.mostrarAlerta(mensaje, tipo);
        } else {
            console.log(`[${tipo || 'info'}] ${mensaje}`);
        }
    }

    // ========================================================
    // MODAL CORPORATIVO (elemento compartido #modal-corporativo)
    // ========================================================
    function mostrarModalCorporativo(titulo, mensaje, tipo, botones) {
        const modal = document.getElementById('modal-corporativo');
        if (!modal) {
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
        mensajeEl.innerHTML = String(mensaje).replace(/\n/g, '<br>');

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

    // Estilos reutilizables de botones de modales (idénticos al original)
    const BTN = {
        aceptar: 'padding: 10px 24px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
        warning: 'padding: 10px 24px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
        peligro: 'padding: 10px 24px; background: linear-gradient(135deg, #dc3545, #c53030); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;',
        neutro: 'padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;'
    };

    // ========================================================
    // CLASE TiendaApp - UNA INSTANCIA POR TIENDA
    // ========================================================
    class TiendaApp {
        constructor(cfg) {
            this.cfg = cfg;
            this.key = cfg.key;
            this.nombre = cfg.nombre;
            this.color = TM_COLORES[cfg.key]?.acento || '#3182ce';
            this.key    = cfg.key;
            this.color  = TM_COLORES[cfg.key]?.acento || '#3182ce';

            // Estado - Base de datos
            this.allData = [];
            this.filteredData = [];
            this.currentPage = 1;
            this.itemsPerPage = ITEMS_PER_PAGE_DEFAULT;
            this.currentFilter = 'abiertas';
            this.initialized = false;
            this.debounceTimer = null;

            // Estado - Modal de edición
            this.currentEditId = null;
            this.currentEditItem = null;
            this.cuotasAEliminar = [];

            // Estado - Conciliaciones
            this.concCliente = null;
            this.concTasa = null;

            // Estado - Reportes
            this.repDatos = [];
            this.repResumen = {};
            this.repPagina = 1;
            this.repPorPagina = 10;

            this.mounted = false;
        }

        // ---------- Helpers de IDs ----------
        id(nombre) { return this.cfg.pfx + '-' + nombre; }          // tc-menu-principal
        concId(nombre) { return this.cfg.concPfx + '-' + nombre; }  // conc-factura-buscar
        busqId(nombre) { return this.cfg.busqPfx + '-' + nombre; }  // busq-fecha-desde
        e(nombre) { return nombre + this.cfg.sfx; }                 // search-general-mb
        el(domId) { return document.getElementById(domId); }

        /**
         * fetch con token adjunto (v6.1). Las rutas de tiendas ahora
         * exigen Authorization; el interceptor de panel.js también lo
         * agrega, esto hace al módulo autosuficiente.
         */
        _apiFetch(url, opts) {
            const token = localStorage.getItem('token');
            opts = opts || {};
            opts.headers = Object.assign({}, opts.headers,
                token ? { 'Authorization': 'Bearer ' + token } : {});
            return fetch(url, opts);
        }

        // ====================================================
        // MONTAJE: genera el HTML del módulo dentro de su
        // content-area y conecta la delegación de eventos
        // ====================================================
        mount() {
            if (this.mounted) return;
            const container = this.el(this.cfg.contentId);
            if (!container) {
                console.error(`[Tiendas] No existe #${this.cfg.contentId} para ${this.cfg.nombre}`);
                return;
            }

            container.innerHTML = `
                <div class="${this.cfg.containerClass} tienda-modulo" data-tienda="${this.cfg.key}">
                    ${this.renderMenuPrincipal()}
                    ${this.renderBaseDatos()}
                    ${this.renderConciliaciones()}
                    ${this.renderReportes()}
                </div>
            `;

            this.attachEvents(container);
            this.mounted = true;
            console.log(`✅ Tienda ${this.cfg.nombre} montada`);
        }

        // ====================================================
        // HTML - MENÚ PRINCIPAL
        // ====================================================
        renderMenuPrincipal() {
            // v6.5 — Menú rediseñado: tarjetas interactivas + resumen operativo.
            // IMPORTANTE: conserva id="...-menu-principal" (showView lo alterna)
            // y los data-action existentes (delegación de attachEvents).
            const id = (n) => this.id('tm2-' + n);
            const svg = {
                bd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
                conc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
                est: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
                rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
            };
            const card = (accion, icono, titulo, desc, badgeId, metId) => `
                <div class="tm2-card" data-action="${accion}" role="button" tabindex="0">
                    <div class="tm2-card-head">
                        <div class="tm2-ico">${icono}</div>
                        <div class="tm2-badge gris" id="${badgeId}">—</div>
                    </div>
                    <h3>${titulo}</h3>
                    <div class="tm2-desc">${desc}</div>
                    <div class="tm2-foot"><div class="tm2-metrica" id="${metId}">—</div><div class="tm2-flecha">→</div></div>
                </div>`;

            return `
            <div id="${this.id('menu-principal')}" class="tm2" data-view="menu" style="display: none;">
                <div class="tm2-modulos">
                    ${card('show-base-datos', svg.bd, 'Base de Datos', 'Clientes, créditos, cuotas y datos bancarios', id('badge-bd'), id('met-bd'))}
                    ${card('show-conciliaciones', svg.conc, 'Conciliaciones Bancarias', 'Registro y verificación de pagos por factura', id('badge-conc'), id('met-conc'))}
                    ${card('ir-estadisticas', svg.est, 'Estadísticas', 'KPIs, evolución y análisis de cartera', id('badge-est'), id('met-est'))}
                    ${card('show-reportes', svg.rep, 'Reportes', 'Impresión y exportación de cartera y cobranza', id('badge-rep'), id('met-rep'))}
                </div>

                <div class="tm2-quick">
                    <span class="tm2-q-lbl">Acciones frecuentes:</span>
                    <button class="tm2-qbtn acento" data-action="qa-nuevo-cliente">＋ Nuevo cliente</button>
                    <button class="tm2-qbtn" data-action="show-conciliaciones">Registrar pago</button>
                    <button class="tm2-qbtn" data-action="export-excel">Exportar cartera</button>
                    <button class="tm2-qbtn" data-action="show-reportes">Ver reportes</button>
                </div>

                <div class="tm2-sep"><span>Resumen operativo de la tienda</span></div>

                <div class="tm2-grid tm2-g4">
                    <div class="tm2-kpi"><div class="tm2-k-lbl">Cartera total</div><div class="tm2-k-num" id="${id('k-cartera')}">—</div><div class="tm2-k-pie" id="${id('k-creditos')}">—</div></div>
                    <div class="tm2-kpi"><div class="tm2-k-lbl">Cobrado este mes</div><div class="tm2-k-num" id="${id('k-cobrado')}">—</div><div class="tm2-k-pie" id="${id('k-pagos-mes')}">—</div></div>
                    <div class="tm2-kpi"><div class="tm2-k-lbl">Deuda pendiente</div><div class="tm2-k-num" id="${id('k-deuda')}">—</div><div class="tm2-k-pie" id="${id('k-deudores')}">—</div></div>
                    <div class="tm2-kpi"><div class="tm2-k-lbl">% Recuperación</div><div class="tm2-k-num" id="${id('k-recup')}">—</div><div class="tm2-k-pie">cobrado / facturado</div></div>
                </div>

                <div class="tm2-grid tm2-g-2-1">
                    <div class="tm2-panel">
                        <h3>Cobranza del mes</h3>
                        <div class="tm2-sub">Clientes con al menos una cuota pagada en el mes</div>
                        <div class="tm2-prog"><div id="${id('prog')}" style="width:0%"></div></div>
                        <div class="tm2-prog-nums"><span><b id="${id('cm-cuotas')}">—</b> clientes cobrados</span><span><b id="${id('cm-pct')}">—</b> del mes</span></div>
                        <div class="tm2-mini">
                            <div class="tm2-m"><div class="tm2-m-v" id="${id('cm-hoy')}">—</div><div class="tm2-m-l">Cobrado hoy</div></div>
                            <div class="tm2-m"><div class="tm2-m-v" id="${id('cm-pagos-hoy')}">—</div><div class="tm2-m-l">Pagos hoy</div></div>
                            <div class="tm2-m"><div class="tm2-m-v" id="${id('cm-faltan')}">—</div><div class="tm2-m-l">Clientes por cobrar</div></div>
                        </div>
                    </div>
                    <div class="tm2-panel">
                        <h3>Alertas operativas</h3>
                        <div class="tm2-sub">Lo que requiere atención hoy</div>
                        <div id="${id('alertas')}"></div>
                    </div>
                </div>

                <div class="tm2-grid tm2-g-2-1">
                    <div class="tm2-panel">
                        <h3>Evolución de cobros — últimos 6 meses</h3>
                        <div class="tm2-sub">Monto cobrado por mes (solo esta tienda)</div>
                        <div id="${id('ch-evo')}" class="tm2-chart"></div>
                    </div>
                    <div class="tm2-panel">
                        <h3>Estado de cartera</h3>
                        <div class="tm2-sub">Créditos según su situación de pago</div>
                        <div id="${id('ch-donut')}" class="tm2-chart"></div>
                    </div>
                </div>

                <div class="tm2-grid tm2-g2">
                    <div class="tm2-panel">
                        <h3>Mayor tiempo sin pagar</h3>
                        <div class="tm2-sub">Ordenado por meses sin pagar; en empate, mayor deuda</div>
                        <div class="table-responsive">
                        <table class="tm2-tabla">
                            <thead><tr><th>Cliente</th><th>Sin pagar</th><th class="num">Deuda</th></tr></thead>
                            <tbody id="${id('tb-sinpagar')}"></tbody>
                        </table>
                        </div>
                    </div>
                    <div class="tm2-panel">
                        <h3>Últimos pagos registrados</h3>
                        <div class="tm2-sub">Actividad reciente de la tienda</div>
                        <div class="table-responsive">
                        <table class="tm2-tabla">
                            <thead><tr><th>Cliente</th><th>Fecha</th><th class="num">Monto</th></tr></thead>
                            <tbody id="${id('tb-ultimos')}"></tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        // ====================================================
        // v6.5 — DASHBOARD DEL MENÚ (cálculo + render)
        // ====================================================
        async initMenuDashboard() {
            const ahora = Date.now();
            if (this._menuDashListo && (ahora - (this._menuDashTs || 0)) < TM_CACHE_MS) return;
            try {
                if (!this.allData || !this.allData.length || (ahora - (this._menuDashTs || 0)) >= TM_CACHE_MS) {
                    await this.loadData();
                }
                this._menuDashTs = Date.now();
                this._menuDashListo = true;
                this.renderMenuDashboard();
            } catch (e) {
                console.error(`[${this.cfg.nombre}] Error en dashboard del menú:`, e);
            }
        }

        // Cálculo puro (testeable): recibe clientes crudos o procesados
        tmCalcularMenu(clientes, fechaRef) {
            const hoy = fechaRef || new Date();
            const mesAct = hoy.getMonth() + 1, anioAct = hoy.getFullYear(), diaAct = hoy.getDate();
            const lista = clientes || [];
            let cartera = 0, cobradoTotal = 0, deuda = 0, deudores = 0;
            let cobradoMes = 0, pagosMes = 0, cobradoHoy = 0, pagosHoy = 0;
            let conCuotaMes = 0, porCobrar = 0, alDia = 0, incompleto = 0, noPago = 0, morosos = 0;
            const evoMap = {};
            const ultimos = [], sinPagar = [];

            lista.forEach(c => {
                const factura = tmN(c.monto_factura);
                const depositado = (typeof c.monto_depositados === 'number') ? c.monto_depositados : tmN(c.monto_depositados);
                const deudaC = (typeof c.deuda === 'number') ? c.deuda : Math.max(0, factura - depositado);
                cartera += factura;
                cobradoTotal += depositado;
                if (deudaC > 0) { deuda += deudaC; deudores++; }

                let ultimaCuota = null, cuotasPagadas = 0, pagoEsteMes = false;
                for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                    const monto = tmN(c['cuota_' + i]);
                    if (monto > 0) {
                        cuotasPagadas++;
                        const f = tmParseFecha(c['fecha_cuota_' + i]);
                        if (f) {
                            const key = f.anio * 12 + f.mes;
                            if (!ultimaCuota || key > ultimaCuota.key) ultimaCuota = { key, anio: f.anio, mes: f.mes };
                            if (f.anio === anioAct && f.mes === mesAct) {
                                pagoEsteMes = true;
                                cobradoMes += monto;
                                pagosMes++;
                                if (f.dia === diaAct) { cobradoHoy += monto; pagosHoy++; }
                            }
                            evoMap[key] = (evoMap[key] || 0) + monto;
                            ultimos.push({ nombre: c.nombre_apellido || 'Sin nombre', f, monto });
                        }
                    }
                }
                if (pagoEsteMes) conCuotaMes++;
                if (deudaC > 0 && !pagoEsteMes) porCobrar++;

                if (deudaC <= 0) alDia++;
                else if (cuotasPagadas === 0) noPago++;
                else incompleto++;

                if (deudaC > 0) {
                    const ref = ultimaCuota || tmParseFecha(c.fecha_factura);
                    const mesesSinPagar = ref ? Math.max(0, (anioAct - ref.anio) * 12 + (mesAct - ref.mes)) : 999;
                    if (mesesSinPagar >= 2) morosos++;
                    sinPagar.push({
                        nombre: c.nombre_apellido || 'Sin nombre',
                        deuda: deudaC, mesesSinPagar,
                        ultimo: ultimaCuota, nuncaPago: !ultimaCuota
                    });
                }
            });

            sinPagar.sort((a, b) => (b.mesesSinPagar - a.mesesSinPagar) || (b.deuda - a.deuda));
            ultimos.sort((a, b) => (b.f.anio * 10000 + b.f.mes * 100 + b.f.dia) - (a.f.anio * 10000 + a.f.mes * 100 + a.f.dia));

            const evoLabels = [], evoData = [];
            for (let k = 5; k >= 0; k--) {
                let m = mesAct - k, a = anioAct;
                while (m <= 0) { m += 12; a--; }
                evoLabels.push(TM_MESES[m - 1]);
                evoData.push(evoMap[a * 12 + m] || 0);
            }

            return {
                cartera, cobradoTotal, deuda, deudores,
                creditos: lista.length,
                cobradoMes, pagosMes, cobradoHoy, pagosHoy,
                conCuotaMes, porCobrar, morosos,
                recuperacion: cartera > 0 ? (cobradoTotal / cartera * 100) : 0,
                distribucion: { alDia, incompleto, noPago },
                evolucion: { labels: evoLabels, data: evoData },
                top5: sinPagar.slice(0, 5),
                ultimos: ultimos.slice(0, 5)
            };
        }

        renderMenuDashboard() {
            const id = (n) => this.id('tm2-' + n);
            const el = (n) => this.el(id(n));
            const raiz = this.el(this.id('menu-principal'));
            if (!raiz) return;

            // Color de la tienda en todo el menú
            const col = TM_COLORES[this.cfg.key] || TM_COLORES.caracas;
            raiz.style.setProperty('--acento', col.acento);
            raiz.style.setProperty('--acento-suave', col.suave);

            const r = this.tmCalcularMenu(this.allData, new Date());
            const setTxt = (n, v) => { const e = el(n); if (e) e.textContent = v; };
            const setHtml = (n, v) => { const e = el(n); if (e) e.innerHTML = v; };

            // --- KPIs ---
            setTxt('k-cartera', 'Bs ' + TM_FMT.format(r.cartera));
            setHtml('k-creditos', '<b>' + r.creditos + '</b> créditos activos');
            setTxt('k-cobrado', 'Bs ' + TM_FMT.format(r.cobradoMes));
            setHtml('k-pagos-mes', '<b class="up">' + r.pagosMes + '</b> pagos este mes');
            setTxt('k-deuda', 'Bs ' + TM_FMT.format(r.deuda));
            setHtml('k-deudores', '<b class="warn">' + r.deudores + '</b> deudores activos');
            setTxt('k-recup', r.recuperacion.toFixed(1).replace('.', ',') + '%');

            // --- Tarjetas de módulo ---
            setTxt('badge-bd', String(r.creditos));
            setHtml('met-bd', '<b>' + r.creditos + '</b> clientes · <b>' + r.deudores + '</b> con deuda');
            setTxt('badge-conc', String(r.pagosHoy));
            const badgeConc = el('badge-conc');
            if (badgeConc) badgeConc.className = 'tm2-badge ' + (r.pagosHoy > 0 ? 'verde' : 'gris');
            setHtml('met-conc', '<b>' + r.pagosHoy + '</b> pagos hoy · <b>' + r.pagosMes + '</b> este mes');
            setTxt('badge-est', '›');
            setHtml('met-est', 'Recuperación <b>' + r.recuperacion.toFixed(1).replace('.', ',') + '%</b>');
            setTxt('badge-rep', '›');
            setHtml('met-rep', 'Excel · PDF');

            // --- Cobranza del mes ---
            const pct = r.creditos > 0 ? Math.round(r.conCuotaMes / r.creditos * 100) : 0;
            const prog = el('prog');
            if (prog) prog.style.width = pct + '%';
            setTxt('cm-cuotas', r.conCuotaMes + ' / ' + r.creditos);
            setTxt('cm-pct', pct + '%');
            setTxt('cm-hoy', 'Bs ' + TM_FMT.format(r.cobradoHoy));
            setTxt('cm-pagos-hoy', String(r.pagosHoy));
            setTxt('cm-faltan', String(r.porCobrar));

            // --- Alertas ---
            let alertas = '';
            if (r.morosos > 0) {
                alertas += `<div class="tm2-al r"><div class="tm2-al-ico">!</div><div><b>${r.morosos} clientes con 2+ meses sin pagar</b>Gestión de cobro urgente</div><span class="tm2-al-acc" data-action="ver-morosos">Ver lista</span></div>`;
            }
            if (r.porCobrar > 0) {
                alertas += `<div class="tm2-al a"><div class="tm2-al-ico">◷</div><div><b>${r.porCobrar} clientes sin cuota este mes</b>Aún no registran pago en ${TM_MESES[new Date().getMonth()]}</div><span class="tm2-al-acc" data-action="ver-sin-cuota-mes">Ver lista</span></div>`;
            }
            alertas += r.pagosHoy > 0
                ? `<div class="tm2-al v"><div class="tm2-al-ico">✓</div><div><b>${r.pagosHoy} pagos registrados hoy</b>Bs ${TM_FMT.format(r.cobradoHoy)} cobrados hoy</div></div>`
                : `<div class="tm2-al a"><div class="tm2-al-ico">i</div><div><b>Sin pagos registrados hoy</b>Aún no llegan cuotas en la fecha de hoy</div></div>`;
            setHtml('alertas', alertas);

            // --- Gráficos (degradación elegante si ApexCharts no cargó) ---
            if (this._menuCharts) { this._menuCharts.forEach(ch => { try { ch.destroy(); } catch (e) {} }); }
            this._menuCharts = [];
            if (window.ApexCharts) {
                const chEvo = el('ch-evo'), chDonut = el('ch-donut');
                if (chEvo) {
                    chEvo.innerHTML = '';
                    const c1 = new ApexCharts(chEvo, {
                        chart: { type: 'area', height: 220, toolbar: { show: false }, fontFamily: 'inherit' },
                        series: [{ name: 'Cobrado', data: r.evolucion.data }],
                        xaxis: { categories: r.evolucion.labels, labels: { style: { fontSize: '11px' } } },
                        yaxis: { labels: { formatter: (v) => v >= 1000000 ? (v / 1000000).toFixed(2).replace('.', ',') + ' M' : (v >= 1000 ? Math.round(v / 1000) + 'K' : String(Math.round(v))), style: { fontSize: '11px' } } },
                        stroke: { curve: 'smooth', width: 2 },
                        fill: { type: 'gradient', gradient: { opacityFrom: .3, opacityTo: .02 } },
                        colors: [col.acento],
                        dataLabels: { enabled: false },
                        tooltip: { y: { formatter: (v) => 'Bs ' + TM_FMT.format(v) } },
                        grid: { borderColor: '#eef1f6' }
                    });
                    c1.render();
                    this._menuCharts.push(c1);
                }
                if (chDonut) {
                    chDonut.innerHTML = '';
                    const c2 = new ApexCharts(chDonut, {
                        chart: { type: 'donut', height: 220, fontFamily: 'inherit' },
                        series: [r.distribucion.alDia, r.distribucion.incompleto, r.distribucion.noPago],
                        labels: ['Al día', 'Incompleto', 'Sin pago'],
                        colors: ['#27ae60', '#e67e22', '#c0392b'],
                        legend: { position: 'bottom', fontSize: '11px' },
                        dataLabels: { enabled: false },
                        plotOptions: { pie: { donut: { size: '68%', labels: { show: true,
                            value: { fontSize: '20px', fontWeight: 700, color: '#16324f' },
                            total: { show: true, label: 'créditos', fontSize: '11px', color: '#64748b' } } } } }
                    });
                    c2.render();
                    this._menuCharts.push(c2);
                }
            } else {
                setHtml('ch-evo', '<div class="tm2-sin-chart">Gráfico no disponible (ApexCharts no cargó)</div>');
                setHtml('ch-donut', '<div class="tm2-sin-chart">Gráfico no disponible (ApexCharts no cargó)</div>');
            }

            // --- Mayor tiempo sin pagar ---
            const tbSP = el('tb-sinpagar');
            if (tbSP) {
                tbSP.innerHTML = r.top5.length === 0
                    ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Sin deudores en este momento</td></tr>'
                    : r.top5.map(x => {
                        const sev = x.mesesSinPagar >= 2 ? 'r' : (x.mesesSinPagar === 1 ? 'a' : 'v');
                        const det = x.nuncaPago ? 'sin pagos registrados'
                            : (x.ultimo ? 'último: ' + TM_MESES[x.ultimo.mes - 1] + ' ' + x.ultimo.anio : 'sin fecha');
                        const txtMeses = x.mesesSinPagar === 999 ? '—' : x.mesesSinPagar + (x.mesesSinPagar === 1 ? ' mes' : ' meses');
                        return `<tr><td class="cli">${tmEsc(x.nombre)}<span class="det">${det}</span></td>` +
                            `<td><span class="tm2-pill ${sev}">${txtMeses}</span></td>` +
                            `<td class="num">Bs ${TM_FMT.format(x.deuda)}</td></tr>`;
                    }).join('');
            }

            // --- Últimos pagos ---
            const tbU = el('tb-ultimos');
            if (tbU) {
                tbU.innerHTML = r.ultimos.length === 0
                    ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Sin pagos registrados</td></tr>'
                    : r.ultimos.map(x =>
                        `<tr><td class="cli">${tmEsc(x.nombre)}</td>` +
                        `<td>${String(x.f.dia).padStart(2, '0')}/${String(x.f.mes).padStart(2, '0')}/${x.f.anio}</td>` +
                        `<td class="num">Bs ${TM_FMT.format(x.monto)}</td></tr>`
                    ).join('');
            }
        }


        // ====================================================
        // HTML - BASE DE DATOS (tabla, filtros, paginación)
        // IDs idénticos a la versión original (sufijo por tienda)
        // ====================================================
        renderBaseDatos() {
            const sfx = this.cfg.sfx;
            return `
                <div id="${this.id('base-datos')}" class="tienda-bd" style="display: none;">
                    <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
                    <div class="quick-filters">
                        <button class="filter-btn active" data-action="quick-filter" data-filter="all">Todos <span class="badge" id="count-all${sfx}">0</span></button>
                        <button class="filter-btn" data-action="quick-filter" data-filter="deudores">Deudores <span class="badge badge-danger" id="count-deudores${sfx}">0</span></button>
                        <button class="filter-btn" data-action="quick-filter" data-filter="incompletos">Cuotas Incompletas <span class="badge badge-warning" id="count-incompletos${sfx}">0</span></button>
                        <button class="filter-btn" data-action="quick-filter" data-filter="aldia">Al Dia <span class="badge badge-success" id="count-aldia${sfx}">0</span></button>
                        <button class="filter-btn" data-action="quick-filter" data-filter="abiertas">Facturas Abiertas <span class="badge badge-info" id="count-abiertas${sfx}">0</span></button>
                        <button class="filter-btn" data-action="quick-filter" data-filter="canceladas">Facturas Canceladas <span class="badge badge-secondary" id="count-canceladas${sfx}">0</span></button>
                    </div>
                    <div class="advanced-search">
                        <div class="search-row">
                            <div class="search-field"><input type="text" id="search-general${sfx}" placeholder="Buscar por nombre..." data-action-input="debounced-filter"></div>
                            <div class="search-field"><input type="text" id="search-factura${sfx}" placeholder="N Factura" data-action-input="debounced-filter"></div>
                            <div class="search-field"><input type="text" id="search-cedula${sfx}" placeholder="Cedula" data-action-input="debounced-filter"></div>
                        </div>
                        <div class="search-row">
                            <div class="search-field date-field">
                                <input type="date" id="fecha-desde${sfx}" data-action-change="apply-filters">
                                <span>a</span>
                                <input type="date" id="fecha-hasta${sfx}" data-action-change="apply-filters">
                            </div>
                            <div class="search-field">
                                <input type="number" id="monto-min${sfx}" placeholder="Monto minimo" data-action-input="debounced-filter">
                                <span>-</span>
                                <input type="number" id="monto-max${sfx}" placeholder="Monto maximo" data-action-input="debounced-filter">
                            </div>
                            <button class="btn-search" data-action="apply-filters">&#128269; Buscar</button>
                            <button class="btn-clear" data-action="clear-filters">&#10060; Limpiar</button>
                        </div>
                    </div>
                    <div class="summary-cards">
                        <div class="summary-card"><span class="number" id="total-clientes${sfx}">0</span><span class="label">Total Clientes</span></div>
                        <div class="summary-card"><span class="number" id="total-facturado${sfx}">$0</span><span class="label">Total Facturado</span></div>
                        <div class="summary-card danger"><span class="number" id="total-deuda${sfx}">$0</span><span class="label">Total Deuda</span></div>
                        <div class="summary-card success"><span class="number" id="total-recaudado${sfx}">$0</span><span class="label">Total Recaudado</span></div>
                    </div>
                    <div class="table-container table-responsive">
                        <table class="data-table" id="tabla-clientes${sfx}">
                            <thead><tr><th>N</th><th>Fact.</th><th>Cliente</th><th>Monto (Bs)</th><th>Fecha</th><th>Cedula</th><th>Cuotas</th><th>Depositado (Bs)</th><th>Deuda (Bs)</th><th>Estado</th><th>Acc.</th></tr></thead>
                            <tbody id="tabla-body${sfx}"></tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <button id="btn-primero${sfx}" data-action="goto-page" data-page="first" disabled>|&lt;</button>
                        <button id="btn-anterior${sfx}" data-action="goto-page" data-page="prev" disabled>&lt;</button>
                        <span id="pagina-info${sfx}">Pagina 1 de 1</span>
                        <button id="btn-siguiente${sfx}" data-action="goto-page" data-page="next">&gt;</button>
                        <button id="btn-ultimo${sfx}" data-action="goto-page" data-page="last">&gt;|</button>
                        <select id="registros-por-pagina${sfx}" data-action-change="items-per-page">
                            <option value="10">10</option><option value="25" selected>25</option><option value="50">50</option><option value="100">100</option>
                        </select>
                    </div>
                    <div class="export-buttons">
                        <button class="btn-export excel" data-action="export-excel">&#128190; Exportar Excel</button>
                        <button class="btn-export pdf" data-action="export-pdf">&#128196; Exportar PDF</button>
                        <button class="btn-export print" data-action="print-table">&#128424; Imprimir</button>
                    </div>
                </div>
            `;
        }

        // ====================================================
        // HTML - CONCILIACIONES BANCARIAS
        // IDs idénticos a la versión original (prefijo por tienda)
        // ====================================================
        renderConciliaciones() {
            const c = this.cfg.concPfx;
            const color = this.color;
            return `
                <div id="${this.id('conciliaciones')}" style="display: none;">
                    <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
                    <div class="section-header"><h3>Conciliaciones Bancarias</h3><p>Registro de depositos bancarios por numero de factura</p></div>

                    <div class="card" style="margin-bottom: 20px; padding: 25px;">
                        <!-- MENSAJE INICIAL -->
                        <div id="${c}-mensaje-inicial" style="text-align:center;padding:30px;color:#718096;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:10px;opacity:.5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            <p>Ingrese un número de factura para buscar o cree un nuevo registro.</p>
                        </div>

                        <!-- BÚSQUEDA -->
                        <div id="${c}-busqueda">
                            <h4>Buscar Factura</h4>
                            <div class="form-row conc-form-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                                <input type="text" id="${c}-factura-buscar" placeholder="Numero de Factura" style="flex:1;min-width:200px;padding:10px;border:1px solid #ddd;border-radius:6px;" onkeypress="if(event.key==='Enter')window.Tiendas.get('${this.cfg.key}').buscarFactura()">
                                <button onclick="window.Tiendas.get('${this.cfg.key}').buscarFactura()" class="btn-primary" style="background:${color};color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Buscar</button>
                                <button onclick="window.Tiendas.get('${this.cfg.key}').mostrarNuevoRegistro()" class="btn-success" style="background:#38a169;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">+ Nuevo Registro</button>
                            </div>
                        </div>

                        <!-- RESULTADO ENCONTRADA -->
                        <div id="${c}-resultado-encontrada" style="display:none;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                                <h4 style="color:${color};margin:0;">Factura Encontrada</h4>
                                <button onclick="window.Tiendas.get('${this.cfg.key}').volverABuscarFactura()" style="background:#e2e8f0;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;">&#8592; Volver a búsqueda</button>
                            </div>
                            <div class="conc-info-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">
                                <div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Factura</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-factura">-</div></div>
                                <div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cliente</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-nombre">-</div></div>
                                <div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cédula</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-cedula">-</div></div>
                                <div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Monto</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-monto">-</div></div>
                                <div style="background:#fff5f5;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Deuda</div><div style="font-size:16px;font-weight:700;color:#e53e3e;" id="${c}-info-deuda">-</div></div>
                                <div style="background:#f0fff4;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cuotas</div><div style="font-size:16px;font-weight:700;color:#38a169;" id="${c}-info-cuotas">-</div></div>
                            </div>

                            <h5 style="margin:15px 0 8px;color:#1a365d;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Historial de Cuotas</h5>
                            <div class="table-responsive" style="margin-bottom:20px;">
                                <table class="data-table" style="font-size:11px;">
                                    <thead><tr><th>Cuota</th><th>Monto Bs</th><th>Referencia</th><th>Fecha</th><th>Tasa</th><th>Monto $</th></tr></thead>
                                    <tbody id="${c}-tabla-cuotas-body"></tbody>
                                </table>
                            </div>

                            <div data-card="form-cuota" style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;background:#fff;">
                                <h5 style="margin:0 0 12px;color:${color};font-size:13px;">Registrar Nueva Cuota</h5>
                                <div class="form-grid-cuota" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
                                    <div class="form-group"><label>N° Cuota</label><input type="number" id="${c}-cuota-numero" readonly style="background:#f7fafc;font-weight:700;"></div>
                                    <div class="form-group"><label>Monto (Bs) *</label><input type="number" id="${c}-cuota-monto" step="0.01" oninput="window.Tiendas.get('${this.cfg.key}').calcularDolar()"></div>
                                    <div class="form-group"><label>Referencia *</label><input type="text" id="${c}-cuota-ref"></div>
                                    <div class="form-group"><label>Fecha *</label><input type="date" id="${c}-cuota-fecha" onchange="window.Tiendas.get('${this.cfg.key}').obtenerTasaPorFecha()"></div>
                                    <div class="form-group"><label>Tasa BCV *</label><input type="number" id="${c}-cuota-tasa" step="0.0001" oninput="window.Tiendas.get('${this.cfg.key}').calcularDolar()"></div>
                                    <div class="form-group"><label>Monto ($)</label><input type="number" id="${c}-cuota-dolar" readonly style="background:#ebf8ff;font-weight:600;"></div>
                                </div>
                                <div id="${c}-tasa-mensaje" style="margin-top:8px;font-size:11px;"></div>
                                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
                                    <button onclick="window.Tiendas.get('${this.cfg.key}').limpiarFormularioConciliacion()" style="background:#e2e8f0;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Limpiar</button>
                                    <button onclick="window.Tiendas.get('${this.cfg.key}').guardarCuota()" style="background:${color};color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600;">&#128190; Guardar Cuota</button>
                                </div>
                            </div>
                        </div>

                        <!-- NO ENCONTRADA -->
                        <div id="${c}-no-encontrada" style="display:none;text-align:center;padding:30px;">
                            <div style="font-size:48px;margin-bottom:10px;">&#128269;</div>
                            <h4 style="color:#e53e3e;margin:0 0 8px;">Factura no encontrada</h4>
                            <p style="color:#718096;margin:0 0 15px;">No existe la factura N° <strong id="${c}-no-encontrada-numero"></strong> en esta tienda.</p>
                            <button onclick="window.Tiendas.get('${this.cfg.key}').mostrarFormularioNuevoRegistro()" style="background:${color};color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Crear nuevo registro</button>
                        </div>

                        <!-- NUEVO REGISTRO -->
                        <div id="${c}-nuevo-registro" style="display:none;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                                <h4 style="color:${color};margin:0;">Nuevo Registro de Credito</h4>
                                <button onclick="window.Tiendas.get('${this.cfg.key}').volverABuscar()" style="background:#e2e8f0;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;">&#8592; Volver</button>
                            </div>

                            <!-- PESTAÑAS -->
                            <div class="tabs-nuevo-registro" style="margin-bottom:20px;">
                                <div class="tab-header" style="display:flex;border-bottom:2px solid #e2e8f0;gap:4px;">
                                    <button type="button" class="tab-btn active" data-tab="factura" onclick="window.Tiendas.get('${this.cfg.key}').cambiarTabNuevoRegistro('factura')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid ${color};transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;">
                                        <span style="font-size:16px;">&#128196;</span> Datos de la Factura
                                    </button>
                                    <button type="button" class="tab-btn" data-tab="inicial" onclick="window.Tiendas.get('${this.cfg.key}').cambiarTabNuevoRegistro('inicial')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;">
                                        <span style="font-size:16px;">&#128176;</span> Deposito Inicial
                                    </button>
                                    <button type="button" class="tab-btn" data-tab="cuotas" onclick="window.Tiendas.get('${this.cfg.key}').cambiarTabNuevoRegistro('cuotas')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;">
                                        <span style="font-size:16px;">&#128202;</span> Plan de Cuotas
                                    </button>
                                </div>
                            </div>

                            <div class="nuevo-registro-form">
                                <!-- PESTAÑA 1: DATOS DE LA FACTURA -->
                                <div id="${c}-tab-factura" class="tab-panel active" style="display:block;">
                                    <div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;">
                                        <h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128196; Datos de la Factura</h4>
                                        <div class="form-grid-2">
                                            <div class="form-group"><label>N° Factura *</label><input type="text" id="${c}-nueva-factura" required></div>
                                            <div class="form-group"><label>Fecha Factura *</label><input type="date" id="${c}-nueva-fecha-factura" required></div>
                                            <div class="form-group"><label>Nombre y Apellido *</label><input type="text" id="${c}-nueva-nombre" required></div>
                                            <div class="form-group"><label>Cedula</label><input type="text" id="${c}-nueva-cedula"></div>
                                            <div class="form-group"><label>Telefono</label><input type="text" id="${c}-nueva-telefono" placeholder="0412-1234567"></div>
                                            <div class="form-group"><label>Monto Factura (Bs) *</label><input type="number" id="${c}-nueva-monto" min="0" step="0.01" required></div>
                                            <div class="form-group"><label>Tasa BCV Factura *</label><input type="number" id="${c}-nueva-tasa-factura" min="0.0001" step="0.0001" required placeholder="Auto"></div>
                                            <div class="form-group"><label>Monto Facturado ($)</label><input type="number" id="${c}-nueva-monto-usd" readonly class="calculado"></div>
                                        </div>
                                        <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                                            <button type="button" onclick="window.Tiendas.get('${this.cfg.key}').siguienteTabNuevoRegistro('inicial')" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Siguiente &#8594;</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- PESTAÑA 2: DEPOSITO INICIAL -->
                                <div id="${c}-tab-inicial" class="tab-panel" style="display:none;">
                                    <div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;">
                                        <h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128176; Deposito Inicial</h4>
                                        <div class="form-grid-2">
                                            <div class="form-group"><label>Inicial (Bs) *</label><input type="number" id="${c}-nueva-inicial-bs" min="0" step="0.01" required><div class="form-error" id="${c}-error-inicial"></div></div>
                                            <div class="form-group"><label>Inicial ($)</label><input type="number" id="${c}-nueva-inicial-usd" readonly class="calculado"></div>
                                            <div class="form-group"><label>Referencia Inicial *</label><input type="text" id="${c}-nueva-ref-inicial" required></div>
                                            <div class="form-group"><label>Fecha Inicial *</label><input type="date" id="${c}-nueva-fecha-inicial" required><div class="form-error" id="${c}-error-fecha-inicial"></div></div>
                                            <div class="form-group"><label>Tasa BCV Inicial *</label><input type="number" id="${c}-nueva-tasa-inicial" min="0.0001" step="0.0001" required placeholder="Auto"></div>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;margin-top:16px;">
                                            <button type="button" onclick="window.Tiendas.get('${this.cfg.key}').cambiarTabNuevoRegistro('factura')" style="background:#e2e8f0;color:#4a5568;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#8592; Anterior</button>
                                            <button type="button" onclick="window.Tiendas.get('${this.cfg.key}').siguienteTabNuevoRegistro('cuotas')" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Siguiente &#8594;</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- PESTAÑA 3: PLAN DE CUOTAS -->
                                <div id="${c}-tab-cuotas" class="tab-panel" style="display:none;">
                                    <div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;">
                                        <h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128202; Plan de Cuotas</h4>
                                        <div class="form-grid-3">
                                            <div class="form-group"><label>Total de Cuotas *</label><select id="${c}-nueva-total-cuotas" required>
                                                <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                                <option value="4" selected>4</option><option value="5">5</option><option value="6">6</option>
                                                <option value="7">7</option><option value="8">8</option><option value="9">9</option>
                                                <option value="10">10</option><option value="11">11</option>
                                                <option value="12">12</option><option value="13">13</option><option value="14">14</option>
                                                <option value="15">15</option><option value="16">16</option><option value="17">17</option>
                                                <option value="18">18</option><option value="19">19</option><option value="20">20</option>
                                                <option value="21">21</option><option value="22">22</option><option value="23">23</option>
                                                <option value="24">24</option><option value="25">25</option><option value="26">26</option>
                                                <option value="27">27</option><option value="28">28</option><option value="29">29</option>
                                                <option value="30">30</option>
                                            </select></div>
                                            <div class="form-group"><label>Deuda ($)</label><input type="number" id="${c}-nueva-deuda-usd" readonly class="calculado"></div>
                                            <div class="form-group"><label>Monto Cuota ($)</label><input type="number" id="${c}-nueva-monto-cuota" readonly class="calculado"></div>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;margin-top:16px;">
                                            <button type="button" onclick="window.Tiendas.get('${this.cfg.key}').cambiarTabNuevoRegistro('inicial')" style="background:#e2e8f0;color:#4a5568;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#8592; Anterior</button>
                                            <div style="display:flex;gap:10px;">
                                                <button onclick="window.Tiendas.get('${this.cfg.key}').limpiarFormularioNuevaConciliacion()" style="background:#e2e8f0;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px;">Limpiar</button>
                                                <button onclick="window.Tiendas.get('${this.cfg.key}').guardarNuevaConciliacion()" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#128190; Guardar Registro</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // ====================================================
        // HTML - REPORTES (filtros, resumen, tabla, gráficos)
        // Habilita reportes para TODAS las tiendas, incluida
        // Maracay (antes el HTML existía pero sin funciones).
        // ====================================================
        renderReportes() {
            return `
                <div id="${this.id('busqueda')}" style="display: none;">
                    <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
                    <div id="${this.cfg.pfx}-reportes-container" style="width:100%;"></div>
                </div>
            `;
        }

        // ====================================================
        // NAVEGACIÓN INTERNA DEL MÓDULO
        // ====================================================
        showView(vista) {
            /* ========== FIX v6.7.3 ==========
               Asegurar que el contenedor principal de la tienda esté visible.
               En navegación interna el contenedor puede quedar con la clase
               'hidden' heredada de mostrarSeccion(), lo que anula cualquier
               display:block de los paneles internos. */
            const contenedorPrincipal = document.getElementById(this.cfg.contentId);
            if (contenedorPrincipal) {
                contenedorPrincipal.classList.remove('hidden');
                contenedorPrincipal.style.removeProperty('display');
            }
            /* ================================ */

            const menu = this.el(this.id('menu-principal'));
            const baseDatos = this.el(this.id('base-datos'));
            const conciliaciones = this.el(this.id('conciliaciones'));
            const busqueda = this.el(this.id('busqueda'));

            // v6.7.5-fix-nuclear: usar setProperty con !important para anular cualquier CSS externo
            const mostrar = (el, activo) => {
                if (!el) return;
                if (activo) {
                    el.style.setProperty('display', 'block', 'important');
                    el.removeAttribute('hidden');
                    el.classList.remove('hidden', 'oculto');
                    el.style.setProperty('visibility', 'visible', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                    el.style.setProperty('width', '100%', 'important');
                    el.style.setProperty('min-width', '100%', 'important');
                    el.style.setProperty('min-height', '100px', 'important');
                    el.style.setProperty('position', 'relative', 'important');
                    el.style.setProperty('box-sizing', 'border-box', 'important');
                    el.style.setProperty('overflow', 'visible', 'important');
                    el.style.setProperty('transform', 'none', 'important');
                    el.style.setProperty('clip-path', 'none', 'important');
                } else {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('width', '0', 'important');
                    el.style.setProperty('min-width', '0', 'important');
                    el.style.setProperty('min-height', '0', 'important');
                    el.style.setProperty('position', 'absolute', 'important');
                    el.style.setProperty('overflow', 'hidden', 'important');
                }
            };
            mostrar(menu, vista === 'menu');
            mostrar(baseDatos, vista === 'baseDatos');
            mostrar(conciliaciones, vista === 'conciliaciones');
            mostrar(busqueda, vista === 'reportes');

            // v6.5.1 — al abrir una vista, llevar suavemente al inicio de su contenido
            // (evita que el usuario tenga que hacer scroll manual). El CSS
            // scroll-margin-top compensa el header fijo del panel.
            const destino = vista === 'menu' ? menu
                : (vista === 'baseDatos' ? baseDatos
                : (vista === 'conciliaciones' ? conciliaciones : busqueda));
            if (destino && destino.scrollIntoView) {
                setTimeout(() => {
                    try { destino.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
                }, 80);
            }

            if (vista === 'menu') {
                // v6.5 — cargar/refrescar el resumen operativo del menú
                this.initMenuDashboard();
            } else if (vista === 'baseDatos') {
                // Siempre recargar datos al entrar (comportamiento original)
                this.initDatos();
            } else if (vista === 'conciliaciones') {
                this.resetConciliaciones();
            } else if (vista === 'reportes') {
                this.initReportesDinamicos();
            }
        }

        // ====================================================
        // BASE DE DATOS - CARGA Y PROCESAMIENTO
        // ====================================================
        async initDatos() {
            if (this._cargando) return;
            this._cargando = true;
            await this.loadData();
            const filtro = this._filtroPendiente || 'abiertas';
            this._filtroPendiente = null;
            this.currentFilter = filtro;
            this.applyQuickFilter(filtro);
            this.initialized = true;
            this._cargando = false;
        }

        async loadData() {
            showLoading(true);
            try {
                const response = await this._apiFetch(this.cfg.api);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                this.allData = data.map(item => this.processItemData(item));
                this.filteredData = [...this.allData];
                console.log(`✅ [${this.cfg.nombre}] ${this.allData.length} registros cargados`);
                this.updateFilterCounts();
            } catch (error) {
                // REFACTOR: ya NO se muestran datos de ejemplo falsos.
                // Se muestra el error real para no operar sobre datos inventados.
                console.error(`❌ [${this.cfg.nombre}] Error cargando datos:`, error);
                this.allData = [];
                this.filteredData = [];
                mostrarModalCorporativo(
                    'Error de Conexión',
                    `No se pudieron cargar los datos de Tienda ${this.cfg.nombre}.\n\nVerifique que el servidor esté disponible e intente nuevamente.`,
                    'error'
                );
            }
            showLoading(false);
        }

        processItemData(item) {
            let montoDepositado = 0;
            let cuotasPagadas = 0;

            // v6.8: Sumar pagos desde la tabla de pagos (pagos_caracas, pagos_maracay, pagos_maracaibo)
            const pagosExtra = item.pagos_extra || [];
            const totalCuotasProc = parseInt(item.cuotas) || TOTAL_CUOTAS;
            if (Array.isArray(pagosExtra) && pagosExtra.length > 0) {
                pagosExtra.forEach(p => {
                    const nro = parseInt(p.nro_cuota) || 0;
                    if (nro < 1) return; // Solo ignorar nro_cuota inválido
                    const montoBs = parseNumberES(p.monto_bs);
                    if (montoBs > 0) {
                        montoDepositado += montoBs;
                        cuotasPagadas++;
                    }
                });
            }

            // Fallback: columnas planas (legacy) — solo si no hay pagos_extra
            if (cuotasPagadas === 0) {
                for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                    const cuota = parseNumberES(item[`cuota_${i}`]);
                    if (cuota > 0) {
                        montoDepositado += cuota;
                        cuotasPagadas++;
                    }
                }
            }

            // v6.7.3-fix: Incluir inicial_bs en el total depositado para registros nuevos (v6.7.2+)
            const inicialBs = parseNumberES(item.inicial_bs);
            if (inicialBs > 0) {
                montoDepositado += inicialBs;
            }

            const montoFactura = parseNumberES(item.monto_factura);
            let deuda = montoFactura - montoDepositado;
            if (Math.abs(montoFactura - montoDepositado) < 0.01) {
                deuda = 0;
            }

            // Normalización (endurecimiento del refactor): monto_factura
            // queda como NÚMERO siempre. PostgreSQL puede devolverlo como
            // string y las sumas de los summary-cards/filtros trabajan
            // directo sobre item.monto_factura.
            item.monto_factura = montoFactura;
            item.monto_depositados = montoDepositado;
            item.deuda = deuda;
            item.cuotas_pagadas = cuotasPagadas;
            item.total_cuotas = TOTAL_CUOTAS;

            return item;
        }

        // ====================================================
        // BASE DE DATOS - FILTROS
        // ====================================================
        applyQuickFilter(filter) {
            this.currentFilter = filter;

            const root = this.el(this.cfg.contentId);
            if (root) {
                root.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                const activeBtn = root.querySelector(`[data-filter="${filter}"]`);
                if (activeBtn) activeBtn.classList.add('active');
            }

            this.applyFilters();
        }

        applyFilters() {
            const sfx = this.cfg.sfx;
            const searchGeneral = this.el('search-general' + sfx)?.value.toLowerCase().trim() || '';
            const searchFactura = this.el('search-factura' + sfx)?.value.trim() || '';
            const searchCedula = this.el('search-cedula' + sfx)?.value.trim() || '';
            const fechaDesde = this.el('fecha-desde' + sfx)?.value || '';
            const fechaHasta = this.el('fecha-hasta' + sfx)?.value || '';
            const montoMin = parseFloat(this.el('monto-min' + sfx)?.value) || 0;
            const montoMax = parseFloat(this.el('monto-max' + sfx)?.value) || Infinity;

            this.filteredData = this.allData.filter(item => {
                if (this.currentFilter !== 'all') {
                    const deuda = item.deuda || 0;
                    if (this.currentFilter === 'deudores' && !(deuda > 0)) return false;
                    if (this.currentFilter === 'incompletos' && !(item.cuotas_pagadas > 0 && item.cuotas_pagadas < item.total_cuotas)) return false;
                    if (this.currentFilter === 'aldia' && !(deuda <= 0)) return false;
                    if (this.currentFilter === 'abiertas' && !(deuda > 0)) return false;
                    if (this.currentFilter === 'canceladas' && !(deuda <= 0)) return false;
                    if (this.currentFilter === 'morosos') {
                        if (deuda <= 0) return false;
                        let ultimaCuota = null;
                        for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                            const monto = tmN(item['cuota_' + i]);
                            if (monto > 0) {
                                const f = tmParseFecha(item['fecha_cuota_' + i]);
                                if (f) {
                                    const key = f.anio * 12 + f.mes;
                                    if (!ultimaCuota || key > ultimaCuota.key) ultimaCuota = { key, anio: f.anio, mes: f.mes };
                                }
                            }
                        }
                        const ref = ultimaCuota || tmParseFecha(item.fecha_factura);
                        const hoy = new Date();
                        const mesAct = hoy.getMonth() + 1, anioAct = hoy.getFullYear();
                        const mesesSinPagar = ref ? Math.max(0, (anioAct - ref.anio) * 12 + (mesAct - ref.mes)) : 999;
                        if (mesesSinPagar < 2) return false;
                    }
                    if (this.currentFilter === 'sin-cuota-mes') {
                        if (deuda <= 0) return false;
                        const hoy = new Date();
                        const mesAct = hoy.getMonth() + 1, anioAct = hoy.getFullYear();
                        let pagoEsteMes = false;
                        for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                            const monto = tmN(item['cuota_' + i]);
                            if (monto > 0) {
                                const f = tmParseFecha(item['fecha_cuota_' + i]);
                                if (f && f.anio === anioAct && f.mes === mesAct) { pagoEsteMes = true; break; }
                            }
                        }
                        if (pagoEsteMes) return false;
                    }
                }

                if (searchGeneral && !item.nombre_apellido?.toLowerCase().includes(searchGeneral)) return false;
                if (searchFactura && !String(item.nro_factura || '').includes(searchFactura)) return false;
                if (searchCedula && !String(item.cedula || '').includes(searchCedula)) return false;
                if (fechaDesde && item.fecha_factura < fechaDesde) return false;
                if (fechaHasta && item.fecha_factura > fechaHasta) return false;
                if (item.monto_factura < montoMin) return false;
                if (item.monto_factura > montoMax) return false;

                return true;
            });

            // Ordenar según filtro activo
            if (this.currentFilter === 'morosos') {
                this.filteredData.sort((a, b) => {
                    const calcMeses = (item) => {
                        let ultima = null;
                        for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                            const monto = tmN(item['cuota_' + i]);
                            if (monto > 0) {
                                const f = tmParseFecha(item['fecha_cuota_' + i]);
                                if (f) {
                                    const key = f.anio * 12 + f.mes;
                                    if (!ultima || key > ultima.key) ultima = { key, anio: f.anio, mes: f.mes };
                                }
                            }
                        }
                        const ref = ultima || tmParseFecha(item.fecha_factura);
                        const hoy = new Date();
                        const mesAct = hoy.getMonth() + 1, anioAct = hoy.getFullYear();
                        return ref ? Math.max(0, (anioAct - ref.anio) * 12 + (mesAct - ref.mes)) : 999;
                    };
                    return calcMeses(b) - calcMeses(a) || (b.deuda || 0) - (a.deuda || 0);
                });
            }

            this.currentPage = 1;
            this.updateSummary();
            this.renderTable();
            this.updateFilterCounts();
        }

        clearFilters() {
            const sfx = this.cfg.sfx;
            ['search-general', 'search-factura', 'search-cedula', 'fecha-desde', 'fecha-hasta', 'monto-min', 'monto-max']
                .forEach(base => {
                    const el = this.el(base + sfx);
                    if (el) el.value = '';
                });

            this.currentFilter = 'abiertas';
            const root = this.el(this.cfg.contentId);
            if (root) {
                root.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                const allBtn = root.querySelector('[data-filter="abiertas"]');
                if (allBtn) allBtn.classList.add('active');
            }

            this.applyFilters();
        }

        debouncedFilter() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.applyFilters(), 300);
        }

        getEstado(item) {
            const deuda = item.deuda || 0;
            const cuotasPagadas = item.cuotas_pagadas || 0;
            const totalCuotas = item.total_cuotas || TOTAL_CUOTAS;
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

        updateSummary() {
            const sfx = this.cfg.sfx;
            const totalClientes = this.filteredData.length;
            const totalFacturado = this.filteredData.reduce((sum, item) => sum + (item.monto_factura || 0), 0);
            const totalDeuda = this.filteredData.reduce((sum, item) => sum + (item.deuda || 0), 0);
            const totalRecaudado = this.filteredData.reduce((sum, item) => sum + (item.monto_depositados || 0), 0);

            const setText = (domId, value) => {
                const el = this.el(domId);
                if (el) el.textContent = value;
            };

            setText('total-clientes' + sfx, totalClientes);
            setText('total-facturado' + sfx, formatCurrency(totalFacturado));
            setText('total-deuda' + sfx, formatCurrency(totalDeuda));
            setText('total-recaudado' + sfx, formatCurrency(totalRecaudado));
        }

        updateFilterCounts() {
            const sfx = this.cfg.sfx;
            const counts = {
                all: this.allData.length,
                deudores: this.allData.filter(item => (item.deuda || 0) > 0).length,
                incompletos: this.allData.filter(item => {
                    const cp = item.cuotas_pagadas || 0;
                    return cp > 0 && cp < (item.total_cuotas || TOTAL_CUOTAS);
                }).length,
                aldia: this.allData.filter(item => (item.deuda || 0) <= 0).length,
                abiertas: this.allData.filter(item => (item.deuda || 0) > 0).length,
                canceladas: this.allData.filter(item => (item.deuda || 0) <= 0).length
            };

            const setCount = (domId, value) => {
                const el = this.el(domId);
                if (el) el.textContent = value;
            };

            setCount('count-all' + sfx, counts.all);
            setCount('count-deudores' + sfx, counts.deudores);
            setCount('count-incompletos' + sfx, counts.incompletos);
            setCount('count-aldia' + sfx, counts.aldia);
            setCount('count-abiertas' + sfx, counts.abiertas);
            setCount('count-canceladas' + sfx, counts.canceladas);
        }

        // ====================================================
        // BASE DE DATOS - TABLA Y PAGINACIÓN
        // ====================================================
        renderTable() {
            const tbody = this.el('tabla-body' + this.cfg.sfx);
            if (!tbody) return;

            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            const pageData = this.filteredData.slice(start, end);

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
                tbody.innerHTML = pageData.map((item, index) => this.createRowHTML(item, start + index + 1)).join('');
            }

            this.updatePagination();
        }

        createRowHTML(item, rowIndex) {
            const estado = this.getEstado(item);
            const cuotasPagadas = item.cuotas_pagadas || 0;
            const totalCuotas = item.total_cuotas || TOTAL_CUOTAS;
            const porcentaje = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;

            const estadoClass = {
                'aldia': 'estado-aldia', 'deudor': 'estado-deudor', 'incompleto': 'estado-incompleto',
                'abierta': 'estado-abierta', 'cancelada': 'estado-cancelada'
            }[estado];

            const estadoText = {
                'aldia': 'Al día', 'deudor': 'Deudor', 'incompleto': 'Incompleto',
                'abierta': 'Abierta', 'cancelada': 'Cancelada'
            }[estado];

            const estadoIcon = {
                'aldia': 'fa-check-circle', 'deudor': 'fa-exclamation-circle', 'incompleto': 'fa-clock',
                'abierta': 'fa-folder-open', 'cancelada': 'fa-check-double'
            }[estado];

            return `
                <tr class="fade-in">
                    <td>${rowIndex}</td>
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
                            <button class="btn-action btn-view" data-action="ver-detalle" data-id="${item.id}" title="Ver y editar">
                                <i class="fas fa-eye"></i>
                            </button>
                           ${isAdminUser() ? `
                            <button class="btn-action btn-delete" data-action="confirmar-eliminar" data-id="${item.id}" title="Eliminar registro">
                               <i class="fas fa-trash-alt"></i>
                                 </button>
                                      ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }

        getTotalPages() {
            return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
        }

        updatePagination() {
            const sfx = this.cfg.sfx;
            const totalPages = this.getTotalPages();

            const setText = (domId, value) => { const el = this.el(domId); if (el) el.textContent = value; };
            const setDisabled = (domId, disabled) => { const el = this.el(domId); if (el) el.disabled = disabled; };

            setText('pagina-info' + sfx, `Página ${this.currentPage} de ${totalPages}`);
            setDisabled('btn-primero' + sfx, this.currentPage === 1);
            setDisabled('btn-anterior' + sfx, this.currentPage === 1);
            setDisabled('btn-siguiente' + sfx, this.currentPage >= totalPages);
            setDisabled('btn-ultimo' + sfx, this.currentPage >= totalPages);
        }

        goToPage(page) {
            const totalPages = this.getTotalPages();
            if (page === 'first') page = 1;
            else if (page === 'prev') page = this.currentPage - 1;
            else if (page === 'next') page = this.currentPage + 1;
            else if (page === 'last') page = totalPages;

            if (page < 1 || page > totalPages) return;

            this.currentPage = page;
            this.renderTable();

            // REFACTOR: scroll al contenedor de ESTA tienda (Maracay antes
            // apuntaba por error al contenedor de Caracas)
            const root = this.el(this.cfg.contentId);
            const tableContainer = root ? root.querySelector('.table-container') : null;
            if (tableContainer) tableContainer.scrollIntoView({ behavior: 'smooth' });
        }

        changeItemsPerPage() {
            const select = this.el('registros-por-pagina' + this.cfg.sfx);
            if (select) {
                this.itemsPerPage = parseInt(select.value);
                this.currentPage = 1;
                this.renderTable();
            }
        }

        // ====================================================
        // BASE DE DATOS - EXPORTACIÓN
        // ====================================================
        exportToExcel() {
            const headers = ['N°', 'Factura', 'Nombre', 'Monto Factura (Bs)', 'Fecha Factura', 'Cédula', 'Cuotas Pagadas', 'Monto Depositado (Bs)', 'Deuda (Bs)', 'Estado'];
            const rows = this.filteredData.map(item => [
                item.numero, item.nro_factura, item.nombre_apellido,
                item.monto_factura, item.fecha_factura, item.cedula,
                item.cuotas_pagadas, item.monto_depositados, item.deuda,
                this.getEstado(item)
            ]);
            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell ?? ''}"`).join(',')).join('\n');
            downloadFile(csv, `tienda_${this.cfg.key}.csv`, 'text/csv');
        }

               // ====================================================
        // BASE DE DATOS - EXPORTACIÓN A PDF (Estilo Reportes)
        // ====================================================
        exportToPDF() {
            // Usamos filteredData porque es lo que el usuario está viendo en la tabla (filtros aplicados)
            const datosParaExportar = this.filteredData;

            if (datosParaExportar.length === 0) {
                notificar('No hay datos para exportar', 'error');
                return;
            }

            if (!window.jspdf || !window.jspdf.jsPDF) {
                notificar('Librería PDF no disponible', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);
            const keyTienda = this.cfg.key;
            const nombreTienda = this.cfg.nombre;

            const generarPDF = async () => {
                // Verificar que autoTable esté disponible
                if (typeof doc.autoTable !== 'function') {
                    notificar('Error: El plugin autoTable de jsPDF no está cargado.', 'error');
                    return;
                }

                // --- ENCABEZADO ---
                let currentY = 12;

                doc.setFontSize(20);
                doc.setTextColor(26, 54, 93);
                doc.setFont('helvetica', 'bold');
                const titulo = 'Gestion de Creditos Inversora IPSFA C.A';
                const tituloWidth = doc.getTextWidth(titulo);
                doc.text(titulo, (pageWidth - tituloWidth) / 2, currentY + 16);

                doc.setFontSize(11);
                doc.setTextColor(100, 100, 100);
                doc.setFont('helvetica', 'normal');
                const subtitulo = 'Listado de Clientes - Tienda ' + nombreTienda + ' (Filtro: ' + this.currentFilter + ')';
                const subtituloWidth = doc.getTextWidth(subtitulo);
                doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, currentY + 24);

                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                const fechaTexto = 'Fecha: ' + new Date().toLocaleDateString('es-VE') + '  |  Hora: ' + new Date().toLocaleTimeString('es-VE') + '  |  Total Registros: ' + datosParaExportar.length;
                const fechaWidth = doc.getTextWidth(fechaTexto);
                doc.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY + 32);

                currentY += 48;

                doc.setDrawColor(26, 54, 93);
                doc.setLineWidth(0.5);
                doc.line(margin, currentY, pageWidth - margin, currentY);

                currentY += 8;

                // --- TABLA DE DATOS ---
                const headers = [['N°', 'Factura', 'Nombres y Apellidos', 'Cédula']];
                
                const rows = datosParaExportar.map((row, i) => {
                    return [
                        i + 1,
                        row.nro_factura || '-',
                        row.nombre_apellido || '-',
                        row.cedula || '-'
                    ];
                });

                // Ajuste de columnas
                const colNro = 15, colFactura = 30, colCliente = 80, colCedula = 30;
                const totalColWidth = colNro + colFactura + colCliente + colCedula;
                const scaleFactor = contentWidth / totalColWidth;

                doc.autoTable({
                    head: headers,
                    body: rows,
                    startY: currentY,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [26, 54, 93],
                        textColor: [255, 255, 255],
                        fontSize: 11,
                        fontStyle: 'bold',
                        halign: 'center',
                        valign: 'middle'
                    },
                    bodyStyles: {
                        fontSize: 10,
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
                        0: { cellWidth: colNro * scaleFactor, halign: 'center' },
                        1: { cellWidth: colFactura * scaleFactor, halign: 'center' },
                        2: { cellWidth: colCliente * scaleFactor, halign: 'left' },
                        3: { cellWidth: colCedula * scaleFactor, halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text('Inversora IPSFA - Sistema de Creditos', margin, pageHeight - 10);
                        doc.text('Pagina ' + data.pageNumber, pageWidth - margin - 20, pageHeight - 10);
                    }
                });

                // --- SIN TOTALES AL FINAL ---
                // Simplemente guardamos el archivo terminada la tabla
                doc.save('listado_' + keyTienda + '_' + new Date().toISOString().split('T')[0] + '.pdf');
                notificar('PDF exportado correctamente', 'success');
            };

            generarPDF().catch(err => {
                console.error('Error generando PDF:', err);
                notificar('Error al generar PDF: ' + err.message, 'error');
            });
        }

        printTable() {
            window.print();
        }

        // ====================================================
        // MODAL DE EDICIÓN / DETALLE DE CLIENTE
        // (se crea dinámicamente y se destruye al cerrar,
        //  igual que la versión original)
        // ====================================================
        get modalId() { return 'modal-editar-cliente' + this.cfg.sfx; }

        // v6.7.5: Calcula tasa BCV y monto facturado USD si están vacíos
        async _calcularCamposFaltantes(cliente) {
            const montoFactura = parseFloat(cliente.monto_factura) || 0;
            let tasa = parseFloat(cliente.tasa_bcv_factura) || 0;
            let montoFacturadoUSD = parseFloat(cliente.monto_facturado_divisa) || 0;
            let calculado = false;

            if (montoFactura > 0 && (montoFacturadoUSD <= 0 || tasa <= 0)) {
                // Si falta tasa, consultar API BCV por fecha de factura
                if (tasa <= 0 && cliente.fecha_factura) {
                    try {
                        const res = await this._apiFetch('/api/bcv/fecha/' + cliente.fecha_factura);
                        if (res.ok) {
                            const tasaData = await res.json();
                            if (tasaData.tasa) {
                                if (typeof tasaData.tasa.usd === 'number') {
                                    tasa = tasaData.tasa.usd;
                                } else if (typeof tasaData.tasa === 'number') {
                                    tasa = tasaData.tasa;
                                } else if (tasaData.tasa.current && typeof tasaData.tasa.current.usd === 'number') {
                                    tasa = tasaData.tasa.current.usd;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Error consultando tasa BCV para fecha', cliente.fecha_factura, e.message);
                    }
                }

                // Calcular monto facturado en USD si tenemos tasa
                if (tasa > 0) {
                    cliente.tasa_bcv_factura = tasa;
                    cliente.monto_facturado_divisa = redondearDecimales(montoFactura / tasa);
                    calculado = true;
                }
            }
            return calculado;
        }

        verDetalle(id) {
            this.__mostrarSpinner('Cargando cliente...');
            this._apiFetch(`${this.cfg.api}/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                .then(r => r.json())
                .then(async data => {
                    // v6.7.5: calcular campos faltantes antes de mostrar
                    const calculado = await this._calcularCamposFaltantes(data);
                    this.__ocultarSpinner();
                    this.currentEditId = id;
                    this.currentEditItem = data;
                    const modal = this.createModalElement();
                    modal.dataset.clienteId = id;
                    this.fillFormData(data, calculado);
                })
                .catch(err => {
                    this.__ocultarSpinner();
                    console.error('Error abriendo modal:', err);
                    alert('Error cargando datos del cliente: ' + err.message);
                });
        }

        createModalElement() {
            const modalId = this.cfg.key + '-modal-v672';
            const overlayId = this.cfg.key + '-modal-overlay-v672';

            let existing = document.getElementById(modalId);
            if (existing) existing.remove();
            let existingOverlay = document.getElementById(overlayId);
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.className = 'modal-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;';
            overlay.onclick = () => this.closeModal();
            document.body.appendChild(overlay);

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-container';
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;width:96%;max-width:1100px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);z-index:1001;overflow-y:auto;';

            modal.innerHTML =
                '<div class="modal-header">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<h3>Editar Cliente <span class="tienda-badge" style="background:' + this.color + ';color:#fff;">' + this.nombre.toUpperCase() + '</span></h3>' +
                    '</div>' +
                    '<button class="modal-close-btn" onclick="window.Tiendas.get(\'' + this.cfg.key + '\').closeModal()">×</button>' +
                '</div>' +
                '<div class="modal-body" id="' + this.cfg.key + '-modal-body-v672"></div>' +
                '<div class="modal-footer">' +
                    '<span class="nota">Los cambios se aplican al presionar Guardar Cambios</span>' +
                    '<div style="display:flex;gap:8px;">' +
                        '<button class="btn-cerrar-footer" onclick="window.Tiendas.get(\'' + this.cfg.key + '\').closeModal()">Cerrar</button>' +
                        '<button class="btn-guardar" id="' + this.cfg.key + '-btn-guardar-modal" onclick="window.Tiendas.get(\'' + this.cfg.key + '\').guardarCambios()" disabled style="opacity:0.5;cursor:not-allowed;">Guardar Cambios</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(modal);
            return modal;
        }

        fillFormData(item, camposCalculados) {
            const self = this;
            self.currentEditItem = item;
            const esAdmin = isAdminUser();
            const esNuevo = self.esRegistroNuevoV672(item);
            console.log(`[Tiendas/${self.cfg.key}] fillFormData — esAdmin: ${esAdmin}, esNuevo: ${esNuevo}, rol: ${getUserRole()}`);
            self._modalDirty = false;

            const modal = document.getElementById(self.cfg.key + '-modal-v672') || self.createModalElement();
            const body = document.getElementById(self.cfg.key + '-modal-body-v672');
            if (!body) return;

            const headerTitle = modal.querySelector('.modal-header h3');
            if (headerTitle) {
                headerTitle.innerHTML = 'Editar Cliente <span class="tienda-badge" style="background:' + self.color + ';color:#fff;">' + self.nombre.toUpperCase() + '</span>' +
                    '<span style="font-size:11px;font-weight:400;opacity:0.9;margin-left:8px;">' + item.nombre_apellido + ' • Factura ' + item.nro_factura + '</span>';
            }

            const panelResumen = self.renderizarPanelResumen(item, esNuevo);
            const panelCuotas = self.renderizarPanelCuotas(item, esNuevo, esAdmin);

            body.innerHTML = panelResumen + panelCuotas +
                '<input type="hidden" name="monto_factura" value="' + (item.monto_factura || '') + '">' +
                '<input type="hidden" name="monto_facturado_usd" value="' + (item.monto_facturado_divisa || '') + '">' +
                '<input type="hidden" name="monto_cuota_usd" value="' + (item.monto_cuota_usd || '') + '">' +
                '<input type="hidden" name="inicial_bs" value="' + (item.inicial_bs || '') + '">' +
                '<input type="hidden" name="inicial_usd" value="' + (item.inicial_usd || '') + '">';

            // v6.8: Inicializar cuotas, monto_cuota_usd y pagos_extra
            if (!self.currentEditItem.cuotas) {
                self.currentEditItem.cuotas = TOTAL_CUOTAS;
            }
            // v6.8: Asegurar que pagos_extra existe
            if (!self.currentEditItem.pagos_extra) {
                self.currentEditItem.pagos_extra = [];
            }
            const _mcuRaw = self.currentEditItem.monto_cuota_usd;
            const _mcuNum = parseFloat(_mcuRaw);
            const _mcuEsCero = _mcuRaw === null || _mcuRaw === undefined || _mcuRaw === '' || _mcuRaw === '0' || _mcuRaw === '0.0' || _mcuRaw === '0.00' || (!isNaN(_mcuNum) && _mcuNum === 0);
            if ((_mcuEsCero || isNaN(_mcuNum)) && self.currentEditItem.monto_factura) {
                const tasa = parseFloat(self.currentEditItem.tasa_bcv_factura) || 1;
                const montoUSD = parseFloat(self.currentEditItem.monto_factura) / tasa;
                const inicialUSD = parseFloat(self.currentEditItem.inicial_usd) || 0;
                const deudaUSD = redondearDecimales(montoUSD - inicialUSD);
                if (deudaUSD > 0 && self.currentEditItem.cuotas > 0) {
                    self.currentEditItem.monto_cuota_usd = redondearDecimales(deudaUSD / self.currentEditItem.cuotas);
                }
            }

            const btnGuardar = document.getElementById(self.cfg.key + '-btn-guardar-modal');
            if (btnGuardar) {
                btnGuardar.style.display = 'inline-block'; // v6.7.4-fix: visible para cualquier rol
                btnGuardar.disabled = true;
                btnGuardar.style.opacity = '0.5';
                btnGuardar.style.cursor = 'not-allowed';
            }

            if (esAdmin) {
                // v6.9: Las cuotas se muestran solo lectura desde pagos_extra
                // No hay inputs editables de cuotas planas (columnas eliminadas de BD)
                const checkboxes = body.querySelectorAll('input[name^="eliminar-cuota-"]');
                checkboxes.forEach(chk => {
                    const nuevo = chk.cloneNode(true);
                    chk.parentNode.replaceChild(nuevo, chk);
                    nuevo.addEventListener('change', function() { self.__actualizarBarraEliminar(); });
                });

                const chkAll = body.querySelector('input[id^="chk-all-cuotas-"]');
                if (chkAll) {
                    const nuevo = chkAll.cloneNode(true);
                    chkAll.parentNode.replaceChild(nuevo, chkAll);
                    nuevo.addEventListener('change', function(e) { self.__toggleAllCuotas(e.target); });
                }
            }

            modal.style.display = 'flex';
            const overlay = document.getElementById(self.cfg.key + '-modal-overlay-v672');
            if (overlay) overlay.style.display = 'block';

            // v6.7.5: si se calcularon campos faltantes, marcar dirty para permitir guardar
            if (camposCalculados) {
                self.__marcarDirty();
            }
        }

        closeModal() {
            const modal = document.getElementById(this.cfg.key + '-modal-v672');
            const overlay = document.getElementById(this.cfg.key + '-modal-overlay-v672');
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            const oldModal = document.getElementById(this.cfg.key + '-modal');
            const oldOverlay = document.getElementById(this.cfg.key + '-modal-overlay');
            if (oldModal) oldModal.style.display = 'none';
            if (oldOverlay) oldOverlay.style.display = 'none';
        }

        async guardarCambios() {
            if (!this.currentEditId || !this.currentEditItem) return;
            if (!this._modalDirty) {
                mostrarModalCorporativo('Sin cambios', 'No ha realizado ninguna modificacion en los datos del cliente.', 'info');
                return;
            }
            const btnGuardar = document.getElementById(this.cfg.key + '-btn-guardar-modal');
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.textContent = 'Guardando...';
            }

            const modal = document.getElementById(this.cfg.key + '-modal-v672');
            if (!modal) {
                mostrarModalCorporativo('Error', 'No se encontró el modal de edición', 'error');
                return;
            }

            const item = this.currentEditItem;

            // v6.10-fix: Recalcular totales en frontend para enviar valores reales al backend
            // (el backend puede calcular diferente si solo usa columnas planas)
            const itemProcesado = this.processItemData(JSON.parse(JSON.stringify(item)));

            const data = {
                id: item.id,
                numero: item.numero,
                nro_factura: item.nro_factura,
                nombre_apellido: item.nombre_apellido,
                cedula: item.cedula,
                telefono: item.telefono || '',
                numero_cuenta: item.numero_cuenta || '',
                banco: item.banco || '',
                fecha_factura: item.fecha_factura || null,
                monto_factura: typeof item.monto_factura === 'number'
                    ? item.monto_factura
                    : parseNumberES(item.monto_factura),
                inicial_bs: item.inicial_bs,
                inicial_usd: item.inicial_usd,
                ref_inicial: item.ref_inicial,
                fecha_inicial: item.fecha_inicial,
                tasa_inicial: item.tasa_inicial,
                tasa_bcv_factura: item.tasa_bcv_factura,
                monto_facturado_divisa: item.monto_facturado_divisa,
                cuotas: item.cuotas || TOTAL_CUOTAS,
                monto_cuota_usd: item.monto_cuota_usd || 0,
                // v6.10-fix: Enviar totales calculados para que el backend guarde los valores reales
                deuda: itemProcesado.deuda,
                monto_depositados: itemProcesado.monto_depositados
            };

            // v6.10-fix: Enviar TODAS las cuotas con monto > 0 (no solo > 11)
            const pagosExtra = [];
            if (item.pagos_extra && item.pagos_extra.length > 0) {
                item.pagos_extra.forEach(p => {
                    if (parseInt(p.nro_cuota) >= 1 && parseFloat(p.monto_bs) > 0) {
                        pagosExtra.push({
                            nro_cuota: parseInt(p.nro_cuota),
                            monto_bs: parseFloat(p.monto_bs),
                            referencia: p.referencia || '',
                            fecha: p.fecha || '',
                            tasa_bcv: parseFloat(p.tasa_bcv) || 0,
                            monto_usd: parseFloat(p.monto_usd) || 0
                        });
                    }
                });
            }
            if (pagosExtra.length > 0) {
                data.pagos_extra = pagosExtra;
            }

            // v6.7.6-fix: Recalcular monto_cuota_usd si aún es 0 antes de enviar
            const _mcuGuardar = parseFloat(data.monto_cuota_usd);
            if ((!_mcuGuardar || _mcuGuardar === 0) && data.monto_facturado_divisa && data.cuotas > 0) {
                const deudaUSDGuardar = redondearDecimales(parseFloat(data.monto_facturado_divisa) - parseFloat(data.inicial_usd || 0));
                if (deudaUSDGuardar > 0) {
                    data.monto_cuota_usd = redondearDecimales(deudaUSDGuardar / data.cuotas);
                }
            }

            // v6.9: No se envían columnas planas de cuotas (eliminadas de BD)
            // Las cuotas se muestran solo lectura desde pagos_extra
            // El backend recalcula totales desde la tabla de pagos

            try {
                showLoading(true);
                const response = await this._apiFetch(`${this.cfg.api}/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                await response.json();

                const index = this.allData.findIndex(d => d.id === this.currentEditId);
                if (index !== -1) {
                    this.allData[index] = this.processItemData({ ...this.allData[index], ...data });
                }

                this.applyFilters();
                this.updateSummary();
                this.updateFilterCounts();
                this.closeModal();

                mostrarModalCorporativo('Éxito', 'Cambios guardados exitosamente', 'exito');

            } catch (error) {
                console.error('Error al guardar:', error);
                mostrarModalCorporativo('Error', 'Error al guardar: ' + error.message, 'error');
            } finally {
                showLoading(false);
                if (btnGuardar) {
                    btnGuardar.disabled = false;
                    btnGuardar.textContent = 'Guardar Cambios';
                }
            }
        }

        // ====================================================
        // ELIMINAR CLIENTE
        // ====================================================
        confirmarEliminarCliente(id) {
            const item = this.allData.find(d => d.id === id);
            if (!item) return;

            mostrarModalCorporativo(
                '¿Eliminar Registro?',
                `¿Está seguro de que desea eliminar el registro?\n\nFactura N°: ${item.nro_factura || 'N/A'}\nCliente: ${item.nombre_apellido || 'N/A'}\n\n⚠️ Esta acción no se puede deshacer.`,
                'warning',
                [
                    { texto: 'Cancelar', estilo: BTN.neutro },
                    { texto: 'Sí, Eliminar', estilo: BTN.peligro, accion: () => this.eliminarCliente(id) }
                ]
            );
        }

        async eliminarCliente(id) {
            showLoading(true);

            try {
                const response = await this._apiFetch(`${this.cfg.api}/${id}`, {
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
                            estilo: BTN.aceptar,
                            accion: async () => {
                                await this.loadData();
                                this.updateSummary();
                                this.renderTable();
                                this.updateFilterCounts();
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

        // ====================================================
        // ELIMINAR CUOTAS (solo admin)
        // ====================================================
        confirmarEliminarCuotas() {
            const k = this.cfg.key;
            const modal = document.getElementById(this.cfg.key + '-modal-v672');
            if (!modal || !this.currentEditItem) return;

            const checkboxes = modal.querySelectorAll(`input[name="eliminar-cuota-${k}"]:checked`);
            this.cuotasAEliminar = Array.from(checkboxes).map(cb => parseInt(cb.value));

            if (this.cuotasAEliminar.length === 0) {
                mostrarModalCorporativo(
                    'Selección Vacía',
                    'No ha seleccionado ninguna cuota para eliminar.\n\nPor favor, marque al menos una cuota del checklist.',
                    'warning',
                    [{ texto: 'Entendido', estilo: BTN.warning }]
                );
                return;
            }

            // Copia local de datos (por si el modal de edición se cierra)
            const datosConfirmacion = {
                id: this.currentEditId,
                nro_factura: this.currentEditItem ? this.currentEditItem.nro_factura : 'N/A',
                nombre_apellido: this.currentEditItem ? this.currentEditItem.nombre_apellido : 'N/A',
                monto_factura: this.currentEditItem ? parseNumberES(this.currentEditItem.monto_factura) : 0,
                cuotas: {},
                cuotasNoSeleccionadas: {}
            };

            this.cuotasAEliminar.forEach(num => {
                if (this.currentEditItem) {
                    datosConfirmacion.cuotas[num] = {
                        monto: this.currentEditItem[`cuota_${num}`] || 0,
                        ref: this.currentEditItem[`ref_cuota_${num}`] || '-'
                    };
                }
            });

            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                if (!this.cuotasAEliminar.includes(i) && this.currentEditItem) {
                    datosConfirmacion.cuotasNoSeleccionadas[i] = {
                        cuota: this.currentEditItem[`cuota_${i}`],
                        ref: this.currentEditItem[`ref_cuota_${i}`],
                        fecha: this.currentEditItem[`fecha_cuota_${i}`],
                        tasa: this.currentEditItem[`tasa_cuota_${i}`],
                        dolar: this.currentEditItem[`dolar_depositado_cuota_${i}`]
                    };
                }
            }

            let detalleCuotas = '';
            this.cuotasAEliminar.forEach(num => {
                const cuota = datosConfirmacion.cuotas[num] ? datosConfirmacion.cuotas[num].monto : 0;
                const ref = datosConfirmacion.cuotas[num] ? datosConfirmacion.cuotas[num].ref : '-';
                detalleCuotas += `\n• Cuota ${num}: ${formatCurrency(cuota)} (Ref: ${ref})`;
            });

            mostrarModalCorporativo(
                '¿Confirmar Eliminación?',
                `¿Está seguro de que desea eliminar ${this.cuotasAEliminar.length} cuota(s) seleccionada(s)?\n\n<strong>Factura:</strong> ${datosConfirmacion.nro_factura}\n<strong>Cliente:</strong> ${datosConfirmacion.nombre_apellido}\n\n<strong>Cuotas a eliminar:</strong>${detalleCuotas}\n\n⚠️ <strong>ADVERTENCIA:</strong> Esta acción no se puede deshacer. Los montos depositados serán recalculados y la deuda se actualizará automáticamente.`,
                'warning',
                [
                    { texto: 'Cancelar', estilo: BTN.neutro },
                    { texto: 'Sí, Eliminar Cuotas', estilo: BTN.peligro, accion: () => this.ejecutarEliminarCuotas(datosConfirmacion) }
                ]
            );
        }

        async ejecutarEliminarCuotas(datosConfirmacion) {
            if (!datosConfirmacion || !datosConfirmacion.id || this.cuotasAEliminar.length === 0) return;

            showLoading(true);

            try {
                // v6.9.1: Enviar array de cuotas a eliminar; el backend borra de la tabla de pagos
                // v6.10-fix: Recalcular totales después de eliminar y enviarlos al backend
                const indexCliente = this.allData.findIndex(d => d.id === datosConfirmacion.id);
                let itemProcesadoPostElim = null;
                if (indexCliente !== -1) {
                    const copia = JSON.parse(JSON.stringify(this.allData[indexCliente]));
                    if (copia.pagos_extra) {
                        copia.pagos_extra = copia.pagos_extra.filter(
                            p => !this.cuotasAEliminar.includes(parseInt(p.nro_cuota))
                        );
                    }
                    itemProcesadoPostElim = this.processItemData(copia);
                }

                const data = {
                    eliminar_cuotas: this.cuotasAEliminar
                };
                if (itemProcesadoPostElim) {
                    data.deuda = itemProcesadoPostElim.deuda;
                    data.monto_depositados = itemProcesadoPostElim.monto_depositados;
                }

                const response = await this._apiFetch(`${this.cfg.api}/${datosConfirmacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                await response.json();

                // Actualizar datos locales: eliminar del array pagos_extra
                const index = this.allData.findIndex(d => d.id === datosConfirmacion.id);
                if (index !== -1) {
                    if (this.allData[index].pagos_extra) {
                        this.allData[index].pagos_extra = this.allData[index].pagos_extra.filter(
                            p => !this.cuotasAEliminar.includes(parseInt(p.nro_cuota))
                        );
                    }
                    // Recalcular desde pagos_extra (processItemData lo hace)
                    this.allData[index] = this.processItemData(this.allData[index]);
                }

                this.applyFilters();
                this.updateSummary();
                this.updateFilterCounts();
                this.closeModal();

                const deudaActual = (index !== -1 && this.allData[index]) ? this.allData[index].deuda : 0;
                const depositadoActual = (index !== -1 && this.allData[index]) ? this.allData[index].monto_depositados : 0;

                mostrarModalCorporativo(
                    '¡Cuotas Eliminadas!',
                    `Se han eliminado ${this.cuotasAEliminar.length} cuota(s) exitosamente.

<strong>Factura:</strong> ${datosConfirmacion.nro_factura}
<strong>Nueva Deuda:</strong> ${formatCurrency(deudaActual)}
<strong>Total Depositado:</strong> ${formatCurrency(depositadoActual)}`,
                    'exito',
                    [{ texto: 'Aceptar', estilo: BTN.aceptar }]
                );

                this.cuotasAEliminar = [];

            } catch (error) {
                console.error('Error eliminando cuotas:', error);
                mostrarModalCorporativo('Error', 'Error al eliminar las cuotas: ' + error.message, 'error',
                    [{ texto: 'Aceptar', estilo: BTN.peligro }]);
            } finally {
                showLoading(false);
            }
        }


        // ====================================================
        // CONCILIACIONES BANCARIAS
        // ====================================================
        resetConciliaciones() {
            this.limpiarFormularioConciliacion();
            this.limpiarFormularioNuevaConciliacion();
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('nuevo-registro'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada'),
                  busqueda = c('busqueda');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
            if (busqueda) busqueda.style.display = 'block';
            if (buscar) { buscar.value = ''; buscar.focus(); }
            this.concCliente = null;
        }

        volverABuscarFactura() {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('nuevo-registro'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada'),
                  busqueda = c('busqueda');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
            if (busqueda) busqueda.style.display = 'block';
            if (buscar) { buscar.value = ''; buscar.focus(); }
            this.concCliente = null;
        }

        async buscarFactura() {
            const input = this.el(this.concId('factura-buscar'));
            const nroFactura = input ? input.value.trim() : '';
            if (!nroFactura) {
                mostrarModalCorporativo('Validación', 'Ingrese un número de factura', 'warning', [{
                    texto: 'Aceptar', estilo: BTN.warning,
                    accion: () => { if (input) input.focus(); }
                }]);
                return;
            }

            showLoading(true);

            try {
                const response = await this._apiFetch(this.cfg.api);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                const clienteBasico = data.find(c => c.nro_factura === nroFactura);

                const msg = this.el(this.concId('mensaje-inicial'));
                if (msg) msg.style.display = 'none';

                if (clienteBasico) {
                    // v6.8: Obtener datos completos incluyendo pagos_extra
                    const detalleResponse = await this._apiFetch(`${this.cfg.api}/${clienteBasico.id}`);
                    let clienteCompleto = clienteBasico;
                    if (detalleResponse.ok) {
                        clienteCompleto = await detalleResponse.json();
                    }
                    this.concCliente = this.processItemData(clienteCompleto);
                    this.mostrarClienteEncontrado(this.concCliente);
                } else {
                    this.concCliente = null;
                    this.mostrarFacturaNoEncontrada(nroFactura);
                }

            } catch (error) {
                console.error('Error buscando factura:', error);
                mostrarModalCorporativo('Error', 'Error al buscar la factura: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        mostrarClienteEncontrado(cliente) {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('resultado-nueva'), noEnc = c('no-encontrada');
            if (resE) resE.style.display = 'block';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';

            // v6.8: Calcular cuotas pagadas desde pagos_extra
            const pagos = cliente.pagos_extra || [];
            const cuotasPagadasReal = pagos.filter(p => parseFloat(p.monto_bs) > 0).length;

            const setText = (n, v) => { const el = c(n); if (el) el.textContent = v; };
            setText('info-factura', cliente.nro_factura || '-');
            setText('info-nombre', cliente.nombre_apellido || '-');
            setText('info-cedula', cliente.cedula || '-');
            setText('info-monto', formatCurrency(cliente.monto_factura));
            setText('info-deuda', formatCurrency(cliente.deuda));
            setText('info-cuotas', `${cuotasPagadasReal} de ${cliente.total_cuotas || TOTAL_CUOTAS}`);

            // Cargar historial de cuotas siempre (visible para info)
            this.cargarHistorialCuotas(cliente);

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
                            estilo: BTN.neutro,
                            accion: () => {
                                const r = this.el(this.concId('resultado-encontrada'));
                                if (r) r.style.display = 'none';
                                this.volverABuscarFactura();
                            }
                        },
                        {
                            texto: 'Sí, agregar cuota',
                            estilo: BTN.aceptar,
                            accion: () => this.mostrarFormularioCuota(cliente)
                        }
                    ]
                );
                // Ocultar el formulario de cuota hasta que el usuario decida
                this.ocultarFormularioCuota();
            } else {
                // Deuda > 0, mostrar formulario normalmente
                this.mostrarFormularioCuota(cliente);
            }
        }

        mostrarFormularioCuota(cliente) {
            // v6.8: Calcular siguiente cuota desde pagos_extra
            const pagos = cliente.pagos_extra || [];
            const cuotasPagadasReal = pagos.filter(p => parseFloat(p.monto_bs) > 0).length;
            const siguienteCuota = cuotasPagadasReal + 1;
            const numEl = this.el(this.concId('cuota-numero'));
            const fechaEl = this.el(this.concId('cuota-fecha'));
            if (numEl) numEl.value = siguienteCuota;
            if (fechaEl) fechaEl.value = new Date().toISOString().split('T')[0];
            this.limpiarFormularioConciliacion();
            this.obtenerTasaPorFecha();

            // Asegurar que el formulario de cuota esté visible
            const res = this.el(this.concId('resultado-encontrada'));
            const formCuota = res ? res.querySelector('[data-card="form-cuota"]') : null;
            if (formCuota) formCuota.style.display = 'block';
        }

        ocultarFormularioCuota() {
            const res = this.el(this.concId('resultado-encontrada'));
            const formCuota = res ? res.querySelector('[data-card="form-cuota"]') : null;
            if (formCuota) formCuota.style.display = 'none';
        }

        mostrarFacturaNoEncontrada(nroFactura) {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('resultado-nueva'),
                  msg = c('mensaje-inicial'), noEnc = c('no-encontrada'),
                  numEl = c('no-encontrada-numero');

            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (msg) msg.style.display = 'none';
            if (noEnc) {
                noEnc.style.display = 'block';
                if (numEl) numEl.textContent = nroFactura;
            }
        }

        mostrarFormularioNuevoRegistro() {
            const noEnc = this.el(this.concId('no-encontrada'));
            const buscar = this.el(this.concId('factura-buscar'));
            const nroFactura = buscar ? buscar.value.trim() : '';

            if (noEnc) noEnc.style.display = 'none';
            this.mostrarNuevoRegistro(nroFactura);
            this.cambiarTabNuevoRegistro('factura');
        }

        // ---------- Tasa BCV ----------
        async _obtenerTasaBCV(fechaId, tasaId, mensajeId, onTasa) {
            const fechaEl = this.el(this.concId(fechaId));
            const fecha = fechaEl ? fechaEl.value : '';
            if (!fecha) return;

            const tasaInput = this.el(this.concId(tasaId));
            const mensaje = this.el(this.concId(mensajeId));
            if (!tasaInput || !mensaje) return;

            mensaje.textContent = '⏳ Consultando tasa BCV...';
            mensaje.style.color = '#2c5282';

            // Helper robusto: extrae tasa numérica de cualquier formato de respuesta
            const extraerTasaValor = (data) => {
                if (!data || !data.tasa) return null;
                // Formato { tasa: { usd: 76.85, date: "..." } }
                if (typeof data.tasa.usd === 'number') return data.tasa.usd;
                // Formato { tasa: { current: { usd: 76.85 } } }
                if (data.tasa.current && typeof data.tasa.current.usd === 'number') return data.tasa.current.usd;
                // Formato { tasa: { current: 76.85 } }
                if (data.tasa.current && typeof data.tasa.current === 'number') return data.tasa.current;
                // Formato { tasa: 76.85 }
                if (typeof data.tasa === 'number') return data.tasa;
                // Formato { tasa: "76.85" }
                if (typeof data.tasa === 'string') {
                    const parsed = parseFloat(data.tasa.replace(',', '.'));
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            };

            // Helper robusto: extrae fecha de la respuesta
            const extraerTasaFecha = (data) => {
                if (!data || !data.tasa) return null;
                if (data.tasa.date) return data.tasa.date;
                if (data.tasa.current && data.tasa.current.date) return data.tasa.current.date;
                return null;
            };

            let data = null;
            const token = localStorage.getItem('token');

            // 1) Intentar tasa por fecha
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

            let tasaUsd = extraerTasaValor(data);
            let tasaFecha = extraerTasaFecha(data);

            // 2) Si no hay tasa por fecha, intentar tasa actual
            if (!tasaUsd || tasaUsd <= 0) {
                mensaje.textContent = '⚠️ No hay tasa histórica. Consultando tasa actual...';
                mensaje.style.color = '#ed8936';

                try {
                    const response = await fetch('/api/bcv/actual', {
                        headers: token ? { 'Authorization': 'Bearer ' + token } : {}
                    });
                    if (response.ok) {
                        data = await response.json();
                        tasaUsd = extraerTasaValor(data);
                        tasaFecha = extraerTasaFecha(data);
                    }
                } catch (e) {
                    console.warn('Error fetch tasa actual:', e.message);
                }
            }

            // 3) Si tenemos tasa válida, aplicarla
            if (tasaUsd && tasaUsd > 0) {
                tasaInput.value = Number(tasaUsd).toFixed(4);
                this.concTasa = tasaUsd;
                const fechaStr = tasaFecha || fecha || 'hoy';
                mensaje.textContent = '✅ Tasa BCV obtenida: ' + tasaUsd.toFixed(4) + ' Bs (fecha: ' + fechaStr + ')';
                mensaje.style.color = '#28a745';
                onTasa.call(this);
                return;
            }

            // 4) Fallback final: tasa por defecto
            tasaInput.value = '721.3456';
            this.concTasa = 721.3456;
            mensaje.textContent = '⚠️ Usando tasa por defecto: 721.3456 Bs';
            mensaje.style.color = '#ed8936';
            onTasa.call(this);
        }

        obtenerTasaPorFecha() {
            return this._obtenerTasaBCV('cuota-fecha', 'cuota-tasa', 'tasa-mensaje', this.calcularDolar);
        }

        obtenerTasaNueva() {
            return this._obtenerTasaBCV('nueva-cuota-fecha', 'nueva-cuota-tasa', 'nueva-tasa-mensaje', this.calcularDolarNueva);
        }

        calcularDolar() {
            const montoEl = this.el(this.concId('cuota-monto'));
            const tasaEl = this.el(this.concId('cuota-tasa'));
            const dolarEl = this.el(this.concId('cuota-dolar'));
            if (!montoEl || !tasaEl || !dolarEl) return;

            const monto = parseFloat(montoEl.value) || 0;
            const tasa = parseFloat(tasaEl.value) || 0;

            if (monto > 0 && tasa > 0) {
                dolarEl.value = (monto / tasa).toFixed(2);
            } else if (monto > 0 && tasa <= 0) {
                dolarEl.value = '';
                // No mostrar alerta aquí para no ser intrusivo
            } else {
                dolarEl.value = '';
            }
        }

        calcularDolarNueva() {
            const montoEl = this.el(this.concId('nueva-cuota-monto'));
            const tasaEl = this.el(this.concId('nueva-cuota-tasa'));
            const dolarEl = this.el(this.concId('nueva-cuota-dolar'));
            if (!montoEl || !tasaEl || !dolarEl) return;

            const monto = parseFloat(montoEl.value) || 0;
            const tasa = parseFloat(tasaEl.value) || 0;

            if (monto > 0 && tasa > 0) {
                dolarEl.value = (monto / tasa).toFixed(2);
            } else {
                dolarEl.value = '';
            }
        }

        cargarHistorialCuotas(cliente) {
            const tbody = this.el(this.concId('tabla-cuotas-body'));
            if (!tbody) return;

            let html = '';
            let tieneCuotas = false;
            const totalCuotasHist = parseInt(cliente.cuotas) || TOTAL_CUOTAS;

            // v6.8: Leer cuotas desde pagos_extra (tabla de pagos)
            const pagosMap = new Map();
            (cliente.pagos_extra || []).forEach(p => {
                const nro = parseInt(p.nro_cuota) || 0;
                if (nro > 0) {
                    pagosMap.set(nro, p);
                }
            });

            for (let i = 1; i <= totalCuotasHist; i++) {
                const p = pagosMap.get(i);
                if (p && parseNumberES(p.monto_bs) > 0) {
                    tieneCuotas = true;
                    html += `
                        <tr>
                            <td><strong>Cuota ${i}</strong></td>
                            <td class="monto">${formatCurrency(p.monto_bs)}</td>
                            <td>${p.referencia || '-'}</td>
                            <td>${formatDate(p.fecha)}</td>
                            <td>${parseNumberES(p.tasa_bcv) > 0 ? parseNumberES(p.tasa_bcv).toFixed(4) : '-'}</td>
                            <td class="monto">${parseNumberES(p.monto_usd) > 0 ? parseNumberES(p.monto_usd).toFixed(2) + ' $' : '-'}</td>
                        </tr>
                    `;
                }
            }

            // Fallback: si no hay pagos_extra, intentar columnas planas (legacy)
            if (!tieneCuotas) {
                for (let i = 1; i <= totalCuotasHist; i++) {
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
            }

            if (!tieneCuotas) {
                html = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay cuotas registradas</td></tr>';
            }

            tbody.innerHTML = html;
        }

        _validacionModal(mensaje, focusId) {
            mostrarModalCorporativo('Validación', mensaje, 'warning', [{
                texto: 'Aceptar', estilo: BTN.warning,
                accion: () => {
                    if (focusId) {
                        const el = this.el(this.concId(focusId));
                        if (el) el.focus();
                    }
                }
            }]);
        }

        
        // Helper: convierte cualquier fecha a string ISO yyyy-mm-dd
        _fechaToISO(fecha) {
            if (!fecha) return '';
            if (typeof fecha === 'string') {
                // Si ya es yyyy-mm-dd, devolver tal cual
                if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
                // Si es dd-mm-aaaa, convertir
                const m = fecha.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                if (m) return m[3] + '-' + m[2] + '-' + m[1];
                // Intentar parsear como Date
                const d = new Date(fecha);
                if (!isNaN(d.getTime())) {
                    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                }
                return fecha;
            }
            if (fecha instanceof Date) {
                return fecha.getFullYear() + '-' + String(fecha.getMonth()+1).padStart(2,'0') + '-' + String(fecha.getDate()).padStart(2,'0');
            }
            return String(fecha);
        }

async guardarCuota() {
            if (!this.concCliente) {
                mostrarModalCorporativo('Error', 'No hay cliente seleccionado', 'error');
                return;
            }

            const c = (n) => this.el(this.concId(n));
            const cuotaNum = parseInt(c('cuota-numero')?.value);
            const monto = parseFloat(c('cuota-monto')?.value);
            const ref = c('cuota-ref')?.value.trim();
            const fecha = c('cuota-fecha')?.value;
            const tasa = parseFloat(c('cuota-tasa')?.value);
            const dolar = parseFloat(c('cuota-dolar')?.value);

            if (!monto || monto <= 0) { this._validacionModal('Ingrese un monto válido', 'cuota-monto'); return; }
            if (!ref) { this._validacionModal('Ingrese la referencia del depósito', 'cuota-ref'); return; }
            if (!fecha) { this._validacionModal('Seleccione la fecha del depósito'); return; }
            if (!tasa || tasa <= 0) { this._validacionModal('La tasa BCV es obligatoria. Seleccione una fecha válida.'); return; }

            const cliente = this.concCliente;
            const data = {};

            // Helper: convierte fecha a string ISO yyyy-mm-dd
            const toISO = (f) => {
                if (!f) return '';
                if (typeof f === 'string') {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
                    const m = f.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                    if (m) return m[3] + '-' + m[2] + '-' + m[1];
                    const d = new Date(f);
                    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                    return f;
                }
                if (f instanceof Date) return f.toISOString().split('T')[0];
                return String(f);
            };

            // v6.9: Todas las cuotas van a la tabla de pagos (no más columnas planas)
            // Solo enviamos pagos_extra con la nueva cuota; el backend hace upsert
            data.pagos_extra = [{
                nro_cuota: cuotaNum,
                monto_bs: monto,
                referencia: ref,
                fecha: fecha,
                tasa_bcv: tasa,
                monto_usd: dolar || redondearDecimales(monto / tasa)
            }];

            // Incluir inicial si existe (campos base del cliente)
            const inicialBs = parseNumberES(cliente.inicial_bs);
            if (inicialBs > 0) {
                data.inicial_bs = inicialBs;
                data.inicial_usd = parseNumberES(cliente.inicial_usd) || 0;
                data.ref_inicial = (cliente.ref_inicial || '').toString();
                data.fecha_inicial = toISO(cliente.fecha_inicial);
                data.tasa_inicial = parseNumberES(cliente.tasa_inicial) || 0;
            }

            // v6.10-fix: Recalcular totales con la nueva cuota incluida y enviarlos al backend
            const clienteSimulado = JSON.parse(JSON.stringify(cliente));
            if (!clienteSimulado.pagos_extra) clienteSimulado.pagos_extra = [];
            clienteSimulado.pagos_extra.push({
                nro_cuota: cuotaNum,
                monto_bs: monto,
                monto_usd: dolar || redondearDecimales(monto / tasa)
            });
            const procesado = this.processItemData(clienteSimulado);
            data.deuda = procesado.deuda;
            data.monto_depositados = procesado.monto_depositados;

            // DEBUG
            console.log('[guardarCuota] Payload:', JSON.stringify(data, null, 2));

            showLoading(true);

            try {
                const response = await this._apiFetch(`${this.cfg.api}/${cliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || errData.details || `Error HTTP: ${response.status}`);
                }

                await response.json();

                const refreshResponse = await this._apiFetch(`${this.cfg.api}/${cliente.id}`);
                if (refreshResponse.ok) {
                    const refreshed = await refreshResponse.json();
                    this.concCliente = this.processItemData(refreshed);
                }

                await this.loadData();

                const deudaActual = this.concCliente.deuda || 0;

                if (deudaActual <= 0) {
                    this.ocultarFormularioCuota();
                    mostrarModalCorporativo(
                        '¡Factura Cancelada!',
                        'La factura ha sido cancelada completamente.\n\n¿Desea registrar una cuota adicional?',
                        'exito',
                        [
                            {
                                texto: 'No, volver a búsqueda',
                                estilo: BTN.neutro,
                                accion: () => {
                                    const r = this.el(this.concId('resultado-encontrada'));
                                    if (r) r.style.display = 'none';
                                    this.volverABuscarFactura();
                                }
                            },
                            {
                                texto: 'Sí, agregar cuota',
                                estilo: BTN.aceptar,
                                accion: () => this.mostrarFormularioCuota(this.concCliente)
                            }
                        ]
                    );
                } else {
                    mostrarModalCorporativo(
                        '¡Cuota Guardada!',
                        `Cuota ${cuotaNum} guardada exitosamente.\n\nDeuda restante: ${formatCurrency(deudaActual)}`,
                        'exito',
                        [{
                            texto: 'Aceptar',
                            estilo: BTN.aceptar,
                            accion: () => this.volverABuscarFactura()
                        }]
                    );
                }

            } catch (error) {
                console.error('Error guardando cuota:', error);
                mostrarModalCorporativo('Error', 'Error al guardar: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        async _ejecutarGuardarNuevaConciliacion(payload) {
            try {
                const response = await this._apiFetch(this.cfg.api, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                if (response.status === 413) {
                    mostrarModalCorporativo('Error', 'Los datos enviados son demasiado grandes. Contacte al administrador.', 'error'); return;
                }
                if (response.status === 429) {
                    mostrarModalCorporativo('Error', 'Demasiadas peticiones. Espere un minuto e intente nuevamente.', 'error'); return;
                }
                const data = await response.json();
                if (!response.ok) {
                    mostrarModalCorporativo('Error', data.error || 'Error al guardar el registro', 'error'); return;
                }
                if (data.advertencia) {
                    mostrarModalCorporativo('Advertencia', data.advertencia.mensaje + '\nFacturas: ' + data.advertencia.facturas.join(', '), 'warning');
                }
                mostrarModalCorporativo('Éxito', 'Registro creado exitosamente', 'exito');
                this.limpiarFormularioNuevaConciliacion();
                this.volverABuscar();
                this.loadData();
            } catch (err) {
                mostrarModalCorporativo('Error de Conexión', 'No se pudo conectar con el servidor', 'error');
            }
        }

        async guardarNuevaConciliacion() {
            const c = this.cfg.concPfx;
            const self = this;
            // Helper: parsea número seguro, devuelve null si está vacío/NaN/inválido
            const num = (id) => {
                const el = document.getElementById(c + '-' + id);
                if (!el) return null;
                const v = el.value.trim().replace(',', '.');
                if (v === '') return null;
                const n = parseFloat(v);
                return isNaN(n) ? null : n;
            };
            const payload = {
                nro_factura: document.getElementById(c + '-nueva-factura').value,
                fecha_factura: document.getElementById(c + '-nueva-fecha-factura').value,
                nombre_apellido: document.getElementById(c + '-nueva-nombre').value,
                cedula: document.getElementById(c + '-nueva-cedula').value,
                telefono: document.getElementById(c + '-nueva-telefono')?.value || '',
                monto_factura: num('nueva-monto'),
                monto_facturado_divisa: num('nueva-monto-usd'),
                cuotas: parseInt(document.getElementById(c + '-nueva-total-cuotas').value) || 4,
                inicial_bs: num('nueva-inicial-bs'),
                inicial_usd: num('nueva-inicial-usd'),
                ref_inicial: document.getElementById(c + '-nueva-ref-inicial').value,
                fecha_inicial: document.getElementById(c + '-nueva-fecha-inicial').value,
                tasa_inicial: num('nueva-tasa-inicial'),
                tasa_bcv_factura: num('nueva-tasa-factura'),
                monto_cuota_usd: num('nueva-monto-cuota'),
                numero_cuenta: '', banco: ''
            };

            if (!payload.nro_factura || !payload.nombre_apellido || !payload.fecha_factura) {
                mostrarModalCorporativo('Validación', 'Complete los campos obligatorios', 'warning'); return;
            }
            if (!payload.monto_factura || payload.monto_factura <= 0) {
                mostrarModalCorporativo('Validación', 'El monto de factura debe ser mayor a cero', 'warning'); return;
            }
            if (!payload.inicial_bs || payload.inicial_bs <= 0) {
                mostrarModalCorporativo('Validación', 'El inicial debe ser mayor a cero', 'warning'); return;
            }
            if (payload.inicial_bs > payload.monto_factura) {
                mostrarModalCorporativo('Validación', 'El inicial no puede superar el monto total', 'warning'); return;
            }

            // Validación de cédula duplicada
            if (payload.cedula && payload.cedula.trim() !== '') {
                const cedulaLimpia = payload.cedula.trim();
                const duplicado = self.allData.find(item => {
                    const cedulaExistente = (item.cedula || '').trim();
                    return cedulaExistente && cedulaExistente === cedulaLimpia;
                });
                if (duplicado) {
                    mostrarModalCorporativo(
                        '⚠️ Cédula ya registrada',
                        'La cédula <strong>' + cedulaLimpia + '</strong> ya existe en la base de datos.\n\n' +
                        'Cliente: ' + (duplicado.nombre_apellido || 'N/A') + '\n' +
                        'Factura: ' + (duplicado.nro_factura || 'N/A') + '\n\n' +
                        '¿Desea continuar y crear el registro de todas formas?',
                        'warning',
                        [
                            { texto: 'Cancelar', estilo: BTN.neutro },
                            { texto: 'Sí, continuar', estilo: BTN.warning, accion: () => self._ejecutarGuardarNuevaConciliacion(payload) }
                        ]
                    );
                    return;
                }
            }

            await self._ejecutarGuardarNuevaConciliacion(payload);
        }

        limpiarFormularioConciliacion() {
            const c = (n) => this.el(this.concId(n));
            const setVal = (n, v) => { const el = c(n); if (el) el.value = v; };
            setVal('cuota-monto', '');
            setVal('cuota-ref', '');
            setVal('cuota-tasa', '');
            setVal('cuota-dolar', '');
            const msg = c('tasa-mensaje');
            if (msg) msg.textContent = '';
        }

        
        // ============================================================
        // v6.7.2-rev9: Nuevo Registro con calculos en tiempo real
        // ============================================================


        // ---------- Navegación de pestañas en Nuevo Registro ----------
        cambiarTabNuevoRegistro(tabName) {
            const c = this.cfg.concPfx;
            const root = document.getElementById(c + '-nuevo-registro');
            if (!root) return;

            // Ocultar todos los paneles
            root.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
            // Desactivar todos los botones
            root.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.borderBottom = '3px solid transparent';
                b.style.color = '#718096';
            });

            // Mostrar panel activo
            const panel = document.getElementById(c + '-tab-' + tabName);
            if (panel) panel.style.display = 'block';

            // Activar botón
            const btn = root.querySelector('.tab-btn[data-tab="' + tabName + '"]');
            if (btn) {
                btn.classList.add('active');
                btn.style.borderBottom = '3px solid ' + this.color;
                btn.style.color = this.color;
            }
        }

        siguienteTabNuevoRegistro(tabName) {
            this.cambiarTabNuevoRegistro(tabName);
        }

        mostrarNuevoRegistro(nroFactura) {
            const c = this.cfg.concPfx;
            document.getElementById(c + '-busqueda').style.display = 'none';
            document.getElementById(c + '-resultado-encontrada').style.display = 'none';
            document.getElementById(c + '-nuevo-registro').style.display = 'block';
            this.cambiarTabNuevoRegistro('factura');

            const hoy = new Date().toISOString().split('T')[0];
            const ff = document.getElementById(c + '-nueva-fecha-factura');
            const fi = document.getElementById(c + '-nueva-fecha-inicial');
            const fFact = document.getElementById(c + '-nueva-factura');
            if (ff && !ff.value) ff.value = hoy;
            if (fi && !fi.value) fi.value = hoy;
            if (fFact && nroFactura) fFact.value = nroFactura;

            this.inicializarCalculosNuevoRegistro();
        }

        volverABuscar() {
            const c = this.cfg.concPfx;
            document.getElementById(c + '-busqueda').style.display = 'block';
            document.getElementById(c + '-resultado-encontrada').style.display = 'none';
            document.getElementById(c + '-nuevo-registro').style.display = 'none';
            document.getElementById(c + '-factura-buscar').value = '';
        }

        inicializarCalculosNuevoRegistro() {
            const c = this.cfg.concPfx;
            const self = this;
            const el = (id) => document.getElementById(c + '-' + id);

            // Evitar inicializar múltiples veces (listeners duplicados)
            const formContainer = el('nuevo-registro');
            if (formContainer && formContainer.dataset.listenersInit === '1') return;
            if (formContainer) formContainer.dataset.listenersInit = '1';

            const extraerTasa = (data) => {
                if (!data || !data.tasa) return null;
                // Formato directo de la API: { tasa: { usd: 76.85, eur: ..., date: ... } }
                if (typeof data.tasa.usd === 'number') return data.tasa.usd;
                // Formato fallback: { tasa: { current: { usd: 76.85, eur: ..., date: ... } } }
                if (data.tasa.current && typeof data.tasa.current.usd === 'number') return data.tasa.current.usd;
                if (typeof data.tasa === 'number') return data.tasa;
                if (typeof data.tasa === 'string') {
                    const parsed = parseFloat(data.tasa.replace(',', '.'));
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            };

            const calcularMontoUSD = async () => {
                const montoBs = parseFloat(el('nueva-monto').value) || 0;
                const fecha = el('nueva-fecha-factura').value;
                if (montoBs <= 0 || !fecha) { el('nueva-monto-usd').value = ''; return; }
                let tasa = parseFloat(el('nueva-tasa-factura').value);
                if (!tasa || tasa <= 0.0001) {
                    try {
                        const res = await fetch('/api/bcv/fecha/' + fecha, {headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}});
                        if (!res.ok) throw new Error('HTTP ' + res.status);
                        const data = await res.json();
                        const tasaVal = extraerTasa(data);
                        if (tasaVal) { tasa = tasaVal; el('nueva-tasa-factura').value = tasa.toFixed(4); }
                    } catch(e) {
                        console.warn('Error consultando tasa factura:', e.message);
                    }
                }
                if (tasa > 0) {
                    el('nueva-monto-usd').value = redondearDecimales(montoBs / tasa).toFixed(2);
                } else {
                    el('nueva-monto-usd').value = '';
                }
                self.calcularDeudaYCuota();
            };

            const calcularInicialUSD = async () => {
                const inicialBs = parseFloat(el('nueva-inicial-bs').value) || 0;
                const fecha = el('nueva-fecha-inicial').value;
                if (inicialBs <= 0 || !fecha) { el('nueva-inicial-usd').value = ''; return; }
                let tasa = parseFloat(el('nueva-tasa-inicial').value);
                if (!tasa || tasa <= 0.0001) {
                    try {
                        const res = await fetch('/api/bcv/fecha/' + fecha, {headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}});
                        if (!res.ok) throw new Error('HTTP ' + res.status);
                        const data = await res.json();
                        const tasaVal = extraerTasa(data);
                        if (tasaVal) { tasa = tasaVal; el('nueva-tasa-inicial').value = tasa.toFixed(4); }
                    } catch(e) {
                        console.warn('Error consultando tasa inicial:', e.message);
                    }
                }
                if (tasa > 0) {
                    el('nueva-inicial-usd').value = redondearDecimales(inicialBs / tasa).toFixed(2);
                } else {
                    el('nueva-inicial-usd').value = '';
                }
                self.calcularDeudaYCuota();
            };

            el('nueva-monto').addEventListener('input', calcularMontoUSD);
            el('nueva-fecha-factura').addEventListener('change', calcularMontoUSD);
            el('nueva-tasa-factura').addEventListener('input', calcularMontoUSD);
            el('nueva-inicial-bs').addEventListener('input', calcularInicialUSD);
            el('nueva-fecha-inicial').addEventListener('change', calcularInicialUSD);
            el('nueva-tasa-inicial').addEventListener('input', calcularInicialUSD);
            el('nueva-total-cuotas').addEventListener('change', () => self.calcularDeudaYCuota());
        }

        calcularDeudaYCuota() {
            const c = this.cfg.concPfx;
            const montoUsd = parseFloat(document.getElementById(c + '-nueva-monto-usd').value) || 0;
            const inicialUsd = parseFloat(document.getElementById(c + '-nueva-inicial-usd').value) || 0;
            const cuotas = parseInt(document.getElementById(c + '-nueva-total-cuotas').value) || 4;
            const deuda = redondearDecimales(montoUsd - inicialUsd);
            const cuota = cuotas > 0 ? redondearDecimales(deuda / cuotas) : 0;
            document.getElementById(c + '-nueva-deuda-usd').value = deuda.toFixed(2);
            document.getElementById(c + '-nueva-monto-cuota').value = cuota.toFixed(2);
        }

        // ============================================================
        // v6.7.2-rev9: Modal Editar Cliente con campos nuevos
        // ============================================================

        esRegistroNuevoV672(cliente) {
            return cliente.inicial_bs !== null && cliente.inicial_bs !== undefined
                && cliente.inicial_bs !== '' && parseFloat(cliente.inicial_bs) > 0;
        }

        calcularResumenMontos(cliente) {
            const esNuevo = this.esRegistroNuevoV672(cliente);
            const montoFacturadoUSD = parseFloat(cliente.monto_facturado_divisa)
                || parseFloat(cliente.monto_factura) / parseFloat(cliente.tasa_bcv_factura || 1);
            // FIX: registros antiguos NO usan cuota_1 como inicial; eso causaba doble conteo
            const inicialBs = esNuevo ? (parseFloat(cliente.inicial_bs) || 0) : 0;
            const inicialUSD = esNuevo ? (parseFloat(cliente.inicial_usd) || 0) : 0;
            const deudaUSD = montoFacturadoUSD - inicialUSD;
            const deudaBs = parseFloat(cliente.monto_factura) - inicialBs;
            let totalCuotas = parseInt(cliente.cuotas) || TOTAL_CUOTAS;

            // v6.10-fix-defensivo: Si el backend devuelve un nro de cuotas inconsistente
            // con la deuda y el monto_cuota_usd (p.ej. guardó 4 pero devuelve 30),
            // recalcular totalCuotas para que la UI sea coherente.
            const montoCuotaGuardado = parseFloat(cliente.monto_cuota_usd) || 0;
            if (montoCuotaGuardado > 0 && deudaUSD > 0) {
                const cuotasSugeridas = Math.max(1, Math.round(deudaUSD / montoCuotaGuardado));
                if (Math.abs(cuotasSugeridas - totalCuotas) > 0 && cuotasSugeridas <= TOTAL_CUOTAS) {
                    const pagos = cliente.pagos_extra || [];
                    const maxNroPago = pagos.reduce((max, p) => Math.max(max, parseInt(p.nro_cuota) || 0), 0);
                    if (maxNroPago <= cuotasSugeridas) {
                        console.warn(`[Tiendas/${this.cfg.key}] cuotas corregido: BD dice ${totalCuotas}, pero deuda/cuota sugieren ${cuotasSugeridas}`);
                        totalCuotas = cuotasSugeridas;
                    }
                }
            }

            let montoCuotaUSD = esNuevo ? montoCuotaGuardado : redondearDecimales(deudaUSD / totalCuotas);
            // v6.7.6-fix: Si monto_cuota_usd es 0/null pero hay deuda, recalcular
            if (montoCuotaUSD === 0 && deudaUSD > 0 && totalCuotas > 0) {
                montoCuotaUSD = redondearDecimales(deudaUSD / totalCuotas);
            }

            let totalDepositadoBs = inicialBs;
            let totalDepositadoUSD = inicialUSD;
            let cuotasPagadas = 0;

            // v6.8: Sumar cuotas desde pagos_extra (tabla de pagos)
            const pagosExtra = cliente.pagos_extra || [];
            const totalCuotasRes = totalCuotas;
            pagosExtra.forEach(p => {
                const nro = parseInt(p.nro_cuota) || 0;
                if (nro < 1) return; // Solo ignorar nro_cuota inválido, sumar todas las demás
                const montoBs = parseFloat(p.monto_bs) || 0;
                const montoUsd = parseFloat(p.monto_usd) || 0;
                if (montoBs > 0) {
                    totalDepositadoBs += montoBs;
                    totalDepositadoUSD += montoUsd;
                    cuotasPagadas++;
                }
            });

            // Fallback: si no hay pagos_extra, intentar columnas planas (legacy)
            if (cuotasPagadas === 0) {
                for (let i = 1; i <= totalCuotasRes; i++) {
                    const cuotaBs = parseFloat(cliente['cuota_' + i] || 0);
                    const cuotaUSD = parseFloat(cliente['dolar_depositado_cuota_' + i] || 0);
                    if (cuotaBs > 0) { totalDepositadoBs += cuotaBs; totalDepositadoUSD += cuotaUSD; cuotasPagadas++; }
                }
            }

            const deudaPendienteBs = parseFloat(cliente.monto_factura) - totalDepositadoBs;
            const deudaPendienteUSD = montoFacturadoUSD - totalDepositadoUSD;
            const proximaCuota = Math.min(montoCuotaUSD, deudaPendienteUSD);

            return { montoFacturadoUSD, inicialBs, inicialUSD, deudaUSD, deudaBs, totalCuotas, montoCuotaUSD, totalDepositadoBs, totalDepositadoUSD, deudaPendienteBs, deudaPendienteUSD, cuotasPagadas, proximaCuota };
        }

        __toggleAllCuotas(masterCheckbox) {
            const self = this;
            const modal = document.getElementById(self.cfg.key + '-modal-v672');
            if (!modal) return;
            const checks = modal.querySelectorAll('input[name^="eliminar-cuota-"]');
            checks.forEach(chk => { chk.checked = masterCheckbox.checked; });
            self.__actualizarBarraEliminar();
        }

        __onCuotaCheckboxChange() {
            this.__actualizarBarraEliminar();
        }

        __limpiarSeleccionCuotas() {
            const self = this;
            const modal = document.getElementById(self.cfg.key + '-modal-v672');
            if (!modal) return;
            const checks = modal.querySelectorAll('input[name^="eliminar-cuota-"]');
            checks.forEach(chk => { chk.checked = false; });
            const master = modal.querySelector('input[id^="chk-all-cuotas-"]');
            if (master) master.checked = false;
            self.__actualizarBarraEliminar();
        }

        formatearFechaInput(fechaStr) {
            if (!fechaStr) return '';
            const f = tmParseFecha(fechaStr);
            if (!f) return '';
            return String(f.dia).padStart(2, '0') + '-' + String(f.mes).padStart(2, '0') + '-' + f.anio;
        }

        _parseFechaInputToISO(fechaStr) {
            if (!fechaStr) return '';
            const m = fechaStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (m) return m[3] + '-' + m[2] + '-' + m[1];
            return fechaStr;
        }

        // Calcular discrepancias en tiempo real (si no vienen de la BD)
        calcularDiscrepanciasFrontend(cliente) {
            const montoCuotaUSD = parseFloat(cliente.monto_cuota_usd) || 0;
            const totalCuotas = parseInt(cliente.cuotas) || TOTAL_CUOTAS;
            const montoFacturadoDivisa = parseFloat(cliente.monto_facturado_divisa)
                || (parseFloat(cliente.monto_factura) / parseFloat(cliente.tasa_bcv_factura || 1));
            const inicialUSD = parseFloat(cliente.inicial_usd) || 0;
            const deudaTotal = montoFacturadoDivisa - inicialUSD;

            let cuotasPagadas = 0;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuotaBs = parseFloat(cliente['cuota_' + i]) || 0;
                if (cuotaBs > 0) cuotasPagadas++;
            }

            const discrepancias = {};
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const dolarRecibido = parseFloat(cliente['dolar_depositado_cuota_' + i]) || 0;
                const cuotaBs = parseFloat(cliente['cuota_' + i]) || 0;
                if (dolarRecibido > 0 || cuotaBs > 0) {
                    const esUltimaPagada = i === cuotasPagadas && i === totalCuotas;
                    let esperado = montoCuotaUSD;
                    if (esUltimaPagada && montoCuotaUSD > 0) {
                        const acumuladoAnterior = redondearDecimales(montoCuotaUSD * (totalCuotas - 1));
                        esperado = redondearDecimales(deudaTotal - acumuladoAnterior);
                    }
                    const diferencia = redondearDecimales(esperado - dolarRecibido);
                    if (Math.abs(diferencia) > 0.01) {
                        discrepancias[i] = {
                            esperado: redondearDecimales(esperado),
                            recibido: dolarRecibido,
                            diferencia: diferencia
                        };
                    }
                }
            }
            return discrepancias;
        }

        renderizarPanelResumen(cliente, esNuevo) {
            const resumen = this.calcularResumenMontos(cliente);
            // v6.7.5: mostrar valores calculados si existen, no solo para registros nuevos
            const montoFacturadoUSD = resumen.montoFacturadoUSD > 0 ? resumen.montoFacturadoUSD.toFixed(2) + ' $' : '—';
            const inicialBs = resumen.inicialBs > 0 ? resumen.inicialBs.toFixed(2) : '—';
            const inicialUSD = resumen.inicialUSD > 0 ? resumen.inicialUSD.toFixed(2) + ' $' : '—';
            const deudaUSD = resumen.deudaUSD > 0 ? resumen.deudaUSD.toFixed(2) + ' $' : '—';
            // Cuotas: solo lectura, sin select de edición
            const totalCuotas = parseInt(cliente.cuotas) || TOTAL_CUOTAS;
            const cuotasTexto = '<span style="color:#2c5282;font-weight:700;font-size:14px;">' + totalCuotas + ' cuotas de ' + resumen.montoCuotaUSD.toFixed(2) + ' $</span>';
            const deudaPendienteUSD = esNuevo ? resumen.deudaPendienteUSD.toFixed(2) + ' $' : '—';
            const proximaCuota = esNuevo && resumen.proximaCuota > 0 ? resumen.proximaCuota.toFixed(2) + ' $' : '0.00 $';

            return '<div class="panel-resumen" style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;">' +
                '<h4 style="margin:0 0 14px 0;font-size:14px;color:#1a365d;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Resumen de Montos</h4>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Monto Factura (Bs)</span><span style="color:#1a365d;font-weight:700;font-family:monospace;font-size:14px;">' + (parseFloat(cliente.monto_factura) || 0).toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Monto Facturado ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + montoFacturadoUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Inicial (Bs)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + inicialBs + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Inicial ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + inicialUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Deuda ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + deudaUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Cuotas</span><span style="color:#2c5282;font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">' + cuotasTexto + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Depositado (Bs)</span><span style="color:#38a169;font-weight:700;font-family:monospace;font-size:14px;">' + resumen.totalDepositadoBs.toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Deuda Pendiente (Bs)</span><span style="color:#e53e3e;font-weight:700;font-family:monospace;font-size:14px;">' + resumen.deudaPendienteBs.toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Deuda Pendiente ($)</span><span style="color:#e53e3e;font-weight:700;font-family:monospace;font-size:14px;">' + deudaPendienteUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Próxima Cuota</span><span style="color:#3182ce;font-weight:700;font-family:monospace;font-size:14px;">' + proximaCuota + '</span></div>' +
                '</div>';
        }

        renderizarPanelCuotas(cliente, esNuevo, esAdmin) {
            const resumen = this.calcularResumenMontos(cliente);
            const discrepancias = cliente.discrepancias_cuotas ? (typeof cliente.discrepancias_cuotas === 'string' ? JSON.parse(cliente.discrepancias_cuotas) : cliente.discrepancias_cuotas) : {};
            const montoCuotaUSD = resumen.montoCuotaUSD;
            const totalCuotas = resumen.totalCuotas;

            // Helper: determina si un campo de cuota tiene datos reales
            // ignora "0", "0.00", "0.0000", "", null, undefined
            const _tieneValorReal = (v) => {
                if (v === null || v === undefined || v === '') return false;
                const str = String(v).trim();
                if (str === '' || str === '0' || str === '0.0' || str === '0.00' || str === '0.000' || str === '0.0000') return false;
                const num = parseFloat(str.replace(',', '.'));
                return !isNaN(num) && num > 0;
            };

            let html = '<div class="panel-cuotas">';
            html += '<h4>Cuotas del Credito <span class="cuotas-registradas">' + resumen.cuotasPagadas + ' cuota(s) registrada(s)</span></h4>';
            html += '<table class="tabla-cuotas-modal">';
            html += '<thead><tr>' + (esAdmin ? '<th style="width:30px"><input type="checkbox" id="chk-all-cuotas-' + this.cfg.key + '" title="Seleccionar todas"></th>' : '') + '<th>#</th><th>Monto Bs.</th><th>Referencia</th><th>Fecha</th><th>Tasa BCV</th><th>Monto $</th><th>Estado</th></tr></thead><tbody>';

            if (esNuevo) {
                html += '<tr class="fila-inicial">';
                html += (esAdmin ? '<td></td>' : '');
                html += '<td><span class="badge-inicial">0</span></td>';
                html += '<td><input type="number" value="' + (cliente.inicial_bs || '') + '" readonly step="0.01" class="solo-lectura"></td>';
                html += '<td><input type="text" value="' + (cliente.ref_inicial || '') + '" readonly class="solo-lectura"></td>';
                html += '<td><input type="text" value="' + this.formatearFechaInput(cliente.fecha_inicial) + '" disabled class="solo-lectura" placeholder="dd-mm-aaaa" style="text-align:center;font-family:monospace;font-size:12px;"></td>';
                html += '<td><input type="number" value="' + (cliente.tasa_inicial || '') + '" readonly step="0.0001" class="solo-lectura"></td>';
                html += '<td><input type="number" value="' + (cliente.inicial_usd || '') + '" readonly step="0.01" class="calculado"></td>';
                html += '<td><span style="color:#38a169;font-weight:700">✓</span></td>';
                html += '</tr>';
            }

            // v6.8: Iterar sobre pagos_extra (tabla de pagos) en lugar de columnas planas
            const pagosArray = cliente.pagos_extra || [];
            pagosArray.sort((a, b) => (a.nro_cuota || 0) - (b.nro_cuota || 0));

            pagosArray.forEach((pago, idx) => {
                const i = parseInt(pago.nro_cuota) || (idx + 1);
                const cuotaBs = pago.monto_bs;
                const refCuota = pago.referencia;
                const fechaCuota = pago.fecha;
                const tasaCuota = pago.tasa_bcv;
                const dolarCuota = pago.monto_usd;

                const tieneValor = parseFloat(cuotaBs) > 0;
                const readonlyAttr = esAdmin ? '' : 'readonly';
                const disabledAttr = esAdmin ? '' : 'disabled';

                let estadoHTML = '<span style="color:#718096;font-size:9px">Pendiente</span>';
                if (tieneValor) {
                    const recibido = parseFloat(dolarCuota) || 0;
                    const esUltimaPagada = idx === pagosArray.length - 1 && i === totalCuotas;
                    let esperado = montoCuotaUSD;
                    if (esUltimaPagada && montoCuotaUSD > 0) {
                        const acumulado = redondearDecimales(montoCuotaUSD * (totalCuotas - 1));
                        const deudaTotal = resumen.montoFacturadoUSD - resumen.inicialUSD;
                        esperado = redondearDecimales(deudaTotal - acumulado);
                    }
                    const diferencia = redondearDecimales(esperado - recibido);
                    const diffAbs = Math.abs(diferencia);

                    if (diffAbs > 0.01) {
                        const esFaltante = diferencia > 0;
                        const signo = esFaltante ? '-' : '+';
                        const colorBadge = esFaltante ? '#c53030' : '#dd6b20';
                        estadoHTML = '<div style="color:#c53030;font-size:11px;font-weight:600;background:#fff5f5;padding:4px 8px;border-radius:4px;border:1px solid #feb2b2;display:inline-block;">' +
                            '<span style="color:#c53030;font-weight:700">⚠️ Discrepancia</span><br>' +
                            'Esperado: <strong>' + esperado.toFixed(2) + '$</strong> / ' +
                            'Recibido: <strong>' + recibido.toFixed(2) + '$</strong> ' +
                            '<span style="color:' + colorBadge + ';font-weight:700">(' + signo + diffAbs.toFixed(2) + '$)</span>' +
                            '</div>';
                    } else if (recibido > 0) {
                        estadoHTML = '<span style="color:#38a169;font-weight:700;font-size:14px">✓</span>' +
                            '<span style="color:#718096;font-size:9px;margin-left:4px">Esp: ' + esperado.toFixed(2) + '$ / Rec: ' + recibido.toFixed(2) + '$</span>';
                    } else {
                        estadoHTML = '<span style="color:#ed8936;font-size:9px">Esp: ' + esperado.toFixed(2) + '$ (sin dólar registrado)</span>';
                    }
                }

                html += '<tr class="' + (tieneValor ? 'cuota-pagada' : 'cuota-pendiente') + '">';
                if (esAdmin) {
                    html += '<td style="text-align:center"><input type="checkbox" name="eliminar-cuota-' + this.cfg.key + '" value="' + i + '" title="Seleccionar para eliminar"></td>';
                }
                html += '<td>' + i + '</td>';
                html += '<td><input type="number" name="cuota_' + i + '" value="' + cuotaBs + '" ' + readonlyAttr + ' step="0.01" onchange="window.Tiendas.get(\'' + this.cfg.key + '\').__recalcularCuotaModal(this, ' + i + ')"></td>';
                html += '<td><input type="text" name="ref_cuota_' + i + '" value="' + (refCuota || '') + '" ' + readonlyAttr + '></td>';
                html += '<td><input type="text" name="fecha_cuota_' + i + '" value="' + this.formatearFechaInput(fechaCuota) + '" ' + disabledAttr + ' class="solo-lectura" placeholder="dd-mm-aaaa" style="text-align:center;font-family:monospace;font-size:12px;"></td>';
                html += '<td><input type="number" name="tasa_cuota_' + i + '" value="' + tasaCuota + '" ' + readonlyAttr + ' step="0.0001" onchange="window.Tiendas.get(\'' + this.cfg.key + '\').__recalcularCuotaModal(this, ' + i + ')"></td>';
                html += '<td><input type="number" name="dolar_cuota_' + i + '" value="' + dolarCuota + '" readonly step="0.01" class="calculado"></td>';
                html += '<td>' + estadoHTML + '</td>';
                html += '</tr>';
            });html += '</tbody></table>';
            if (esAdmin) {
                html += '<div class="barra-eliminar-cuotas" style="display:none;align-items:center;gap:12px;margin:10px 0;padding:10px 14px;background:#fff5f5;border:1px solid #feb2b2;border-radius:8px;">';
                html += '<span style="color:#c53030;font-size:12px;font-weight:600;">⚠️ <span class="conteo-eliminar">0</span> seleccionada(s)</span>';
                html += '<button type="button" onclick="window.Tiendas.get(\'' + this.cfg.key + '\').confirmarEliminarCuotas()" style="margin-left:auto;background:#e53e3e;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">🗑 Borrar Seleccionadas</button>';
                html += '<button type="button" onclick="window.Tiendas.get(\'' + this.cfg.key + '\').__limpiarSeleccionCuotas()" style="background:#e2e8f0;color:#4a5568;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Cancelar</button>';
                html += '</div>';
            }
            html += '<div class="totales-cuotas-modal"><span class="total-bs">' + resumen.totalDepositadoBs.toFixed(2) + ' Bs</span><span class="total-label">Total Depositado en Cuotas</span><span class="total-usd">' + resumen.totalDepositadoUSD.toFixed(2) + ' $</span></div>';
            html += '</div>';
            return html;
        }

        __recalcularCuotaModal(input, numCuota) {
            const fila = input.closest('tr');
            if (!fila) return;
            const montoBs = parseFloat(fila.querySelector('[data-name="cuota_' + numCuota + '"]').value) || 0;
            const tasa = parseFloat(fila.querySelector('[data-name="tasa_cuota_' + numCuota + '"]').value) || 0;
            const dolarInput = fila.querySelector('[data-name="dolar_cuota_' + numCuota + '"]');
            if (montoBs > 0 && tasa > 0) {
                const usd = redondearDecimales(montoBs / tasa);
                if (dolarInput) dolarInput.value = usd.toFixed(2);
            } else {
                if (dolarInput) dolarInput.value = '';
            }
            this.__actualizarTotalesModal();
        }

        __actualizarTotalesModal() {
            const modal = document.getElementById(this.cfg.key + '-modal-v672');
            if (!modal) return;
            let totalBs = 0, totalUSD = 0;
            const inputInicialBs = modal.querySelector('[name="inicial_bs"]');
            const inputInicialUSD = modal.querySelector('[name="inicial_usd"]');
            if (inputInicialBs) totalBs += parseFloat(inputInicialBs.value) || 0;
            if (inputInicialUSD) totalUSD += parseFloat(inputInicialUSD.value) || 0;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuotaBs = modal.querySelector('[data-name="cuota_' + i + '"]');
                const cuotaUSD = modal.querySelector('[data-name="dolar_cuota_' + i + '"]');
                if (cuotaBs) totalBs += parseFloat(cuotaBs.value) || 0;
                if (cuotaUSD) totalUSD += parseFloat(cuotaUSD.value) || 0;
            }
            const totalBsEl = modal.querySelector('.total-bs');
            const totalUsdEl = modal.querySelector('.total-usd');
            if (totalBsEl) totalBsEl.textContent = totalBs.toFixed(2) + ' Bs';
            if (totalUsdEl) totalUsdEl.textContent = totalUSD.toFixed(2) + ' $';
        }

        __mostrarSpinner(mensaje) {
            mensaje = mensaje || 'Cargando...';
            let overlay = document.getElementById('spinner-overlay-v672');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'spinner-overlay-v672';
                overlay.className = 'spinner-overlay hidden';
                overlay.innerHTML = '<div class="spinner-circle"></div><span id="spinner-text-v672"></span>';
                document.body.appendChild(overlay);
            }
            const txt = document.getElementById('spinner-text-v672');
            if (txt) txt.textContent = mensaje;
            overlay.classList.remove('hidden');
        }

        __ocultarSpinner() {
            const overlay = document.getElementById('spinner-overlay-v672');
            if (overlay) overlay.classList.add('hidden');
        }

        __marcarDirty() {
            const self = this;
            self._modalDirty = true;
            const btnGuardar = document.getElementById(self.cfg.key + '-btn-guardar-modal');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.style.opacity = '1';
                btnGuardar.style.cursor = 'pointer';
            }
        }

        __actualizarBarraEliminar() {
            const self = this;
            const modal = document.getElementById(self.cfg.key + '-modal-v672');
            if (!modal) return;
            const checks = modal.querySelectorAll('input[name^="eliminar-cuota-"]');
            const seleccionados = Array.from(checks).filter(chk => chk.checked).length;
            const barra = modal.querySelector('.barra-eliminar-cuotas');
            const conteo = modal.querySelector('.conteo-eliminar');
            if (barra) {
                barra.style.display = seleccionados > 0 ? 'flex' : 'none';
                if (conteo) conteo.textContent = seleccionados;
            }
        }

        limpiarFormularioNuevaConciliacion() {
            const c = (n) => this.el(this.concId(n));
            const setVal = (n, v) => { const el = c(n); if (el) el.value = v; };
            setVal('nueva-nombre', '');
            setVal('nueva-cedula', '');
            setVal('nueva-monto', '');
            setVal('nueva-fecha-factura', new Date().toISOString().split('T')[0]);
            setVal('nueva-cuota-monto', '');
            setVal('nueva-cuota-ref', '');
            setVal('nueva-cuota-tasa', '');
            setVal('nueva-cuota-dolar', '');
            const msg = c('nueva-tasa-mensaje');
            if (msg) msg.textContent = '';
        }

        // ====================================================
        // REPORTES (antes: funciones duplicadas en panel.js
        // para Caracas y Maracaibo; Maracay no existía)
        // ====================================================

        // ============================================================
        // METODOS PARA SECCION REPORTES (reemplazar los actuales)
        // ============================================================

        /**
         * Inicializa la vista de Reportes con la API dinamica v1.0
         * Llamar desde show('reportes') o donde inicialices la seccion
         */
        async initReportesDinamicos() {
            const container = document.getElementById(`${this.cfg.pfx}-reportes-container`);
            if (!container) return;

            // Guardar referencia para paginacion
            this.reportesState = {
                pagina: 1,
                porPagina: 50,
                datos: [],
                resumen: null,
                filtros: {
                    estado: 'todos',
                    fechaDesde: '',
                    fechaHasta: '',
                    minDeuda: '',
                    maxDeuda: '',
                    busqueda: ''
                },
                tipo: 'cartera',
                ordenarPor: 'id',
                orden: 'asc',
                cargando: false
            };

            this._renderReportesUI(container);
            await this._cargarReporteDinamico();
        }

        /**
         * Renderiza la interfaz completa de reportes (filtros + tabla + resumen)
         */
        _renderReportesUI(container) {
            const pfx = this.cfg.pfx;
            const esAdmin = this._esAdmin();

            container.innerHTML = `
                <div class="reportes-dinamicos-wrapper">
                    <!-- HEADER -->
                    <div class="reportes-header">
                        <h3><i class="fas fa-chart-bar"></i> Reportes Dinamicos</h3>
                        <div style="margin-bottom:10px;">
                            <label style="font-size:0.8rem;color:#718096;font-weight:600;margin-right:8px;">TIENDA:</label>
                            <select id="${pfx}-rep-tienda" onchange="Tiendas.get('${this.cfg.key}')._cambiarTiendaReporte(this.value)"
                                style="padding:6px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.9rem;cursor:pointer;">
                                <option value="${this.cfg.key}">${this.cfg.nombre}</option>
                                <option value="todas">TODAS LAS TIENDAS</option>
                            </select>
                        </div>
                        <div class="reportes-tipo-selector">
                            <button class="btn-tipo active" data-tipo="cartera" onclick="Tiendas.get('${this.cfg.key}')._cambiarTipoReporte('cartera')">
                                <i class="fas fa-wallet"></i> Cartera
                            </button>
                            <button class="btn-tipo" data-tipo="cobranza" onclick="Tiendas.get('${this.cfg.key}')._cambiarTipoReporte('cobranza')">
                                <i class="fas fa-hand-holding-usd"></i> Cobranza
                            </button>
                            <button class="btn-tipo" data-tipo="deudores" onclick="Tiendas.get('${this.cfg.key}')._cambiarTipoReporte('deudores')">
                                <i class="fas fa-exclamation-triangle"></i> Deudores
                            </button>
                            <button class="btn-tipo" data-tipo="cuotas" onclick="Tiendas.get('${this.cfg.key}')._cambiarTipoReporte('cuotas')">
                                <i class="fas fa-list-ol"></i> Cuotas
                            </button>
                        </div>
                    </div>

                    <!-- FILTROS -->
                    <div class="reportes-filtros-card">
                        <div class="filtros-grid">
                            <div class="filtro-group">
                                <label>Estado</label>
                                <select id="${pfx}-rep-estado" onchange="Tiendas.get('${this.cfg.key}')._aplicarFiltroReporte('estado', this.value)">
                                    <option value="todos">Todos</option>
                                    <option value="aldia">Al Dia</option>
                                    <option value="deudor">Deudor</option>
                                    <option value="incompleto">Incompleto</option>
                                    <option value="sinpago">Sin Pago</option>
                                </select>
                            </div>
                            <div class="filtro-group">
                                <label>Desde</label>
                                <input type="date" id="${pfx}-rep-fecha-desde" onchange="Tiendas.get('${this.cfg.key}')._aplicarFiltroReporte('fechaDesde', this.value)">
                            </div>
                            <div class="filtro-group">
                                <label>Hasta</label>
                                <input type="date" id="${pfx}-rep-fecha-hasta" onchange="Tiendas.get('${this.cfg.key}')._aplicarFiltroReporte('fechaHasta', this.value)">
                            </div>
                            <div class="filtro-group">
                                <label>Deuda Min (Bs)</label>
                                <input type="number" id="${pfx}-rep-min-deuda" placeholder="0" onchange="Tiendas.get('${this.cfg.key}')._aplicarFiltroReporte('minDeuda', this.value)">
                            </div>
                            <div class="filtro-group">
                                <label>Deuda Max (Bs)</label>
                                <input type="number" id="${pfx}-rep-max-deuda" placeholder="∞" onchange="Tiendas.get('${this.cfg.key}')._aplicarFiltroReporte('maxDeuda', this.value)">
                            </div>
                            <div class="filtro-group">
                                <label>Buscar</label>
                                <input type="text" id="${pfx}-rep-busqueda" placeholder="Nombre o cedula..." oninput="Tiendas.get('${this.cfg.key}')._debounceBusqueda(this.value)">
                            </div>
                        </div>
                        <div class="filtros-actions">
                            <button class="btn btn-primary" onclick="Tiendas.get('${this.cfg.key}')._cargarReporteDinamico()">
                                <i class="fas fa-sync"></i> Actualizar
                            </button>
                            <button class="btn btn-success" onclick="Tiendas.get('${this.cfg.key}')._exportarReporteExcel()">
                                <i class="fas fa-file-excel"></i> Exportar Excel
                            </button>
                            <button class="btn btn-danger" onclick="Tiendas.get('${this.cfg.key}')._exportarReportePDF()" style="background:#e53e3e;color:#fff;">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                            <button class="btn btn-secondary" onclick="Tiendas.get('${this.cfg.key}')._limpiarFiltrosReporte()">
                                <i class="fas fa-eraser"></i> Limpiar
                            </button>
                        </div>
                    </div>

                    <!-- RESUMEN KPIs -->
                    <div id="${pfx}-reportes-resumen" class="reportes-resumen-grid">
                        <!-- Se llena dinamicamente -->
                    </div>

                    <!-- TABLA -->
                    <div class="reportes-tabla-wrapper">
                        <div id="${pfx}-reportes-loading" class="reportes-loading hidden">
                            <i class="fas fa-spinner fa-spin"></i> Cargando reporte...
                        </div>
                        <div id="${pfx}-reportes-tabla-container">
                            <!-- Se llena dinamicamente -->
                        </div>
                        <!-- PAGINACION -->
                        <div id="${pfx}-reportes-paginacion" class="reportes-paginacion">
                            <!-- Se llena dinamicamente -->
                        </div>
                    </div>
                </div>
            `;

            // Inyectar CSS si no existe
            this._injectReportesCSS();
        }

        /**
         * CSS especifico para la seccion de reportes dinamicos
         */
        _injectReportesCSS() {
            if (document.getElementById('reportes-dinamicos-css')) return;

            const style = document.createElement('style');
            style.id = 'reportes-dinamicos-css';
            style.textContent = `
                .reportes-dinamicos-wrapper { padding: 20px; }
                .reportes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
                .reportes-header h3 { margin: 0; color: var(--primary, #1a365d); font-size: 1.4rem; }
                .reportes-tipo-selector { display: flex; gap: 8px; flex-wrap: wrap; }
                .btn-tipo { padding: 8px 16px; border: 2px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
                .btn-tipo:hover { border-color: #3182ce; color: #3182ce; }
                .btn-tipo.active { background: #3182ce; color: #fff; border-color: #3182ce; }
                .btn-tipo i { font-size: 0.85rem; }

                .reportes-filtros-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .filtros-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; margin-bottom: 15px; }
                .filtro-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #4a5568; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.3px; }
                .filtro-group input, .filtro-group select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem; transition: border-color 0.2s; }
                .filtro-group input:focus, .filtro-group select:focus { outline: none; border-color: #3182ce; }
                .filtros-actions { display: flex; gap: 10px; flex-wrap: wrap; }
                .filtros-actions .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
                .btn-primary { background: #3182ce; color: #fff; }
                .btn-primary:hover { background: #2c5282; }
                .btn-success { background: #38a169; color: #fff; }
                .btn-success:hover { background: #2f855a; }
                .btn-secondary { background: #edf2f7; color: #4a5568; }
                .btn-secondary:hover { background: #e2e8f0; }

                .reportes-resumen-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                .kpi-card { background: linear-gradient(135deg, #fff 0%, #f7fafc 100%); border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s; }
                .kpi-card:hover { transform: translateY(-2px); }
                .kpi-card.primary { border-left: 4px solid #3182ce; }
                .kpi-card.success { border-left: 4px solid #38a169; }
                .kpi-card.warning { border-left: 4px solid #ed8936; }
                .kpi-card.danger { border-left: 4px solid #e53e3e; }
                .kpi-card.info { border-left: 4px solid #63b3ed; }
                .kpi-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; font-weight: 600; margin-bottom: 6px; }
                .kpi-value { font-size: 1.5rem; font-weight: 700; color: #2d3748; line-height: 1.2; }
                .kpi-sub { font-size: 0.8rem; color: #a0aec0; margin-top: 4px; }
                .kpi-porcentaje { font-size: 0.85rem; font-weight: 600; margin-top: 4px; }
                .kpi-porcentaje.positivo { color: #38a169; }
                .kpi-porcentaje.negativo { color: #e53e3e; }

                .reportes-tabla-wrapper { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
                .reportes-loading { padding: 40px; text-align: center; color: #718096; font-size: 1rem; }
                .reportes-loading.hidden { display: none; }
                .reportes-loading i { margin-right: 8px; }
                .reportes-tabla { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .reportes-tabla th { background: #edf2f7; padding: 12px 14px; text-align: left; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0; white-space: nowrap; cursor: pointer; user-select: none; }
                .reportes-tabla th:hover { background: #e2e8f0; }
                .reportes-tabla th .sort-icon { margin-left: 4px; opacity: 0.5; font-size: 0.7rem; }
                .reportes-tabla td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #4a5568; }
                .reportes-tabla tr:hover { background: #f7fafc; }
                .reportes-tabla .num { text-align: right; font-family: 'Consolas', monospace; }
                .reportes-tabla .estado-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
                .estado-aldia { background: #c6f6d5; color: #22543d; }
                .estado-deudor { background: #fed7d7; color: #742a2a; }
                .estado-incompleto { background: #feebc8; color: #744210; }
                .estado-sinpago { background: #e2e8f0; color: #4a5568; }
                .reportes-tabla .acciones { display: flex; gap: 6px; }
                .reportes-tabla .btn-icon { padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 0.8rem; }
                .btn-ver { background: #ebf8ff; color: #3182ce; }
                .btn-ver:hover { background: #bee3f8; }

                .reportes-paginacion { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #f7fafc; border-top: 1px solid #e2e8f0; }
                .pag-info { font-size: 0.85rem; color: #718096; }
                .pag-botones { display: flex; gap: 6px; }
                .pag-botones button { padding: 6px 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
                .pag-botones button:hover:not(:disabled) { background: #edf2f7; }
                .pag-botones button:disabled { opacity: 0.5; cursor: not-allowed; }
                .pag-botones .pag-activa { background: #3182ce; color: #fff; border-color: #3182ce; }

                .reportes-empty { padding: 60px 20px; text-align: center; color: #a0aec0; }
                .reportes-empty i { font-size: 3rem; margin-bottom: 15px; display: block; }
                .reportes-empty p { font-size: 1rem; margin: 0; }

                @media (max-width: 768px) {
                    .reportes-header { flex-direction: column; align-items: flex-start; }
                    .filtros-grid { grid-template-columns: 1fr; }
                    .reportes-resumen-grid { grid-template-columns: 1fr 1fr; }
                    .reportes-tabla { font-size: 0.8rem; }
                    .reportes-tabla th, .reportes-tabla td { padding: 8px 10px; }
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * Carga el reporte desde la API v1.0
         */
        async _cargarReporteDinamico() {
            const state = this.reportesState;
            if (state.cargando) return;

            state.cargando = true;
            this._mostrarLoadingReportes(true);

            try {
                const token = localStorage.getItem('token');
                const esConsolidado = state.tiendaSeleccionada === 'todas';
                const endpoint = esConsolidado ? '/api/reportes/v1/generar-consolidado' : '/api/reportes/v1/generar';

                const body = esConsolidado ? {
                    tiendas: ['caracas', 'maracay', 'maracaibo'],
                    tipo: state.tipo,
                    formato: 'json',
                    filtros: { ...state.filtros },
                    ordenarPor: state.ordenarPor,
                    orden: state.orden,
                    pagina: state.pagina,
                    porPagina: state.porPagina
                } : {
                    tienda: this.cfg.key,
                    tipo: state.tipo,
                    formato: 'json',
                    filtros: { ...state.filtros },
                    ordenarPor: state.ordenarPor,
                    orden: state.orden,
                    pagina: state.pagina,
                    porPagina: state.porPagina
                };

                // Limpiar filtros vacios
                Object.keys(body.filtros).forEach(k => {
                    if (body.filtros[k] === '' || body.filtros[k] === null || body.filtros[k] === undefined) {
                        delete body.filtros[k];
                    }
                });

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (!data.exito) {
                    throw new Error(data.error || 'Error al cargar reporte');
                }

                state.datos = data.datos || [];
                state.resumen = data.resumen || null;
                state.totalRegistros = data.totalRegistros || 0;
                state.totalPaginas = data.totalPaginas || 1;

                this._renderResumenKPIs();
                this._renderTablaReportes();
                this._renderPaginacion();

            } catch (error) {
                console.error('[Reportes Dinamicos] Error:', error);
                this._mostrarErrorReportes(error.message);
            } finally {
                state.cargando = false;
                this._mostrarLoadingReportes(false);
            }
        }

        /**
         * Renderiza las tarjetas de resumen segun el tipo de reporte
         */
        _renderResumenKPIs() {
            const container = document.getElementById(`${this.cfg.pfx}-reportes-resumen`);
            if (!container || !this.reportesState.resumen) return;

            const r = this.reportesState.resumen;
            const tipo = this.reportesState.tipo;
            let html = '';

            if (tipo === 'cartera') {
                html = `
                    <div class="kpi-card primary">
                        <div class="kpi-label">Total Registros</div>
                        <div class="kpi-value">${this._fmtNum(r.totalRegistros)}</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Facturado (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalFacturadoBs)}</div>
                        <div class="kpi-sub">$${this._fmtCurrency(r.totalFacturadoUSD || 0)}</div>
                    </div>
                    <div class="kpi-card success">
                        <div class="kpi-label">Depositado (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalDepositadoBs)}</div>
                        <div class="kpi-sub">$${this._fmtCurrency(r.totalDepositadoUSD || 0)}</div>
                    </div>
                    <div class="kpi-card warning">
                        <div class="kpi-label">Deuda Pendiente (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalDeudaBs)}</div>
                        <div class="kpi-sub">$${this._fmtCurrency(r.totalDeudaUSD || 0)}</div>
                    </div>
                    <div class="kpi-card ${r.porcentajeRecuperacion >= 70 ? 'success' : r.porcentajeRecuperacion >= 40 ? 'warning' : 'danger'}">
                        <div class="kpi-label">% Recuperacion</div>
                        <div class="kpi-value">${r.porcentajeRecuperacion}%</div>
                        <div class="kpi-porcentaje ${r.porcentajeRecuperacion >= 70 ? 'positivo' : 'negativo'}">
                            ${r.clientesAlDia || 0} al dia / ${r.clientesDeudores || 0} deudores
                        </div>
                    </div>
                `;
            } else if (tipo === 'cobranza') {
                html = `
                    <div class="kpi-card primary">
                        <div class="kpi-label">Total Registros</div>
                        <div class="kpi-value">${this._fmtNum(r.totalRegistros)}</div>
                    </div>
                    <div class="kpi-card success">
                        <div class="kpi-label">Cuotas Pagadas</div>
                        <div class="kpi-value">${this._fmtNum(r.totalCuotasPagadas)} / ${this._fmtNum(r.totalCuotasTotales)}</div>
                        <div class="kpi-porcentaje positivo">${r.porcentajeCuotasPagadas}%</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Depositado (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalDepositadoBs)}</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Depositado ($)</div>
                        <div class="kpi-value">$${this._fmtCurrency(r.totalDepositadoUSD)}</div>
                    </div>
                `;
            } else if (tipo === 'deudores') {
                html = `
                    <div class="kpi-card danger">
                        <div class="kpi-label">Deudores Totales</div>
                        <div class="kpi-value">${this._fmtNum(r.totalRegistros)}</div>
                    </div>
                    <div class="kpi-card warning">
                        <div class="kpi-label">Deuda Total (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalDeudaBs)}</div>
                        <div class="kpi-sub">$${this._fmtCurrency(r.totalDeudaUSD || 0)}</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Deuda Promedio (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.promedioDeudaBs)}</div>
                    </div>
                    <div class="kpi-card ${(r.moraPromedioDias || 0) > 60 ? 'danger' : 'warning'}">
                        <div class="kpi-label">Mora Promedio</div>
                        <div class="kpi-value">${r.moraPromedioDias} dias</div>
                    </div>
                `;
            } else if (tipo === 'cuotas') {
                html = `
                    <div class="kpi-card primary">
                        <div class="kpi-label">Registros</div>
                        <div class="kpi-value">${this._fmtNum(r.totalRegistros)}</div>
                    </div>
                    <div class="kpi-card success">
                        <div class="kpi-label">Pagos Registrados</div>
                        <div class="kpi-value">${this._fmtNum(r.totalPagosRegistrados)}</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Monto Pagado (Bs)</div>
                        <div class="kpi-value">${this._fmtCurrency(r.totalMontoPagadoBs)}</div>
                    </div>
                    <div class="kpi-card info">
                        <div class="kpi-label">Monto Pagado ($)</div>
                        <div class="kpi-value">$${this._fmtCurrency(r.totalMontoPagadoUSD)}</div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        /**
         * Renderiza la tabla segun el tipo de reporte
         */
        _renderTablaReportes() {
            const container = document.getElementById(`${this.cfg.pfx}-reportes-tabla-container`);
            if (!container) return;

            const datos = this.reportesState.datos;
            const tipo = this.reportesState.tipo;
            const esConsolidado = this.reportesState.tiendaSeleccionada === 'todas';

            if (datos.length === 0) {
                container.innerHTML = `
                    <div class="reportes-empty">
                        <i class="fas fa-inbox"></i>
                        <p>No se encontraron registros con los filtros aplicados.</p>
                    </div>
                `;
                return;
            }

            let html = '<table class="reportes-tabla"><thead><tr>';
            let bodyHtml = '<tbody>';

            if (tipo === 'cartera') {
                html += `
                    <th class="num">#</th>
                    ${esConsolidado ? '<th>Tienda</th>' : ''}
                    <th onclick="Tiendas.get('${this.cfg.key}')._ordenarPor('factura')">Factura <span class="sort-icon">↕</span></th>
                    <th onclick="Tiendas.get('${this.cfg.key}')._ordenarPor('nombre')">Cliente <span class="sort-icon">↕</span></th>
                    <th onclick="Tiendas.get('${this.cfg.key}')._ordenarPor('cedula')">Cedula <span class="sort-icon">↕</span></th>
                    <th class="num">Monto (Bs)</th>
                    <th class="num">Depositado (Bs)</th>
                    <th class="num">Deuda (Bs)</th>
                    <th>Estado</th>
                    <th class="num">Cuotas</th>
                    <th>Banco</th>
                    <th>Acciones</th>
                </tr></thead>`;

                datos.forEach((d, index) => {
                    const estadoClass = d.estado === 'Al dia' ? 'estado-aldia' : 'estado-deudor';
                    const numCorrelativo = (this.reportesState.pagina - 1) * this.reportesState.porPagina + index + 1;
                    const tiendaColor = d.tienda === 'caracas' ? '#27ae60' : d.tienda === 'maracay' ? '#7c5cbf' : '#e67e22';
                    const bancoDetectado = d.banco || (d.numeroCuenta ? this._detectarBanco(d.numeroCuenta) : '-');

                    bodyHtml += `
                        <tr>
                            <td class="num">${numCorrelativo}</td>
                            ${esConsolidado ? `<td><span class="estado-badge" style="background:${tiendaColor};color:#fff;">${d.tiendaNombre || d.tienda || ''}</span></td>` : ''}
                            <td>${this._escapeHtml(d.factura || '')}</td>
                            <td>${this._escapeHtml(d.cliente || '')}</td>
                            <td>${this._escapeHtml(d.cedula || '')}</td>
                            <td class="num">${this._fmtCurrency(d.montoBs)}</td>
                            <td class="num">${this._fmtCurrency(d.depositadoBs)}</td>
                            <td class="num" style="color:${d.deudaBs > 0 ? '#e53e3e' : '#38a169'};font-weight:600;">${this._fmtCurrency(d.deudaBs)}</td>
                            <td><span class="estado-badge ${estadoClass}">${d.estado}</span></td>
                            <td class="num">${d.cuotasPagadas || 0}/${d.cuotas || 0}</td>
                            <td>${this._escapeHtml(bancoDetectado)}</td>
                            <td>
                                <div class="acciones">
                                    <button class="btn-icon btn-ver" onclick="Tiendas.get('${this.cfg.key}').verDetalle(${d.id})" title="Ver detalle">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            } else if (tipo === 'cobranza') {
                html += `
                    <th class="num">#</th>
                    ${esConsolidado ? '<th>Tienda</th>' : ''}
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Cedula</th>
                    <th class="num">% Pagado</th>
                    <th class="num">Cuotas</th>
                    <th class="num">Depositado (Bs)</th>
                    <th class="num">Deuda (Bs)</th>
                    <th>Acciones</th>
                </tr></thead>`;

                datos.forEach((d, index) => {
                    const numCorrelativo = (this.reportesState.pagina - 1) * this.reportesState.porPagina + index + 1;
                    const pct = d.porcentajePagado || 0;
                    const colorPct = pct >= 80 ? '#38a169' : pct >= 50 ? '#ed8936' : '#e53e3e';
                    const tiendaColor = d.tienda === 'caracas' ? '#27ae60' : d.tienda === 'maracay' ? '#7c5cbf' : '#e67e22';

                    bodyHtml += `
                        <tr>
                            <td class="num">${numCorrelativo}</td>
                            ${esConsolidado ? `<td><span class="estado-badge" style="background:${tiendaColor};color:#fff;">${d.tiendaNombre || d.tienda || ''}</span></td>` : ''}
                            <td>${this._escapeHtml(d.factura || '')}</td>
                            <td>${this._escapeHtml(d.cliente || '')}</td>
                            <td>${this._escapeHtml(d.cedula || '')}</td>
                            <td class="num" style="color:${colorPct};font-weight:600;">${pct}%</td>
                            <td class="num">${d.cuotasPagadas}/${d.cuotasTotales}</td>
                            <td class="num">${this._fmtCurrency(d.totalDepositadoBs)}</td>
                            <td class="num">${this._fmtCurrency(d.deudaRestanteBs)}</td>
                            <td>
                                <button class="btn-icon btn-ver" onclick="Tiendas.get('${this.cfg.key}').verDetalle(${d.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else if (tipo === 'deudores') {
                html += `
                    <th class="num">#</th>
                    ${esConsolidado ? '<th>Tienda</th>' : ''}
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Cedula</th>
                    <th>Telefono</th>
                    <th class="num">Deuda (Bs)</th>
                    <th class="num">Deuda ($)</th>
                    <th class="num">Mora (dias)</th>
                    <th>Banco</th>
                    <th>Acciones</th>
                </tr></thead>`;

                datos.forEach((d, index) => {
                    const numCorrelativo = (this.reportesState.pagina - 1) * this.reportesState.porPagina + index + 1;
                    const moraColor = (d.diasSinPago || 0) > 60 ? '#e53e3e' : (d.diasSinPago || 0) > 30 ? '#ed8936' : '#718096';
                    const tiendaColor = d.tienda === 'caracas' ? '#27ae60' : d.tienda === 'maracay' ? '#7c5cbf' : '#e67e22';
                    const bancoDetectado = d.banco || (d.numeroCuenta ? this._detectarBanco(d.numeroCuenta) : '-');

                    bodyHtml += `
                        <tr>
                            <td class="num">${numCorrelativo}</td>
                            ${esConsolidado ? `<td><span class="estado-badge" style="background:${tiendaColor};color:#fff;">${d.tiendaNombre || d.tienda || ''}</span></td>` : ''}
                            <td>${this._escapeHtml(d.factura || '')}</td>
                            <td>${this._escapeHtml(d.cliente || '')}</td>
                            <td>${this._escapeHtml(d.cedula || '')}</td>
                            <td>${this._escapeHtml(d.telefono || '')}</td>
                            <td class="num" style="color:#e53e3e;font-weight:600;">${this._fmtCurrency(d.deudaBs)}</td>
                            <td class="num">$${this._fmtCurrency(d.deudaUSD)}</td>
                            <td class="num" style="color:${moraColor};font-weight:600;">${d.diasSinPago || 0}</td>
                            <td>${this._escapeHtml(bancoDetectado)}</td>
                            <td>
                                <button class="btn-icon btn-ver" onclick="Tiendas.get('${this.cfg.key}').verDetalle(${d.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            } else if (tipo === 'cuotas') {
                html += `
                    <th class="num">#</th>
                    ${esConsolidado ? '<th>Tienda</th>' : ''}
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Cedula</th>
                    <th class="num">Monto Factura</th>
                    <th class="num">Cuotas</th>
                    <th class="num">Pagos Registrados</th>
                    <th>Acciones</th>
                </tr></thead>`;

                datos.forEach((d, index) => {
                    const numCorrelativo = (this.reportesState.pagina - 1) * this.reportesState.porPagina + index + 1;
                    const numPagos = d.pagos ? d.pagos.length : 0;
                    const tiendaColor = d.tienda === 'caracas' ? '#27ae60' : d.tienda === 'maracay' ? '#7c5cbf' : '#e67e22';

                    bodyHtml += `
                        <tr>
                            <td class="num">${numCorrelativo}</td>
                            ${esConsolidado ? `<td><span class="estado-badge" style="background:${tiendaColor};color:#fff;">${d.tiendaNombre || d.tienda || ''}</span></td>` : ''}
                            <td>${this._escapeHtml(d.factura || '')}</td>
                            <td>${this._escapeHtml(d.cliente || '')}</td>
                            <td>${this._escapeHtml(d.cedula || '')}</td>
                            <td class="num">${this._fmtCurrency(d.montoFacturaBs)}</td>
                            <td class="num">${d.cuotasTotales}</td>
                            <td class="num">${numPagos}</td>
                            <td>
                                <button class="btn-icon btn-ver" onclick="Tiendas.get('${this.cfg.key}').verDetalle(${d.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            bodyHtml += '</tbody></table>';
            container.innerHTML = html + bodyHtml;
        }

        _renderPaginacion() {
            const container = document.getElementById(`${this.cfg.pfx}-reportes-paginacion`);
            if (!container) return;

            const state = this.reportesState;
            const total = state.totalRegistros || 0;
            const pagina = state.pagina || 1;
            const porPagina = state.porPagina || 50;
            const totalPaginas = state.totalPaginas || 1;

            if (totalPaginas <= 1) {
                container.innerHTML = `<div class="pag-info">Mostrando ${total} registros</div>`;
                return;
            }

            let botones = '';
            const maxBotones = 5;
            let inicio = Math.max(1, pagina - Math.floor(maxBotones / 2));
            let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
            if (fin - inicio < maxBotones - 1) inicio = Math.max(1, fin - maxBotones + 1);

            botones += `<button onclick="Tiendas.get('${this.cfg.key}')._cambiarPagina(${pagina - 1})" ${pagina <= 1 ? 'disabled' : ''}>← Ant</button>`;

            for (let i = inicio; i <= fin; i++) {
                botones += `<button class="${i === pagina ? 'pag-activa' : ''}" onclick="Tiendas.get('${this.cfg.key}')._cambiarPagina(${i})">${i}</button>`;
            }

            botones += `<button onclick="Tiendas.get('${this.cfg.key}')._cambiarPagina(${pagina + 1})" ${pagina >= totalPaginas ? 'disabled' : ''}>Sig →</button>`;

            container.innerHTML = `
                <div class="pag-info">${(pagina - 1) * porPagina + 1} - ${Math.min(pagina * porPagina, total)} de ${total}</div>
                <div class="pag-botones">${botones}</div>
            `;
        }

        // ============================================================
        // ACCIONES DE FILTROS Y NAVEGACION
        // ============================================================

        _cambiarTiendaReporte(tienda) {
            this.reportesState.tiendaSeleccionada = tienda;
            this.reportesState.pagina = 1;
            this.reportesState.datos = [];
            this.reportesState.resumen = null;
            this._cargarReporteDinamico();
        }

        _cambiarTipoReporte(tipo) {
            this.reportesState.tipo = tipo;
            this.reportesState.pagina = 1;
            this.reportesState.datos = [];
            this.reportesState.resumen = null;

            // Actualizar botones activos
            const container = document.getElementById(`${this.cfg.pfx}-reportes-container`);
            if (container) {
                container.querySelectorAll('.btn-tipo').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tipo === tipo);
                });
            }

            this._cargarReporteDinamico();
        }

        _aplicarFiltroReporte(campo, valor) {
            this.reportesState.filtros[campo] = valor;
            this.reportesState.pagina = 1;
        }

        _debounceBusqueda(valor) {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._aplicarFiltroReporte('busqueda', valor);
                this._cargarReporteDinamico();
            }, 500);
        }

        _limpiarFiltrosReporte() {
            const pfx = this.cfg.pfx;
            this.reportesState.filtros = {
                estado: 'todos',
                fechaDesde: '',
                fechaHasta: '',
                minDeuda: '',
                maxDeuda: '',
                busqueda: ''
            };
            this.reportesState.pagina = 1;

            // Limpiar inputs
            const estado = document.getElementById(`${pfx}-rep-estado`);
            const fechaDesde = document.getElementById(`${pfx}-rep-fecha-desde`);
            const fechaHasta = document.getElementById(`${pfx}-rep-fecha-hasta`);
            const minDeuda = document.getElementById(`${pfx}-rep-min-deuda`);
            const maxDeuda = document.getElementById(`${pfx}-rep-max-deuda`);
            const busqueda = document.getElementById(`${pfx}-rep-busqueda`);

            if (estado) estado.value = 'todos';
            if (fechaDesde) fechaDesde.value = '';
            if (fechaHasta) fechaHasta.value = '';
            if (minDeuda) minDeuda.value = '';
            if (maxDeuda) maxDeuda.value = '';
            if (busqueda) busqueda.value = '';

            this._cargarReporteDinamico();
        }

        _ordenarPor(campo) {
            const state = this.reportesState;
            if (state.ordenarPor === campo) {
                state.orden = state.orden === 'asc' ? 'desc' : 'asc';
            } else {
                state.ordenarPor = campo;
                state.orden = 'asc';
            }
            this._cargarReporteDinamico();
        }

        _cambiarPagina(pagina) {
            const state = this.reportesState;
            const totalPaginas = state.totalPaginas || 1;

            if (pagina < 1) pagina = 1;
            if (pagina > totalPaginas) pagina = totalPaginas;
            if (pagina === state.pagina) return;

            state.pagina = pagina;
            this._cargarReporteDinamico();
        }

        // ============================================================
        // EXPORTACION
        // ============================================================

        async _exportarReporteExcel() {
            const state = this.reportesState;
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
            btn.disabled = true;

            try {
                const token = localStorage.getItem('token');
                const esConsolidado = state.tiendaSeleccionada === 'todas';
                const endpoint = esConsolidado ? '/api/reportes/v1/generar-consolidado' : '/api/reportes/v1/generar';

                const body = esConsolidado ? {
                    tiendas: ['caracas', 'maracay', 'maracaibo'],
                    tipo: state.tipo,
                    formato: 'json',
                    filtros: { ...state.filtros },
                    ordenarPor: state.ordenarPor,
                    orden: state.orden,
                    pagina: state.pagina,
                    porPagina: state.porPagina
                } : {
                    tienda: this.cfg.key,
                    tipo: state.tipo,
                    formato: 'excel',
                    filtros: { ...state.filtros },
                    ordenarPor: state.ordenarPor,
                    orden: state.orden
                };

                Object.keys(body.filtros).forEach(k => {
                    if (body.filtros[k] === '' || body.filtros[k] === null || body.filtros[k] === undefined) {
                        delete body.filtros[k];
                    }
                });

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Error al exportar');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte_${state.tipo}_${this.cfg.key}_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                if (typeof showToast === 'function') {
                    showToast('Excel descargado correctamente', 'success');
                }

            } catch (error) {
                console.error('[Exportar Excel] Error:', error);
                if (typeof showToast === 'function') {
                    showToast('Error al exportar: ' + error.message, 'error');
                } else {
                    alert('Error al exportar: ' + error.message);
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // ============================================================
        // HELPERS UI
        // ============================================================


        async _exportarReportePDF() {
        const state = this.reportesState;

        if (state.totalRegistros === 0) {
            if (typeof showToast === 'function') showToast('No hay datos para exportar', 'warning');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            if (typeof showToast === 'function') showToast('Libreria PDF no disponible. Recargue la pagina.', 'error');
            return;
        }

        // Mostrar loading
        this._mostrarLoadingReportes(true);

        try {
            const token = localStorage.getItem('token');
            const esConsolidado = state.tiendaSeleccionada === 'todas';
            const endpoint = esConsolidado ? '/api/reportes/v1/generar-consolidado' : '/api/reportes/v1/generar';

            // Traer TODOS los registros sin paginacion para el PDF
            const body = esConsolidado ? {
                tiendas: ['caracas', 'maracay', 'maracaibo'],
                tipo: state.tipo,
                formato: 'json',
                filtros: { ...state.filtros },
                ordenarPor: state.ordenarPor,
                orden: state.orden,
                pagina: 1,
                porPagina: 10000  // Traer todo
            } : {
                tienda: this.cfg.key,
                tipo: state.tipo,
                formato: 'json',
                filtros: { ...state.filtros },
                ordenarPor: state.ordenarPor,
                orden: state.orden,
                pagina: 1,
                porPagina: 10000  // Traer todo
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!data.exito) {
                throw new Error(data.error || 'Error al cargar datos');
            }

            const todosDatos = data.datos || [];
            const resumen = data.resumen || {};

            this._generarPDF(todosDatos, resumen, state.tipo, state.tiendaSeleccionada);

            if (typeof showToast === 'function') showToast(`PDF generado con ${todosDatos.length} registros`, 'success');

        } catch (error) {
            console.error('[Exportar PDF] Error:', error);
            if (typeof showToast === 'function') showToast('Error al generar PDF: ' + error.message, 'error');
        } finally {
            this._mostrarLoadingReportes(false);
        }
    }

    _generarPDF(datos, resumen, tipo, tiendaSeleccionada) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        const tiendaNombre = tiendaSeleccionada === 'todas' ? 'TODAS LAS TIENDAS' : this.cfg.nombre;
        const tipoReporte = tipo.toUpperCase();

        // Titulo
        doc.setFontSize(18);
        doc.setTextColor(26, 54, 93);
        doc.text(`Reporte de ${tipoReporte} - ${tiendaNombre}`, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, 14, 28);
        doc.text(`Total registros: ${datos.length}`, 14, 33);

        // Resumen
        if (resumen.totalFacturadoBs) {
            doc.text(`Facturado: ${this._fmtCurrency(resumen.totalFacturadoBs)} Bs`, 14, 38);
        }
        if (resumen.totalDeudaBs) {
            doc.text(`Deuda: ${this._fmtCurrency(resumen.totalDeudaBs)} Bs`, 80, 38);
        }

        // Preparar datos para tabla
        const esConsolidado = tiendaSeleccionada === 'todas';
        let headers, rows;

        if (tipo === 'cartera') {
            headers = esConsolidado 
                ? ['#', 'Tienda', 'Factura', 'Cliente', 'Cedula', 'Monto Bs', 'Depositado Bs', 'Deuda Bs', 'Deuda $', 'Estado', 'Cuotas', 'Banco']
                : ['#', 'Factura', 'Cliente', 'Cedula', 'Monto Bs', 'Depositado Bs', 'Deuda Bs', 'Deuda $', 'Estado', 'Cuotas', 'Banco'];
            rows = datos.map((d, i) => {
                const base = [
                    i + 1,
                    d.factura || '',
                    (d.cliente || '').substring(0, 25),
                    d.cedula || '',
                    this._fmtCurrency(d.montoBs),
                    this._fmtCurrency(d.depositadoBs),
                    this._fmtCurrency(d.deudaBs),
                    this._fmtCurrency(d.deudaUSD),
                    d.estado || '',
                    `${d.cuotasPagadas || 0}/${d.cuotas || 0}`,
                    d.banco || (d.numeroCuenta ? this._detectarBanco(d.numeroCuenta) : '-')
                ];
                if (esConsolidado) base.splice(1, 0, d.tiendaNombre || d.tienda || '');
                return base;
            });
        } else if (tipo === 'deudores') {
            headers = esConsolidado
                ? ['#', 'Tienda', 'Factura', 'Cliente', 'Cedula', 'Deuda Bs', 'Deuda $', 'Mora dias', 'Banco']
                : ['#', 'Factura', 'Cliente', 'Cedula', 'Deuda Bs', 'Deuda $', 'Mora dias', 'Banco'];
            rows = datos.map((d, i) => {
                const base = [
                    i + 1,
                    d.factura || '',
                    (d.cliente || '').substring(0, 25),
                    d.cedula || '',
                    this._fmtCurrency(d.deudaBs),
                    this._fmtCurrency(d.deudaUSD),
                    d.diasSinPago || 0,
                    d.banco || (d.numeroCuenta ? this._detectarBanco(d.numeroCuenta) : '-')
                ];
                if (esConsolidado) base.splice(1, 0, d.tiendaNombre || d.tienda || '');
                return base;
            });
        } else if (tipo === 'cobranza') {
            headers = esConsolidado
                ? ['#', 'Tienda', 'Factura', 'Cliente', 'Cedula', '% Pagado', 'Cuotas', 'Depositado Bs', 'Deuda Bs']
                : ['#', 'Factura', 'Cliente', 'Cedula', '% Pagado', 'Cuotas', 'Depositado Bs', 'Deuda Bs'];
            rows = datos.map((d, i) => {
                const base = [
                    i + 1,
                    d.factura || '',
                    (d.cliente || '').substring(0, 25),
                    d.cedula || '',
                    (d.porcentajePagado || 0) + '%',
                    `${d.cuotasPagadas || 0}/${d.cuotasTotales || 0}`,
                    this._fmtCurrency(d.totalDepositadoBs),
                    this._fmtCurrency(d.deudaRestanteBs)
                ];
                if (esConsolidado) base.splice(1, 0, d.tiendaNombre || d.tienda || '');
                return base;
            });
        } else {
            headers = ['#', 'Factura', 'Cliente', 'Cedula'];
            rows = datos.map((d, i) => [
                i + 1,
                d.factura || '',
                (d.cliente || '').substring(0, 25),
                d.cedula || ''
            ]);
        }

        // Generar tabla con autoTable
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: 45,
                theme: 'striped',
                headStyles: { fillColor: [26, 54, 93], textColor: 255, fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                margin: { top: 45, left: 10, right: 10 },
                didDrawPage: function(data) {
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(`Inversora IPSFA - Pagina ${data.pageNumber}`, 14, doc.internal.pageSize.getHeight() - 10);
                }
            });
        } else {
            // Fallback sin autoTable
            let y = 45;
            doc.setFontSize(8);
            rows.forEach((row) => {
                if (y > 180) { doc.addPage(); y = 20; }
                doc.text(row.join(' | '), 10, y);
                y += 5;
            });
        }

        doc.save(`reporte_${tipo}_${tiendaNombre.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

        _mostrarLoadingReportes(mostrar) {
            const el = document.getElementById(`${this.cfg.pfx}-reportes-loading`);
            if (el) el.classList.toggle('hidden', !mostrar);
        }

        _mostrarErrorReportes(mensaje) {
            const container = document.getElementById(`${this.cfg.pfx}-reportes-tabla-container`);
            if (container) {
                container.innerHTML = `
                    <div class="reportes-empty" style="color:#e53e3e;">
                        <i class="fas fa-exclamation-circle"></i>
                        <p><strong>Error:</strong> ${this._escapeHtml(mensaje)}</p>
                        <button class="btn btn-primary" onclick="Tiendas.get('${this.cfg.key}')._cargarReporteDinamico()" style="margin-top:15px;">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                    </div>
                `;
            }
        }

        _fmtCurrency(valor) {
            if (valor === undefined || valor === null) return '0,00';
            const num = parseFloat(valor);
            if (isNaN(num)) return '0,00';
            return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        _fmtNum(valor) {
            if (valor === undefined || valor === null) return '0';
            const num = parseFloat(valor);
            if (isNaN(num)) return '0';
            return num.toLocaleString('es-VE');
        }

        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        _detectarBanco(numeroCuenta) {
            const limpio = String(numeroCuenta || '').replace(/\D/g, '');
            if (limpio.length < 4) return '';
            const BANCOS_VENEZUELA = {
                '0102': 'Banco de Venezuela', '0104': 'Venezolano de Crédito',
                '0105': 'Banco Mercantil', '0108': 'BBVA Provincial',
                '0114': 'Bancaribe', '0115': 'Banco Exterior',
                '0128': 'Banco Caroní', '0134': 'Banesco',
                '0137': 'Banco Sofitasa', '0138': 'Banco Plaza',
                '0146': 'Bangente', '0151': 'BFC Banco Fondo Común',
                '0156': '100% Banco', '0157': 'DelSur',
                '0163': 'Banco del Tesoro', '0166': 'B.A.C.',
                '0168': 'Bancrecer', '0169': 'Mi Banco',
                '0171': 'Banco Activo', '0172': 'Bancamiga',
                '0173': 'Banco Internacional de Desarrollo', '0174': 'Banplus',
                '0175': 'Banco Bicentenario', '0176': 'N59 Banco Digital',
                '0177': 'BANFANB', '0178': 'N53 Banco de los Trabajadores',
                '0191': 'BNC', '0601': 'IMCP'
            };
            return BANCOS_VENEZUELA[limpio.substring(0, 4)] || 'Otro';
        }

        _esAdmin() {
            try {
                const user = JSON.parse(localStorage.getItem('usuario') || '{}');
                return user.rol === 'administrador';
            } catch (e) { return false; }
        }

        attachEvents(container) {
            // v6.7.3-fix: Logging para diagnosticar clics
            console.log(`[Tiendas] attachEvents montado en tienda ${this.cfg.key}, container #${this.cfg.contentId}`);

            // --- CLICK ---
            container.addEventListener('click', (ev) => {
                const target = ev.target.closest('[data-action]');
                if (!target) {
                    // Si no hay data-action, verificar si el clic fue en una tarjeta con onclick
                    return;
                }

                const action = target.dataset.action;
                const id = target.dataset.id ? parseInt(target.dataset.id) : null;

                switch (action) {
                    case 'show-menu': this.showView('menu'); break;
                    case 'show-base-datos': this.showView('baseDatos'); break;
                    case 'show-conciliaciones': this.showView('conciliaciones'); break;
                    case 'show-reportes': this.showView('reportes'); break;
                    case 'ver-morosos':
                        this._filtroPendiente = 'morosos';
                        this.showView('baseDatos');
                        break;
                    case 'ver-sin-cuota-mes':
                        this._filtroPendiente = 'sin-cuota-mes';
                        this.showView('baseDatos');
                        break;
                    case 'qa-nuevo-cliente': // v6.5 — acceso rápido del menú
                        this.showView('conciliaciones');
                        this.mostrarFormularioNuevoRegistro();
                        break;
                    case 'ir-estadisticas':
                        if (typeof window.mostrarSeccion === 'function') {
                            window.mostrarSeccion('estadisticas', this.cfg.key);
                        }
                        break;

                    case 'quick-filter': this.applyQuickFilter(target.dataset.filter); break;
                    case 'apply-filters': this.applyFilters(); break;
                    case 'clear-filters': this.clearFilters(); break;
                    case 'goto-page': this.goToPage(target.dataset.page); break;

                    case 'ver-detalle': if (id) this.verDetalle(id); break;
                    case 'confirmar-eliminar': if (id) this.confirmarEliminarCliente(id); break;
                    case 'export-excel': this.exportToExcel(); break;
                    case 'export-pdf': this.exportToPDF(); break;
                    case 'print-table': this.printTable(); break;

                    case 'buscar-factura': this.buscarFactura(); break;
                    case 'mostrar-nuevo-registro': this.mostrarFormularioNuevoRegistro(); break;
                    case 'guardar-cuota': this.guardarCuota(); break;
                    case 'guardar-nueva-conciliacion': this.guardarNuevaConciliacion(); break;
                    case 'volver-buscar-factura': this.volverABuscarFactura(); break;

                    case 'generar-reporte': this._cargarReporteDinamico(); break;
                    case 'limpiar-reporte': this._limpiarFiltrosReporte(); break;
                    case 'rep-goto-page': this._cambiarPagina(parseInt(target.dataset.page)); break;
                    case 'exportar-reporte-excel': this._exportarReporteExcel(); break;
                    case 'exportar-reporte-pdf': this._exportarReporteExcel(); break;
                }
            });

            // --- INPUT (texto/número) ---
            container.addEventListener('input', (ev) => {
                const target = ev.target.closest('[data-action-input]');
                if (!target) return;

                switch (target.dataset.actionInput) {
                    case 'debounced-filter': this.debouncedFilter(); break;
                    case 'calcular-dolar': this.calcularDolar(); break;
                    case 'calcular-dolar-nueva': this.calcularDolarNueva(); break;
                }
            });

            // --- CHANGE (fechas, selects) ---
            container.addEventListener('change', (ev) => {
                const target = ev.target.closest('[data-action-change]');
                if (!target) return;

                switch (target.dataset.actionChange) {
                    case 'apply-filters': this.applyFilters(); break;
                    case 'items-per-page': this.changeItemsPerPage(); break;
                    case 'obtener-tasa': this.obtenerTasaPorFecha(); break;
                    case 'obtener-tasa-nueva': this.obtenerTasaNueva(); break;
                    case 'rep-items-per-page': this.repChangeItemsPerPage(target.value); break;
                }
            });

            // --- KEYPRESS (Enter en búsqueda de factura) ---
            container.addEventListener('keypress', (ev) => {
                const target = ev.target.closest('[data-action-keypress]');
                if (!target) return;

                if (target.dataset.actionKeypress === 'buscar-factura' && ev.key === 'Enter') {
                    ev.preventDefault();
                    this.buscarFactura();
                }
            });
        }
    }

    // ========================================================
    // REGISTRO GLOBAL DE TIENDAS
    // ========================================================
    const Tiendas = {
        config: TIENDAS_CONFIG,
        apps: {},

        /** Obtiene (y crea si es necesario) la instancia de una tienda */
        get(key) {
            if (!this.apps[key]) {
                const cfg = TIENDAS_CONFIG[key];
                if (!cfg) {
                    console.error(`[Tiendas] Tienda desconocida: ${key}`);
                    return null;
                }
                this.apps[key] = new TiendaApp(cfg);
            }
            return this.apps[key];
        },

        /** Obtiene la instancia asociada a una sección del panel */
        getBySeccion(seccion) {
            const key = Object.keys(TIENDAS_CONFIG).find(k => TIENDAS_CONFIG[k].seccion === seccion);
            return key ? this.get(key) : null;
        },

        /** Devuelve true si la sección del panel pertenece a una tienda */
        esSeccionTienda(seccion) {
            return Object.values(TIENDAS_CONFIG).some(c => c.seccion === seccion);
        },

        /**
         * Punto de entrada llamado por panel.js (mostrarSeccion):
         * monta el módulo si hace falta y muestra su menú principal.
         */
        show(seccion) {
            const app = this.getBySeccion(seccion);
            if (!app) return;

            app.mount();
            app.showView('menu');

            // Integración con estadísticas (igual que la versión original
            // de Maracaibo: deja la tienda activa disponible globalmente)
            window.tiendaActiva = app.cfg.key;
        }
    };

    // ========================================================
    // EXPOSICIONES GLOBALES
    // ========================================================
    window.Tiendas = Tiendas;
window.TiendaApp = TiendaApp;

    // Utilidades que panel.js usa y antes venían de tienda-caracas-spa.js.
    // Se definen SOLO si no existen (respetar implementaciones previas).
    if (typeof window.parseNumberES !== 'function') window.parseNumberES = parseNumberES;
    if (typeof window.formatCurrency !== 'function') window.formatCurrency = formatCurrency;
    if (typeof window.formatNumber !== 'function') window.formatNumber = formatNumber;
    if (typeof window.showLoading !== 'function') window.showLoading = showLoading;
    if (typeof window.mostrarModalCorporativo !== 'function') window.mostrarModalCorporativo = mostrarModalCorporativo;
    if (typeof window.cerrarModalCorporativo !== 'function') window.cerrarModalCorporativo = cerrarModalCorporativo;

    console.log('✅ Módulo genérico de Tiendas cargado (caracas, maracay, maracaibo)');

})();