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
// - Moneda: Bs (Bolívares) | Total de cuotas por factura: 11
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
            reportesApi: '/api/reportes/maracaibo'
        }
    };

    const API_BASE_URL = window.location.origin + '/api';
    const TOTAL_CUOTAS = 11;
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
        const date = new Date(dateString);
        if (isNaN(date)) return '-';
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

            // Estado - Base de datos
            this.allData = [];
            this.filteredData = [];
            this.currentPage = 1;
            this.itemsPerPage = ITEMS_PER_PAGE_DEFAULT;
            this.currentFilter = 'all';
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
            <div id="${this.id('menu-principal')}" class="tm2" style="display: none;">
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
                        <table class="tm2-tabla">
                            <thead><tr><th>Cliente</th><th>Sin pagar</th><th class="num">Deuda</th></tr></thead>
                            <tbody id="${id('tb-sinpagar')}"></tbody>
                        </table>
                    </div>
                    <div class="tm2-panel">
                        <h3>Últimos pagos registrados</h3>
                        <div class="tm2-sub">Actividad reciente de la tienda</div>
                        <table class="tm2-tabla">
                            <thead><tr><th>Cliente</th><th>Fecha</th><th class="num">Monto</th></tr></thead>
                            <tbody id="${id('tb-ultimos')}"></tbody>
                        </table>
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
                alertas += `<div class="tm2-al r"><div class="tm2-al-ico">!</div><div><b>${r.morosos} clientes con 2+ meses sin pagar</b>Gestión de cobro urgente</div><span class="tm2-al-acc" data-action="show-base-datos">Ver lista</span></div>`;
            }
            if (r.porCobrar > 0) {
                alertas += `<div class="tm2-al a"><div class="tm2-al-ico">◷</div><div><b>${r.porCobrar} clientes sin cuota este mes</b>Aún no registran pago en ${TM_MESES[new Date().getMonth()]}</div><span class="tm2-al-acc" data-action="show-base-datos">Ver lista</span></div>`;
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
                    <div class="table-container">
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
            return `
                <div id="${this.id('conciliaciones')}" style="display: none;">
                    <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
                    <div class="section-header"><h3>Conciliaciones Bancarias</h3><p>Registro de depositos bancarios por numero de factura</p></div>
                    <div class="card" style="margin-bottom: 20px; padding: 25px;">
                        <input type="text" id="${c}-factura-buscar" placeholder="Ingrese N de factura..." data-action-keypress="buscar-factura">
                        <button data-action="buscar-factura">&#128269; Buscar Factura</button>
                    </div>
                    <div id="${c}-mensaje-inicial" class="card" style="padding: 40px; text-align: center;">
                        <p>Ingrese un numero de factura para buscar</p>
                    </div>
                    <div id="${c}-no-encontrada" class="card" style="display: none; padding: 40px; text-align: center; background: linear-gradient(135deg, #fff3e0, #ffe0b2); border-left: 4px solid #ed8936;">
                        <div style="font-size: 48px; margin-bottom: 15px;">&#128269;</div>
                        <h4 style="color: #ed8936; margin-bottom: 10px;">Factura No Encontrada</h4>
                        <p style="color: #666; margin-bottom: 20px;">La factura <strong id="${c}-no-encontrada-numero" style="color: #1a3a5c;"></strong> no existe en la base de datos.</p>
                        <p style="color: #888; font-size: 14px; margin-bottom: 20px;">Puede registrarla como un nuevo cliente usando el formulario a continuacion.</p>
                        <button data-action="mostrar-nuevo-registro" style="padding: 12px 28px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;">&#128221; Registrar Nuevo Cliente</button>
                        <button data-action="volver-buscar-factura" style="padding: 12px 28px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-left: 10px;">&#8592; Volver a Buscar</button>
                    </div>
                    <div id="${c}-resultado-encontrada" style="display: none;">
                        <div class="card">
                            <h4>&#128196; Informacion de la Factura</h4>
                            <div class="info-row"><span class="info-label">N° Factura:</span><span class="info-value" id="${c}-info-factura">-</span></div>
                            <div class="info-row"><span class="info-label">Cliente:</span><span class="info-value" id="${c}-info-nombre">-</span></div>
                            <div class="info-row"><span class="info-label">Cedula:</span><span class="info-value" id="${c}-info-cedula">-</span></div>
                            <div class="info-row"><span class="info-label">Monto Factura:</span><span class="info-value" id="${c}-info-monto">-</span></div>
                            <div class="info-row"><span class="info-label">Deuda:</span><span class="info-value" id="${c}-info-deuda">-</span></div>
                            <div class="info-row"><span class="info-label">Cuotas:</span><span class="info-value" id="${c}-info-cuotas">-</span></div>
                        </div>
                        <div class="card">
                            <h4>&#128178; Historial de Cuotas</h4>
                            <div class="table-container">
                                <table class="data-table" id="${c}-tabla-cuotas">
                                    <thead><tr><th>Cuota</th><th>Monto (Bs)</th><th>Referencia</th><th>Fecha</th><th>Tasa</th><th>Dolar</th></tr></thead>
                                    <tbody id="${c}-tabla-cuotas-body"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="card" data-card="form-cuota">
                            <h4>&#128181; Registrar Nueva Cuota</h4>
                            <div class="form-row">
                                <div class="form-group"><label>N° Cuota</label><input type="number" id="${c}-cuota-numero" readonly></div>
                                <div class="form-group"><label>Monto (Bs)</label><input type="number" step="0.01" id="${c}-cuota-monto" data-action-input="calcular-dolar"></div>
                                <div class="form-group"><label>Referencia</label><input type="text" id="${c}-cuota-ref"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label>Fecha Deposito</label><input type="date" id="${c}-cuota-fecha" data-action-change="obtener-tasa"></div>
                                <div class="form-group"><label>Tasa BCV</label><input type="number" step="0.0001" id="${c}-cuota-tasa" data-action-input="calcular-dolar"></div>
                                <div class="form-group"><label>Dolar Depositado</label><input type="number" step="0.01" id="${c}-cuota-dolar" readonly></div>
                            </div>
                            <div id="${c}-tasa-mensaje"></div>
                            <div style="margin-top: 15px;">
                                <button data-action="guardar-cuota" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;">&#128190; Guardar Cuota</button>
                                <button data-action="volver-buscar-factura" style="padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-left: 10px;">&#8592; Volver a Buscar</button>
                            </div>
                        </div>
                    </div>
                    <div id="${c}-resultado-nueva" style="display: none;">
                        <div class="card">
                            <h4>&#128221; Nuevo Registro</h4>
                            <div class="form-row">
                                <div class="form-group"><label>N° Factura *</label><input type="text" id="${c}-nueva-factura" readonly></div>
                                <div class="form-group"><label>Fecha Factura *</label><input type="date" id="${c}-nueva-fecha-factura"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label>Nombre y Apellido *</label><input type="text" id="${c}-nueva-nombre"></div>
                                <div class="form-group"><label>Cedula</label><input type="text" id="${c}-nueva-cedula"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label>Monto Factura (Bs) *</label><input type="number" step="0.01" id="${c}-nueva-monto"></div>
                            </div>
                        </div>
                        <div class="card">
                            <h4>&#128181; Primera Cuota</h4>
                            <div class="form-row">
                                <div class="form-group"><label>Monto (Bs) *</label><input type="number" step="0.01" id="${c}-nueva-cuota-monto" data-action-input="calcular-dolar-nueva"></div>
                                <div class="form-group"><label>Referencia *</label><input type="text" id="${c}-nueva-cuota-ref"></div>
                                <div class="form-group"><label>Fecha Deposito *</label><input type="date" id="${c}-nueva-cuota-fecha" data-action-change="obtener-tasa-nueva"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label>Tasa BCV *</label><input type="number" step="0.0001" id="${c}-nueva-cuota-tasa" data-action-input="calcular-dolar-nueva"></div>
                                <div class="form-group"><label>Dolar Depositado</label><input type="number" step="0.01" id="${c}-nueva-cuota-dolar" readonly></div>
                            </div>
                            <div id="${c}-nueva-tasa-mensaje"></div>
                            <div style="margin-top: 15px;">
                                <button data-action="guardar-nueva-conciliacion" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;">&#128190; Guardar Registro</button>
                                <button data-action="volver-buscar-factura" style="padding: 10px 20px; background: #f0f0f0; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-left: 10px;">&#8592; Volver a Buscar</button>
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
            const b = this.cfg.busqPfx;
            return `
                <div id="${this.id('busqueda')}" style="display: none;">
                    <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
                    <div style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; border-radius: 12px;">
                        <h2><i class="fas fa-chart-bar"></i> Reportes Tienda ${this.cfg.nombre}</h2>
                        <p style="opacity: 0.9; margin-top: 5px;">Genera reportes personalizados con filtros avanzados</p>
                    </div>

                    <div class="card" style="margin-bottom: 20px; padding: 25px;">
                        <h4 style="margin-bottom: 15px; color: #1a365d;"><i class="fas fa-filter"></i> Filtros del Reporte</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                            <div class="form-group"><label>Fecha Desde</label><input type="date" id="${b}-fecha-desde"></div>
                            <div class="form-group"><label>Fecha Hasta</label><input type="date" id="${b}-fecha-hasta"></div>
                            <div class="form-group"><label>Estado</label><select id="${b}-estado"><option value="todos">Todos</option><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="mora">En Mora</option><option value="abiertas">Facturas Abiertas</option><option value="canceladas">Facturas Canceladas</option></select></div>
                            <div class="form-group"><label>Monto Deuda Min</label><input type="number" id="${b}-monto-min" placeholder="0.00"></div>
                            <div class="form-group"><label>Monto Deuda Max</label><input type="number" id="${b}-monto-max" placeholder="9999999"></div>
                            <div class="form-group"><label>Nombre Cliente</label><input type="text" id="${b}-nombre" placeholder="Buscar cliente..."></div>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button data-action="limpiar-reporte" style="padding: 10px 20px; background: #edf2f7; color: #4a5568; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;"><i class="fas fa-eraser"></i> Limpiar</button>
                            <button data-action="generar-reporte" style="padding: 10px 24px; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);"><i class="fas fa-sync-alt"></i> Generar Reporte</button>
                        </div>
                    </div>

                    <div id="${b}-resumen" style="display: none; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                            <div class="card" style="border-left: 4px solid #4299e1; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-total">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Total Clientes</div></div>
                            <div class="card" style="border-left: 4px solid #f56565; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-deuda">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Deuda Total</div></div>
                            <div class="card" style="border-left: 4px solid #48bb78; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-pagado">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Total Pagado</div></div>
                            <div class="card" style="border-left: 4px solid #ed8936; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-mora">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Clientes en Mora</div></div>
                            <div class="card" style="border-left: 4px solid #9f7aea; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-promedio">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Promedio Deuda</div></div>
                        </div>
                    </div>

                    <div class="card" id="${b}-tabla-container" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                            <h4 style="color: #1a365d;"><i class="fas fa-list"></i> Resultados</h4>
                            <span style="font-size: 13px; color: #718096; background: #edf2f7; padding: 6px 14px; border-radius: 20px;" id="${b}-contador">0 registros</span>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table" id="${b}-tabla">
                                <thead><tr style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white;"><th>Nro</th><th>Factura</th><th>Cliente</th><th>Cedula</th><th>Monto</th><th>Cuotas</th><th>Depositado</th><th>Deuda</th><th>Estado</th><th>Fecha</th></tr></thead>
                                <tbody id="${b}-tbody"></tbody>
                            </table>
                        </div>
                        <div id="${b}-paginacion"></div>
                    </div>

                    <div id="${b}-graficos" style="display: none; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="card" style="padding: 25px;"><h4 style="margin-bottom: 20px; color: #1a365d;"><i class="fas fa-chart-bar"></i> Deuda por Estado</h4><div id="${b}-graf-barras"></div></div>
                        <div class="card" style="padding: 25px;"><h4 style="margin-bottom: 20px; color: #1a365d;"><i class="fas fa-chart-pie"></i> Distribución de Pagos</h4><div id="${b}-graf-pastel" style="display: flex; align-items: center; justify-content: center; gap: 30px;"></div></div>
                    </div>

                    <div id="${b}-exportar" style="display: none; text-align: center; padding: 20px; border-top: 1px solid #e2e8f0;">
                        <div style="display: inline-flex; gap: 20px;">
                            <button data-action="exportar-reporte-excel" style="padding: 15px 30px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; color: #15803d; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 180px;"><i class="fas fa-file-excel" style="font-size: 32px; color: #22c55e;"></i><span>Exportar Excel</span><small style="font-size: 11px; opacity: 0.7;">.xlsx</small></button>
                            <button data-action="exportar-reporte-pdf" style="padding: 15px 30px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; color: #b91c1c; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 180px;"><i class="fas fa-file-pdf" style="font-size: 32px; color: #ef4444;"></i><span>Exportar PDF</span><small style="font-size: 11px; opacity: 0.7;">.pdf</small></button>
                        </div>
                    </div>
                </div>
            `;
        }

        // ====================================================
        // NAVEGACIÓN INTERNA DEL MÓDULO
        // ====================================================
        showView(vista) {
            const menu = this.el(this.id('menu-principal'));
            const baseDatos = this.el(this.id('base-datos'));
            const conciliaciones = this.el(this.id('conciliaciones'));
            const busqueda = this.el(this.id('busqueda'));

            if (menu) menu.style.display = vista === 'menu' ? 'block' : 'none'; // v6.5: era 'grid'
            if (baseDatos) baseDatos.style.display = vista === 'baseDatos' ? 'block' : 'none';
            if (conciliaciones) conciliaciones.style.display = vista === 'conciliaciones' ? 'block' : 'none';
            if (busqueda) busqueda.style.display = vista === 'reportes' ? 'block' : 'none';

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
                this.initReportes();
            }
        }

        // ====================================================
        // BASE DE DATOS - CARGA Y PROCESAMIENTO
        // ====================================================
        async initDatos() {
            if (this._cargando) return;
            this._cargando = true;
            await this.loadData();
            this.updateSummary();
            this.renderTable();
            this.updateFilterCounts();
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

            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
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

            this.currentPage = 1;
            this.updateSummary();
            this.renderTable();
        }

        clearFilters() {
            const sfx = this.cfg.sfx;
            ['search-general', 'search-factura', 'search-cedula', 'fecha-desde', 'fecha-hasta', 'monto-min', 'monto-max']
                .forEach(base => {
                    const el = this.el(base + sfx);
                    if (el) el.value = '';
                });

            this.currentFilter = 'all';
            const root = this.el(this.cfg.contentId);
            if (root) {
                root.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                const allBtn = root.querySelector('[data-filter="all"]');
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
                tbody.innerHTML = pageData.map(item => this.createRowHTML(item)).join('');
            }

            this.updatePagination();
        }

        createRowHTML(item) {
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

        exportToPDF() {
            alert('Exportación a PDF en desarrollo.\nUse Imprimir → Guardar como PDF.');
            window.print();
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

        verDetalle(id) {
            const item = this.allData.find(d => d.id === id);
            if (!item) return;

            this.currentEditId = id;
            this.currentEditItem = item;

            // Eliminar modal anterior si existe
            const modalAnterior = this.el(this.modalId);
            if (modalAnterior) modalAnterior.remove();

            const modal = this.createModalElement();
            document.body.appendChild(modal);

            this.fillFormData(item);
            modal.style.display = 'flex';
        }

        createModalElement() {
            const k = this.cfg.key;
            const modal = document.createElement('div');
            modal.id = this.modalId;
            modal.className = 'modal ec-modal';
            modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,32,51,0.55); z-index:1000; align-items:center; justify-content:center;';

            const admin = isAdminUser();
            const modalTitle = admin ? 'Editar Cliente' : 'Ver Cliente';
            const cuotasTitle = admin ? 'Cuotas del Crédito' : 'Cuotas del Crédito (Solo Lectura)';
            const saveButton = admin ? `
                <button type="submit" class="ec-btn ec-btn-primary">
                    <i class="fas fa-save"></i> Guardar Cambios
                </button>
            ` : '';

            modal.innerHTML = `
                <div class="ec-card">
                    <div class="ec-header">
                        <div class="ec-header-info">
                            <div class="ec-ico"><i class="fas fa-user-edit"></i></div>
                            <div class="ec-header-txt">
                                <h3 class="ec-titulo">${modalTitle} <span class="ec-chip">${this.cfg.nombre}</span></h3>
                                <p class="ec-sub" id="edit-${k}-sub">&nbsp;</p>
                            </div>
                        </div>
                        <button type="button" data-modal-action="close" class="ec-cerrar" title="Cerrar">&times;</button>
                    </div>

                    <form id="form-editar-cliente-${k}" class="ec-form">
                        <div class="ec-body">
                            <div class="ec-izq">
                                <div class="ec-sec">
                                    <h4 class="ec-sec-titulo"><i class="fas fa-id-card"></i> Información Principal</h4>
                                    <div class="ec-fila2">
                                        <div class="ec-campo">
                                            <label>N° Factura</label>
                                            <input type="text" id="edit-${k}-nro-factura" class="ec-in ec-in-ro" readonly>
                                        </div>
                                        <div class="ec-campo">
                                            <label>Fecha Factura</label>
                                            <input type="text" id="edit-${k}-fecha-factura" class="ec-in ec-in-ro" readonly>
                                        </div>
                                    </div>
                                    <div class="ec-campo">
                                        <label>Nombre y Apellido</label>
                                        <input type="text" id="edit-${k}-nombre" class="ec-in ec-in-ro" readonly>
                                    </div>
                                    <div class="ec-fila2">
                                        <div class="ec-campo">
                                            <label>Cédula</label>
                                            <input type="text" id="edit-${k}-cedula" class="ec-in ec-in-ro" readonly>
                                        </div>
                                        <div class="ec-campo">
                                            <label><i class="fas fa-phone"></i> Teléfono</label>
                                            <input type="text" id="edit-${k}-telefono" class="ec-in" placeholder="N° de teléfono">
                                        </div>
                                    </div>
                                </div>

                                <div class="ec-sec">
                                    <h4 class="ec-sec-titulo"><i class="fas fa-university"></i> Datos Bancarios</h4>
                                    <div class="ec-campo">
                                        <label>Número de Cuenta (20 dígitos)</label>
                                        <input type="text" id="edit-${k}-numero-cuenta" maxlength="20" inputmode="numeric" placeholder="Ej: 01770000000000000000" class="ec-in ec-in-cuenta">
                                    </div>
                                    <div class="ec-campo">
                                        <label><i class="fas fa-building-columns"></i> Banco <span class="ec-auto">automático</span></label>
                                        <input type="text" id="edit-${k}-banco" readonly placeholder="Se detecta automáticamente" class="ec-in ec-in-banco">
                                    </div>
                                </div>

                                <div class="ec-sec">
                                    <h4 class="ec-sec-titulo"><i class="fas fa-money-bill-wave"></i> Resumen de Montos</h4>
                                    <div class="ec-stats">
                                        <div class="ec-stat">
                                            <span class="ec-stat-label">Monto Factura</span>
                                            <input type="text" id="edit-${k}-monto-factura" class="ec-stat-val" readonly>
                                        </div>
                                        <div class="ec-stat ec-stat-ok">
                                            <span class="ec-stat-label">Depositado</span>
                                            <input type="text" id="edit-${k}-monto-depositado" class="ec-stat-val" readonly>
                                        </div>
                                        <div class="ec-stat ec-stat-deuda">
                                            <span class="ec-stat-label">Deuda Pendiente</span>
                                            <input type="text" id="edit-${k}-deuda" class="ec-stat-val" readonly>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="ec-der">
                                <div class="ec-der-cab">
                                    <h4 class="ec-sec-titulo"><i class="fas fa-list-ol"></i> ${cuotasTitle}</h4>
                                    <span class="ec-der-nota" id="edit-${k}-cuotas-nota"></span>
                                </div>
                                <div class="ec-tabla-wrap">
                                    <table class="ec-tabla">
                                        <thead>
                                            <tr>
                                                <th class="ec-th-num">#</th>
                                                <th>Monto Bs.</th>
                                                <th>Referencia</th>
                                                <th>Fecha</th>
                                                <th class="ec-th-tasa">Tasa BCV</th>
                                                <th class="ec-th-dolar">Monto $</th>
                                                ${admin ? '<th class="ec-th-elim" title="Marcar para eliminar"><i class="fas fa-trash-alt"></i></th>' : ''}
                                            </tr>
                                        </thead>
                                        <tbody id="edit-cuotas-container-${k}"></tbody>
                                        <tfoot>
                                            <tr>
                                                <td class="ec-pie-ico"><i class="fas fa-calculator"></i></td>
                                                <td class="ec-pie-num" id="edit-${k}-pie-bs">&mdash;</td>
                                                <td class="ec-pie-label" colspan="3">Total depositado en cuotas</td>
                                                <td class="ec-pie-num ec-pie-dolar" id="edit-${k}-pie-dolar">&mdash;</td>
                                                ${admin ? '<td class="ec-pie-elim"></td>' : ''}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                ${admin ? `
                                <div id="eliminar-cuotas-section-${k}" class="ec-barra-del" style="display:none;">
                                    <span class="ec-barra-del-txt">
                                        <i class="fas fa-trash-alt"></i>
                                        <strong id="eliminar-cuotas-list-${k}">0</strong>&nbsp;cuota(s) marcada(s) para eliminar
                                    </span>
                                    <button type="button" data-modal-action="eliminar-cuotas" class="ec-btn ec-btn-danger">
                                        <i class="fas fa-trash-alt"></i> Borrar Seleccionadas
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="ec-footer">
                            <span class="ec-footer-hint">
                                <i class="fas fa-info-circle"></i>
                                ${admin ? 'Los cambios se aplican al presionar Guardar Cambios' : 'Vista de solo lectura'}
                            </span>
                            <div class="ec-footer-btns">
                                <button type="button" data-modal-action="close" class="ec-btn ec-btn-ghost">
                                    <i class="fas fa-times"></i> Cerrar
                                </button>
                                ${saveButton}
                            </div>
                        </div>
                    </form>
                </div>
            `;

            // Eventos del modal (submit + botones con data-modal-action)
            const form = modal.querySelector(`#form-editar-cliente-${k}`);
            form.addEventListener('submit', (ev) => {
                ev.preventDefault();
                if (isAdminUser()) this.guardarCambios();
                else this.closeModal();
            });

            // v6.3: autodetección de banco mientras se escribe la cuenta
            const inputCuenta = modal.querySelector(`#edit-${k}-numero-cuenta`);
            if (inputCuenta) {
                inputCuenta.addEventListener('input', () => {
                    // Solo dígitos permitidos en el campo
                    const limpio = inputCuenta.value.replace(/\D/g, '');
                    if (inputCuenta.value !== limpio) inputCuenta.value = limpio;

                    const bancoInput = modal.querySelector(`#edit-${k}-banco`);
                    if (bancoInput) {
                        const detectado = detectarBanco(limpio);
                        bancoInput.value = detectado;
                        bancoInput.placeholder = (limpio.length >= 4 && !detectado)
                            ? 'No identificado'
                            : 'Se detecta automáticamente';
                    }
                });
            }

            // v6.6: barra de eliminación en vivo (cuenta marcadas + resalta filas)
            if (admin) {
                modal.addEventListener('change', (ev) => {
                    const cb = ev.target;
                    if (!cb || cb.name !== `eliminar-cuota-${k}`) return;
                    const fila = cb.closest('tr');
                    if (fila) fila.classList.toggle('ec-marcada', cb.checked);
                    const marcadas = modal.querySelectorAll(`input[name="eliminar-cuota-${k}"]:checked`).length;
                    const countEl = modal.querySelector(`#eliminar-cuotas-list-${k}`);
                    if (countEl) countEl.textContent = marcadas;
                    const barra = modal.querySelector(`#eliminar-cuotas-section-${k}`);
                    if (barra) barra.style.display = marcadas > 0 ? 'flex' : 'none';
                });
            }

            modal.addEventListener('click', (ev) => {
                const btn = ev.target.closest('[data-modal-action]');
                if (!btn) return;
                const action = btn.dataset.modalAction;
                if (action === 'close') this.closeModal();
                else if (action === 'eliminar-cuotas') this.confirmarEliminarCuotas();
            });

            return modal;
        }

        fillFormData(item) {
            const modal = this.el(this.modalId);
            if (!modal) return;
            const k = this.cfg.key;

            const setVal = (id, val) => {
                const el = modal.querySelector('#' + id);
                if (el) el.value = val || '';
            };

            setVal(`edit-${k}-nro-factura`, item.nro_factura);
            setVal(`edit-${k}-nombre`, item.nombre_apellido);
            setVal(`edit-${k}-cedula`, item.cedula);
            setVal(`edit-${k}-telefono`, item.telefono);

            // v6.3: datos bancarios (si hay cuenta sin banco, se detecta al abrir)
            setVal(`edit-${k}-numero-cuenta`, item.numero_cuenta);
            setVal(`edit-${k}-banco`, item.banco || detectarBanco(item.numero_cuenta));

            // Fecha de factura formateada (DD/MM/YYYY)
            let fechaFacturaFormateada = '';
            if (item.fecha_factura) {
                const fechaObj = new Date(item.fecha_factura);
                fechaFacturaFormateada = !isNaN(fechaObj)
                    ? fechaObj.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : item.fecha_factura;
            }
            setVal(`edit-${k}-fecha-factura`, fechaFacturaFormateada);

            setVal(`edit-${k}-monto-factura`, formatNumber(item.monto_factura));
            setVal(`edit-${k}-monto-depositado`, formatNumber(item.monto_depositados));
            setVal(`edit-${k}-deuda`, formatNumber(item.deuda));

            const admin = isAdminUser();

            // Generar campos de cuotas - SOLO las que tienen datos en la BD
            const container = modal.querySelector(`#edit-cuotas-container-${k}`);
            if (container) {
                let html = '';
                let cuotasMostradas = 0;
                let totalBs = 0;
                let totalDolar = 0;

                for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                    const cuota = item[`cuota_${i}`];
                    const ref = item[`ref_cuota_${i}`];
                    const fecha = item[`fecha_cuota_${i}`];
                    const tasa = item[`tasa_cuota_${i}`];
                    const dolar = item[`dolar_depositado_cuota_${i}`];

                    if (parseNumberES(cuota) > 0) {
                        cuotasMostradas++;
                        totalBs += parseNumberES(cuota);

                        // Fecha para input type="date" (YYYY-MM-DD)
                        let fechaFormateada = '';
                        if (fecha) {
                            if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                fechaFormateada = fecha;
                            } else {
                                const fechaObj = new Date(fecha);
                                if (!isNaN(fechaObj)) fechaFormateada = fechaObj.toISOString().split('T')[0];
                            }
                        }

                        let dolarFormateado = '';
                        if (dolar && parseNumberES(dolar) > 0) {
                            totalDolar += parseNumberES(dolar);
                            dolarFormateado = parseNumberES(dolar).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
                        }

                        if (!admin) {
                            // Operador: fila de solo lectura (texto plano)
                            html += `
                                <tr>
                                    <td class="ec-td-num">${i}</td>
                                    <td class="ec-td-monto">${parseNumberES(cuota).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td>${ref || '&mdash;'}</td>
                                    <td>${fechaFormateada || '&mdash;'}</td>
                                    <td class="ec-td-tasa">${tasa || '&mdash;'}</td>
                                    <td class="ec-td-dolar">${dolarFormateado || '&mdash;'}</td>
                                </tr>
                            `;
                        } else {
                            // Admin: fila editable + checkbox de eliminación en la fila
                            html += `
                                <tr data-cuota-fila="${i}">
                                    <td class="ec-td-num">${i}</td>
                                    <td><input type="number" step="0.01" id="edit-${k}-cuota-${i}" value="${cuota || ''}" class="ec-celda ec-celda-monto"></td>
                                    <td><input type="text" id="edit-${k}-ref-${i}" value="${ref || ''}" class="ec-celda" placeholder="&mdash;"></td>
                                    <td><input type="date" id="edit-${k}-fecha-${i}" value="${fechaFormateada}" class="ec-celda"></td>
                                    <td><input type="number" step="0.0001" id="edit-${k}-tasa-${i}" value="${tasa || ''}" class="ec-celda ec-celda-tasa"></td>
                                    <td class="ec-td-dolar">${dolarFormateado || '&mdash;'}</td>
                                    <td class="ec-td-elim"><input type="checkbox" name="eliminar-cuota-${k}" value="${i}" class="ec-check" title="Marcar para eliminar"></td>
                                </tr>
                            `;
                        }
                    }
                }

                if (cuotasMostradas === 0) {
                    html = `<tr><td colspan="${admin ? 7 : 6}" class="ec-vacio">No hay cuotas registradas</td></tr>`;
                }

                container.innerHTML = html;

                // v6.6: pie con totales + nota de conteo + subtítulo del encabezado
                const setTxt = (id, txt) => {
                    const el = modal.querySelector('#' + id);
                    if (el) el.textContent = txt;
                };
                setTxt(`edit-${k}-pie-bs`, cuotasMostradas
                    ? totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '—');
                setTxt(`edit-${k}-pie-dolar`, cuotasMostradas
                    ? totalDolar.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $'
                    : '—');
                setTxt(`edit-${k}-cuotas-nota`, cuotasMostradas ? `${cuotasMostradas} cuota(s) registrada(s)` : 'Sin cuotas');
                setTxt(`edit-${k}-sub`, `${item.nombre_apellido || '—'} • Factura ${item.nro_factura || '—'}`);

                // v6.6: la barra de eliminación inicia oculta (aparece al marcar checkboxes)
                if (admin) {
                    const eliminarSection = modal.querySelector(`#eliminar-cuotas-section-${k}`);
                    const eliminarCount = modal.querySelector(`#eliminar-cuotas-list-${k}`);
                    if (eliminarSection) eliminarSection.style.display = 'none';
                    if (eliminarCount) eliminarCount.textContent = '0';
                }
            }
        }

        closeModal() {
            const modal = this.el(this.modalId);
            if (modal) {
                modal.style.display = 'none';
                modal.remove(); // destruir del DOM (evita conflictos entre tiendas)
            }
            this.currentEditId = null;
            this.currentEditItem = null;
        }

        async guardarCambios() {
            if (!this.currentEditId || !this.currentEditItem) return;
            const k = this.cfg.key;
            const modal = this.el(this.modalId);

            const getVal = (id) => {
                const el = modal ? modal.querySelector('#' + id) : null;
                return el ? el.value : '';
            };

            // monto_factura SIEMPRE del item original (el input está
            // formateado con separador de miles: leerlo corrompe el valor)
            const item = this.currentEditItem;
            const data = {
                id: item.id,
                numero: item.numero,
                nro_factura: item.nro_factura,
                nombre_apellido: item.nombre_apellido,
                cedula: item.cedula,
                telefono: getVal(`edit-${k}-telefono`).trim(),
                // v6.3: datos bancarios
                numero_cuenta: getVal(`edit-${k}-numero-cuenta`).replace(/\D/g, '').trim(),
                banco: getVal(`edit-${k}-banco`).trim(),
                fecha_factura: item.fecha_factura || null,
                monto_factura: typeof item.monto_factura === 'number'
                    ? item.monto_factura
                    : parseNumberES(item.monto_factura)
            };

            let cuotasEditadas = false;
            let montoDepositado = 0;

            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuotaOriginal = parseNumberES(item[`cuota_${i}`]);

                if (cuotaOriginal > 0) {
                    const cuotaInput = parseNumberES(getVal(`edit-${k}-cuota-${i}`));
                    const refInput = getVal(`edit-${k}-ref-${i}`).trim();
                    const fechaInput = getVal(`edit-${k}-fecha-${i}`);
                    const tasaInput = parseNumberES(getVal(`edit-${k}-tasa-${i}`));

                    const refOriginal = item[`ref_cuota_${i}`] || '';
                    const fechaOriginal = item[`fecha_cuota_${i}`] || '';
                    const tasaOriginal = parseNumberES(item[`tasa_cuota_${i}`]);

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

                    if (cuotaInput > 0) montoDepositado += cuotaInput;
                }
            }

            if (!cuotasEditadas) {
                data.monto_depositados = parseNumberES(item.monto_depositados);
                data.deuda = parseNumberES(item.deuda);
            } else {
                data.monto_depositados = montoDepositado;
                data.deuda = data.monto_factura - montoDepositado;
                if (Math.abs(data.monto_factura - montoDepositado) < 0.01) {
                    data.deuda = 0;
                }
            }

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

                alert('✅ Cambios guardados exitosamente');

            } catch (error) {
                console.error('Error al guardar:', error);
                alert('❌ Error al guardar: ' + error.message);
            } finally {
                showLoading(false);
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
            const modal = this.el(this.modalId);
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
                const data = {};
                let montoDepositado = 0;

                for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                    if (this.cuotasAEliminar.includes(i)) {
                        data[`cuota_${i}`] = null;
                        data[`ref_cuota_${i}`] = null;
                        data[`fecha_cuota_${i}`] = null;
                        data[`tasa_cuota_${i}`] = null;
                        data[`dolar_depositado_cuota_${i}`] = null;
                    } else {
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

                const montoFactura = parseNumberES(datosConfirmacion.monto_factura);
                let deuda = montoFactura - montoDepositado;
                if (Math.abs(deuda) < 0.01) deuda = 0;

                data.monto_depositados = montoDepositado;
                data.deuda = deuda;

                const response = await this._apiFetch(`${this.cfg.api}/${datosConfirmacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                await response.json();

                // Actualizar datos locales
                const index = this.allData.findIndex(d => d.id === datosConfirmacion.id);
                if (index !== -1) {
                    this.cuotasAEliminar.forEach(i => {
                        this.allData[index][`cuota_${i}`] = null;
                        this.allData[index][`ref_cuota_${i}`] = null;
                        this.allData[index][`fecha_cuota_${i}`] = null;
                        this.allData[index][`tasa_cuota_${i}`] = null;
                        this.allData[index][`dolar_depositado_cuota_${i}`] = null;
                    });
                    this.allData[index].monto_depositados = montoDepositado;
                    this.allData[index].deuda = deuda;
                    this.allData[index] = this.processItemData(this.allData[index]);
                }

                this.applyFilters();
                this.updateSummary();
                this.updateFilterCounts();
                this.closeModal();

                mostrarModalCorporativo(
                    '¡Cuotas Eliminadas!',
                    `Se han eliminado ${this.cuotasAEliminar.length} cuota(s) exitosamente.\n\n<strong>Factura:</strong> ${datosConfirmacion.nro_factura}\n<strong>Nueva Deuda:</strong> ${formatCurrency(deuda)}\n<strong>Total Depositado:</strong> ${formatCurrency(montoDepositado)}`,
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
            const resE = c('resultado-encontrada'), resN = c('resultado-nueva'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
            if (buscar) { buscar.value = ''; buscar.focus(); }
            this.concCliente = null;
        }

        volverABuscarFactura() {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('resultado-nueva'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
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
                const cliente = data.find(c => c.nro_factura === nroFactura);

                const msg = this.el(this.concId('mensaje-inicial'));
                if (msg) msg.style.display = 'none';

                if (cliente) {
                    this.concCliente = this.processItemData(cliente);
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

            const setText = (n, v) => { const el = c(n); if (el) el.textContent = v; };
            setText('info-factura', cliente.nro_factura || '-');
            setText('info-nombre', cliente.nombre_apellido || '-');
            setText('info-cedula', cliente.cedula || '-');
            setText('info-monto', formatCurrency(cliente.monto_factura));
            setText('info-deuda', formatCurrency(cliente.deuda));
            setText('info-cuotas', `${cliente.cuotas_pagadas || 0} de ${cliente.total_cuotas || TOTAL_CUOTAS}`);

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
            const siguienteCuota = (cliente.cuotas_pagadas || 0) + 1;
            const numEl = this.el(this.concId('cuota-numero'));
            const fechaEl = this.el(this.concId('cuota-fecha'));
            if (numEl) numEl.value = siguienteCuota > TOTAL_CUOTAS ? TOTAL_CUOTAS : siguienteCuota;
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
        }

        mostrarNuevoRegistro(nroFactura) {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('resultado-nueva');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'block';

            const setVal = (n, v) => { const el = c(n); if (el) el.value = v; };
            const hoy = new Date().toISOString().split('T')[0];
            setVal('nueva-factura', nroFactura);
            setVal('nueva-fecha-factura', hoy);
            setVal('nueva-cuota-fecha', hoy);
            setVal('nueva-nombre', '');
            setVal('nueva-cedula', '');
            setVal('nueva-monto', '');
            setVal('nueva-cuota-monto', '');
            setVal('nueva-cuota-ref', '');
            setVal('nueva-cuota-tasa', '');
            setVal('nueva-cuota-dolar', '');
            const msg = c('nueva-tasa-mensaje');
            if (msg) msg.textContent = '';

            this.obtenerTasaNueva();
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

            let data = null;
            const token = localStorage.getItem('token');

            // Intentar tasa por fecha, capturar 404 y cualquier error
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
                    this.concTasa = data.tasa.current.usd;
                    mensaje.textContent = '✅ Tasa actual: ' + data.tasa.current.usd.toFixed(4) + ' Bs (fecha: ' + data.tasa.current.date + ')';
                    mensaje.style.color = '#28a745';
                    onTasa.call(this);
                    return;
                }
            }

            // Si tenemos datos de fecha válidos
            if (data && data.exito && data.tasa) {
                tasaInput.value = data.tasa.usd.toFixed(4);
                this.concTasa = data.tasa.usd;
                mensaje.textContent = '✅ Tasa BCV obtenida: ' + data.tasa.date;
                mensaje.style.color = '#28a745';
                onTasa.call(this);
                return;
            }

            // Fallback final: tasa por defecto (mismo valor que la versión original)
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

            dolarEl.value = (monto > 0 && tasa > 0) ? (monto / tasa).toFixed(2) : '';
        }

        calcularDolarNueva() {
            const montoEl = this.el(this.concId('nueva-cuota-monto'));
            const tasaEl = this.el(this.concId('nueva-cuota-tasa'));
            const dolarEl = this.el(this.concId('nueva-cuota-dolar'));
            if (!montoEl || !tasaEl || !dolarEl) return;

            const monto = parseFloat(montoEl.value) || 0;
            const tasa = parseFloat(tasaEl.value) || 0;

            dolarEl.value = (monto > 0 && tasa > 0) ? (monto / tasa).toFixed(2) : '';
        }

        cargarHistorialCuotas(cliente) {
            const tbody = this.el(this.concId('tabla-cuotas-body'));
            if (!tbody) return;

            let html = '';
            let tieneCuotas = false;

            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
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

            const data = {};
            data[`cuota_${cuotaNum}`] = monto;
            data[`ref_cuota_${cuotaNum}`] = ref;
            data[`fecha_cuota_${cuotaNum}`] = fecha;
            data[`tasa_cuota_${cuotaNum}`] = tasa;
            data[`dolar_depositado_cuota_${cuotaNum}`] = dolar || (monto / tasa);

            let montoDepositado = 0;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                if (i === cuotaNum) {
                    montoDepositado += monto;
                } else {
                    montoDepositado += parseNumberES(this.concCliente[`cuota_${i}`]);
                }
            }

            const montoFactura = parseNumberES(this.concCliente.monto_factura);
            let deuda = montoFactura - montoDepositado;
            if (Math.abs(deuda) < 0.01) deuda = 0;

            data.monto_depositados = montoDepositado;
            data.deuda = deuda;

            showLoading(true);

            try {
                const response = await this._apiFetch(`${this.cfg.api}/${this.concCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const result = await response.json();

                if (result.success || result.message) {
                    const refreshResponse = await this._apiFetch(`${this.cfg.api}/${this.concCliente.id}`);
                    if (refreshResponse.ok) {
                        const refreshed = await refreshResponse.json();
                        this.concCliente = this.processItemData(refreshed);
                    }

                    await this.loadData();

                    if (deuda <= 0) {
                        // Factura cancelada después de guardar
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
                            `Cuota ${cuotaNum} guardada exitosamente.\n\nDeuda restante: ${formatCurrency(deuda)}`,
                            'exito',
                            [{
                                texto: 'Aceptar',
                                estilo: BTN.aceptar,
                                accion: () => this.volverABuscarFactura()
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

        async guardarNuevaConciliacion() {
            const c = (n) => this.el(this.concId(n));
            const nroFactura = c('nueva-factura')?.value.trim();
            const nombre = c('nueva-nombre')?.value.trim();
            const cedula = c('nueva-cedula')?.value.trim();
            const montoFactura = parseFloat(c('nueva-monto')?.value);
            const fechaFactura = c('nueva-fecha-factura')?.value;

            const cuotaMonto = parseFloat(c('nueva-cuota-monto')?.value);
            const cuotaRef = c('nueva-cuota-ref')?.value.trim();
            const cuotaFecha = c('nueva-cuota-fecha')?.value;
            const cuotaTasa = parseFloat(c('nueva-cuota-tasa')?.value);
            const cuotaDolar = parseFloat(c('nueva-cuota-dolar')?.value);

            if (!nroFactura) { this._validacionModal('N° de factura es obligatorio'); return; }
            if (!nombre) { this._validacionModal('Nombre y apellido es obligatorio', 'nueva-nombre'); return; }
            if (!montoFactura || montoFactura <= 0) { this._validacionModal('Monto de factura es obligatorio', 'nueva-monto'); return; }
            if (!fechaFactura) { this._validacionModal('Fecha de factura es obligatoria'); return; }
            if (!cuotaMonto || cuotaMonto <= 0) { this._validacionModal('Ingrese el monto del depósito', 'nueva-cuota-monto'); return; }
            if (!cuotaRef) { this._validacionModal('Ingrese la referencia del depósito', 'nueva-cuota-ref'); return; }
            if (!cuotaFecha) { this._validacionModal('Seleccione la fecha del depósito'); return; }
            if (!cuotaTasa || cuotaTasa <= 0) { this._validacionModal('La tasa BCV es obligatoria'); return; }

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
                const response = await this._apiFetch(this.cfg.api, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Error HTTP: ${response.status}`);
                }

                await response.json();

                mostrarModalCorporativo(
                    '¡Registro Creado!',
                    `Registro creado exitosamente.\n\nFactura: ${nroFactura}\nCliente: ${nombre}\nDeuda: ${formatCurrency(deuda > 0 ? deuda : 0)}`,
                    'exito',
                    [{
                        texto: 'Aceptar',
                        estilo: BTN.aceptar,
                        accion: () => this.volverABuscarFactura()
                    }]
                );

                await this.loadData();

            } catch (error) {
                console.error('Error creando registro:', error);
                mostrarModalCorporativo('Error', 'Error al crear registro: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
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
        initReportes() {
            // Fechas por defecto: primer día del mes -> hoy
            const hoy = new Date();
            const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const desde = this.el(this.busqId('fecha-desde'));
            const hasta = this.el(this.busqId('fecha-hasta'));
            if (desde && !desde.value) desde.value = primerDia.toISOString().split('T')[0];
            if (hasta && !hasta.value) hasta.value = hoy.toISOString().split('T')[0];
        }

        calcularEstadoReporte(row) {
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

        async generarReporte() {
            showLoading(true);
            const b = (n) => this.el(this.busqId(n));

            try {
                const filtros = {
                    fecha_desde: b('fecha-desde')?.value || null,
                    fecha_hasta: b('fecha-hasta')?.value || null,
                    estado: b('estado')?.value || 'todos',
                    monto_min: b('monto-min')?.value || null,
                    monto_max: b('monto-max')?.value || null,
                    nombre_cliente: b('nombre')?.value || null
                };

                const token = localStorage.getItem('token');
                const response = await fetch(this.cfg.reportesApi, {
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

                this.repDatos = data.datos || [];
                this.repResumen = data.resumen || {};

                // Mostrar resumen
                const resumen = b('resumen');
                if (resumen) resumen.style.display = 'grid';
                const setText = (n, v) => { const el = b(n); if (el) el.textContent = v; };
                setText('res-total', formatNumber(this.repResumen.total_clientes || 0));
                setText('res-deuda', formatCurrency(this.repResumen.total_deuda || 0));
                setText('res-pagado', formatCurrency(this.repResumen.total_depositado || 0));
                setText('res-mora', formatNumber(this.repResumen.clientes_mora || 0));
                setText('res-promedio', formatCurrency(this.repResumen.promedio_deuda || 0));

                // Mostrar tabla
                const tablaContainer = b('tabla-container');
                if (tablaContainer) tablaContainer.style.display = 'block';
                setText('contador', this.repDatos.length + ' registros');

                // Inicializar paginación
                this.repPagina = 1;
                this.repPorPagina = 10;

                // Renderizar tabla paginada
                this.renderTablaReporte();

                // Mostrar gráficos
                const graficos = b('graficos');
                if (graficos) graficos.style.display = 'grid';
                this.renderGraficosReporte();

                // Mostrar exportar
                const exportar = b('exportar');
                if (exportar) exportar.style.display = 'block';

                notificar('Busqueda generada: ' + data.total + ' registros', 'success');

            } catch (e) {
                console.error('Error:', e);
                notificar('Error: ' + e.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        renderTablaReporte() {
            const tbody = this.el(this.busqId('tbody'));
            const contador = this.el(this.busqId('contador'));
            if (!tbody) return;

            const inicio = (this.repPagina - 1) * this.repPorPagina;
            const fin = inicio + this.repPorPagina;
            const datosPagina = this.repDatos.slice(inicio, fin);
            const totalPaginas = Math.ceil(this.repDatos.length / this.repPorPagina) || 1;

            if (contador) {
                contador.textContent = this.repDatos.length + ' registros (Página ' + this.repPagina + ' de ' + totalPaginas + ')';
            }

            if (datosPagina.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#718096;">No hay registros que coincidan con los filtros</td></tr>';
            } else {
                tbody.innerHTML = datosPagina.map((row, i) => {
                    const estado = this.calcularEstadoReporte(row);
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
                        <td>${formatDate(row.fecha_factura)}</td>
                    </tr>`;
                }).join('');
            }

            this.renderPaginacionReporte(totalPaginas);
        }

        renderPaginacionReporte(totalPaginas) {
            const contenedor = this.el(this.busqId('paginacion'));
            if (!contenedor) return;

            if (totalPaginas <= 1) {
                contenedor.innerHTML = '';
                return;
            }

            const btnStyle = 'padding:8px 14px;border:1px solid #e2e8f0;background:white;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#4a5568;transition:all 0.2s;';
            const disStyle = 'opacity:0.4;cursor:not-allowed;';

            contenedor.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;padding:15px;border-top:1px solid #e2e8f0;';
            contenedor.innerHTML = `
                <button data-action="rep-goto-page" data-page="first" style="${btnStyle}${this.repPagina === 1 ? disStyle : ''}" ${this.repPagina === 1 ? 'disabled' : ''}>|&lt;</button>
                <button data-action="rep-goto-page" data-page="prev" style="${btnStyle}${this.repPagina === 1 ? disStyle : ''}" ${this.repPagina === 1 ? 'disabled' : ''}>&lt;</button>
                <span style="font-size:13px;color:#64748b;font-weight:500;margin:0 10px;">Página ${this.repPagina} de ${totalPaginas}</span>
                <button data-action="rep-goto-page" data-page="next" style="${btnStyle}${this.repPagina >= totalPaginas ? disStyle : ''}" ${this.repPagina >= totalPaginas ? 'disabled' : ''}>&gt;</button>
                <button data-action="rep-goto-page" data-page="last" style="${btnStyle}${this.repPagina >= totalPaginas ? disStyle : ''}" ${this.repPagina >= totalPaginas ? 'disabled' : ''}>&gt;|</button>
                <span style="font-size:12px;color:#718096;margin-left:15px;">Mostrar:</span>
                <select data-action-change="rep-items-per-page" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;">
                    ${[10, 25, 50, 100].map(n => `<option value="${n}" ${n === this.repPorPagina ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
            `;
        }

        repGoToPage(page) {
            const totalPaginas = Math.ceil(this.repDatos.length / this.repPorPagina) || 1;
            if (page === 'first') page = 1;
            else if (page === 'prev') page = this.repPagina - 1;
            else if (page === 'next') page = this.repPagina + 1;
            else if (page === 'last') page = totalPaginas;

            if (page < 1 || page > totalPaginas) return;
            this.repPagina = page;
            this.renderTablaReporte();

            const tablaContainer = this.el(this.busqId('tabla-container'));
            if (tablaContainer) tablaContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        repChangeItemsPerPage(valor) {
            this.repPorPagina = parseInt(valor) || 10;
            this.repPagina = 1;
            this.renderTablaReporte();
        }

        renderGraficosReporte() {
            const porEstado = {
                pendiente: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'Pendiente').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0),
                pagado: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'Pagado').reduce((s, r) => s + (parseFloat(r.monto_depositados) || 0), 0),
                mora: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'En Mora').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0)
            };

            const maxValor = Math.max(porEstado.pendiente, porEstado.pagado, porEstado.mora, 1);

            const barras = this.el(this.busqId('graf-barras'));
            if (barras) {
                barras.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pendiente</div>
                            <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                                <div style="height:100%;width:${(porEstado.pendiente / maxValor * 100)}%;background:linear-gradient(90deg,#f6e05e,#d69e2e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                                    <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pendiente)}</span>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pagado</div>
                            <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                                <div style="height:100%;width:${(porEstado.pagado / maxValor * 100)}%;background:linear-gradient(90deg,#68d391,#38a169);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                                    <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pagado)}</span>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">En Mora</div>
                            <div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;">
                                <div style="height:100%;width:${(porEstado.mora / maxValor * 100)}%;background:linear-gradient(90deg,#fc8181,#e53e3e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;">
                                    <span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.mora)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            const total = this.repResumen.total_facturado || 1;
            const pagadoPct = ((this.repResumen.total_depositado || 0) / total * 100).toFixed(1);
            const pendientePct = ((this.repResumen.total_deuda || 0) / total * 100).toFixed(1);

            const pastel = this.el(this.busqId('graf-pastel'));
            if (pastel) {
                pastel.innerHTML = `
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
        }

        limpiarReporte() {
            const b = (n) => this.el(this.busqId(n));
            const setVal = (n, v) => { const el = b(n); if (el) el.value = v; };
            setVal('fecha-desde', '');
            setVal('fecha-hasta', '');
            setVal('estado', 'todos');
            setVal('monto-min', '');
            setVal('monto-max', '');
            setVal('nombre', '');

            const resumen = b('resumen'), tabla = b('tabla-container'),
                  graficos = b('graficos'), exportar = b('exportar'), paginacion = b('paginacion');
            if (resumen) resumen.style.display = 'none';
            if (tabla) tabla.style.display = 'none';
            if (graficos) graficos.style.display = 'none';
            if (exportar) exportar.style.display = 'none';
            if (paginacion) paginacion.innerHTML = '';

            this.repPagina = 1;
            this.repDatos = [];
            this.repResumen = {};
        }

        // ---------- Exportación Excel ----------
        exportarReporteExcel() {
            if (this.repDatos.length === 0) {
                notificar('No hay datos para exportar', 'error');
                return;
            }

            const datosExcel = this.repDatos.map(row => ({
                'Nro Factura': row.nro_factura || '',
                'Cliente': row.nombre_apellido || '',
                'Cédula': row.cedula || '',
                'Monto Factura': parseFloat(row.monto_factura) || 0,
                'Cuotas': row.cuotas || '',
                'Depositado': parseFloat(row.monto_depositados) || 0,
                'Deuda': parseFloat(row.deuda) || 0,
                'Estado': this.calcularEstadoReporte(row).texto,
                'Fecha Factura': row.fecha_factura || ''
            }));

            datosExcel.push({});
            datosExcel.push({
                'Nro Factura': 'RESUMEN',
                'Cliente': 'Total Clientes: ' + this.repResumen.total_clientes,
                'Monto Factura': this.repResumen.total_facturado,
                'Depositado': this.repResumen.total_depositado,
                'Deuda': this.repResumen.total_deuda,
                'Estado': 'Clientes Mora: ' + this.repResumen.clientes_mora
            });

            const nombreArchivo = 'busqueda_' + this.cfg.key + '_' + new Date().toISOString().split('T')[0];

            // XLSX (SheetJS) si está disponible; si no, fallback a CSV
            if (typeof XLSX !== 'undefined') {
                const ws = XLSX.utils.json_to_sheet(datosExcel);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Reporte ' + this.cfg.nombre);
                ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
                XLSX.writeFile(wb, nombreArchivo + '.xlsx');
                notificar('Excel exportado correctamente', 'success');
            } else {
                console.warn('XLSX no disponible, exportando como CSV');
                const headers = Object.keys(datosExcel[0]);
                const csv = [headers.join(',')]
                    .concat(datosExcel.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(',')))
                    .join('\n');
                downloadFile('\uFEFF' + csv, nombreArchivo + '.csv', 'text/csv;charset=utf-8');
                notificar('Exportado como CSV (librería Excel no disponible)', 'success');
            }
        }

        // ---------- Exportación PDF ----------
        exportarReportePDF() {
            if (this.repDatos.length === 0) {
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
            const repDatos = this.repDatos;
            const nombreTienda = this.cfg.nombre;
            const keyTienda = this.cfg.key;

            function cargarLogoComoBase64(url) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = function () {
                        reject(new Error('No se pudo cargar el logo'));
                    };
                    img.src = url;
                });
            }

            const generarPDF = async () => {
                let logoBase64 = null;
                try {
                    logoBase64 = await cargarLogoComoBase64('assets/logo.png');
                } catch (e) {
                    console.log('Logo no disponible, continuando sin logo');
                }

                // --- ENCABEZADO ---
                let currentY = 12;

                if (logoBase64) {
                    doc.addImage(logoBase64, 'PNG', margin, currentY, 50, 38);
                }

                doc.setFontSize(20);
                doc.setTextColor(26, 54, 93);
                doc.setFont('helvetica', 'bold');
                const titulo = 'Gestion de Creditos Inversora IPSFA C.A';
                const tituloWidth = doc.getTextWidth(titulo);
                doc.text(titulo, (pageWidth - tituloWidth) / 2, currentY + 16);

                doc.setFontSize(11);
                doc.setTextColor(100, 100, 100);
                doc.setFont('helvetica', 'normal');
                const subtitulo = 'Reporte de Busqueda Tienda ' + nombreTienda;
                const subtituloWidth = doc.getTextWidth(subtitulo);
                doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, currentY + 24);

                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                const fechaTexto = 'Fecha: ' + new Date().toLocaleDateString('es-VE') + '  |  Hora: ' + new Date().toLocaleTimeString('es-VE') + '  |  Total Registros: ' + repDatos.length;
                const fechaWidth = doc.getTextWidth(fechaTexto);
                doc.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY + 32);

                currentY += 48;

                doc.setDrawColor(26, 54, 93);
                doc.setLineWidth(0.5);
                doc.line(margin, currentY, pageWidth - margin, currentY);

                currentY += 8;

                // --- TABLA DE DATOS ---
                const headers = [['Nro', 'Factura', 'Cliente', 'Cedula', 'Telefono', 'Monto', 'Depositado', 'Deuda', 'Fecha']];
                const rows = repDatos.map((row, i) => [
                    i + 1,
                    row.nro_factura || '-',
                    row.nombre_apellido || '-',
                    row.cedula || '-',
                    row.telefono || '-',
                    formatCurrency(row.monto_factura || 0),
                    formatCurrency(row.monto_depositados || 0),
                    formatCurrency(row.deuda || 0),
                    formatDate(row.fecha_factura)
                ]);

                const colNro = 10, colFactura = 18, colCliente = 50, colCedula = 22,
                      colTelefono = 25, colMonto = 28, colDepositado = 28, colDeuda = 28, colFecha = 22;
                const totalColWidth = colNro + colFactura + colCliente + colCedula + colTelefono + colMonto + colDepositado + colDeuda + colFecha;
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
                        0: { cellWidth: colNro * scaleFactor, halign: 'center' },
                        1: { cellWidth: colFactura * scaleFactor, halign: 'center' },
                        2: { cellWidth: colCliente * scaleFactor, halign: 'left' },
                        3: { cellWidth: colCedula * scaleFactor, halign: 'center' },
                        4: { cellWidth: colTelefono * scaleFactor, halign: 'center' },
                        5: { cellWidth: colMonto * scaleFactor, halign: 'right' },
                        6: { cellWidth: colDepositado * scaleFactor, halign: 'right' },
                        7: { cellWidth: colDeuda * scaleFactor, halign: 'right' },
                        8: { cellWidth: colFecha * scaleFactor, halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text('Inversora IPSFA - Sistema de Creditos', margin, pageHeight - 10);
                        doc.text('Pagina ' + data.pageNumber, pageWidth - margin - 20, pageHeight - 10);
                    }
                });

                // --- LEYENDA DE SUMATORIAS AL FINAL ---
                const finalY = doc.lastAutoTable.finalY + 10;

                const totalFacturado = repDatos.reduce((sum, r) => sum + (parseFloat(r.monto_factura) || 0), 0);
                const totalDepositado = repDatos.reduce((sum, r) => sum + (parseFloat(r.monto_depositados) || 0), 0);
                const totalDeuda = repDatos.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0);

                if (finalY + 50 > pageHeight - 20) {
                    doc.addPage();
                    currentY = 20;
                } else {
                    currentY = finalY;
                }

                const resumenHeight = 42;
                doc.setFillColor(26, 54, 93);
                doc.rect(margin, currentY, contentWidth, resumenHeight, 'F');

                doc.setFontSize(13);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                const tituloResumen = 'TOTALES DEL REPORTE';
                const tituloResumenWidth = doc.getTextWidth(tituloResumen);
                doc.text(tituloResumen, (pageWidth - tituloResumenWidth) / 2, currentY + 8);

                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(0.3);
                doc.line(margin + 5, currentY + 12, pageWidth - margin - 5, currentY + 12);

                const colWidth = contentWidth / 3;
                const col1X = margin + 10;
                const col2X = margin + colWidth + 10;
                const col3X = margin + (colWidth * 2) + 10;

                doc.setFontSize(9);
                doc.setTextColor(200, 200, 200);
                doc.setFont('helvetica', 'normal');
                doc.text('TOTAL MONTO FACTURADO', col1X, currentY + 20);
                doc.text('TOTAL DEPOSITADO', col2X, currentY + 20);
                doc.text('TOTAL DEUDA PENDIENTE', col3X, currentY + 20);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(251, 191, 36);
                doc.text(formatCurrency(totalFacturado), col1X, currentY + 30);

                doc.setTextColor(74, 222, 128);
                doc.text(formatCurrency(totalDepositado), col2X, currentY + 30);

                doc.setTextColor(248, 113, 113);
                doc.text(formatCurrency(totalDeuda), col3X, currentY + 30);

                doc.setFontSize(9);
                doc.setTextColor(200, 200, 200);
                doc.setFont('helvetica', 'normal');
                const clientesTexto = repDatos.length + ' clientes en el reporte';
                const clientesWidth = doc.getTextWidth(clientesTexto);
                doc.text(clientesTexto, (pageWidth - clientesWidth) / 2, currentY + 38);

                doc.save('busqueda_' + keyTienda + '_' + new Date().toISOString().split('T')[0] + '.pdf');
                notificar('PDF exportado correctamente', 'success');
            };

            generarPDF().catch(err => {
                console.error('Error generando PDF:', err);
                notificar('Error al generar PDF: ' + err.message, 'error');
            });
        }

        // ====================================================
        // DELEGACIÓN DE EVENTOS
        // (reemplaza TODOS los onclick inline: un solo listener
        //  por tipo de evento en el contenedor del módulo)
        // ====================================================
        attachEvents(container) {
            // --- CLICK ---
            container.addEventListener('click', (ev) => {
                const target = ev.target.closest('[data-action]');
                if (!target) return;

                const action = target.dataset.action;
                const id = target.dataset.id ? parseInt(target.dataset.id) : null;

                switch (action) {
                    case 'show-menu': this.showView('menu'); break;
                    case 'show-base-datos': this.showView('baseDatos'); break;
                    case 'show-conciliaciones': this.showView('conciliaciones'); break;
                    case 'show-reportes': this.showView('reportes'); break;
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

                    case 'generar-reporte': this.generarReporte(); break;
                    case 'limpiar-reporte': this.limpiarReporte(); break;
                    case 'rep-goto-page': this.repGoToPage(target.dataset.page); break;
                    case 'exportar-reporte-excel': this.exportarReporteExcel(); break;
                    case 'exportar-reporte-pdf': this.exportarReportePDF(); break;
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
