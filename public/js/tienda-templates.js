// ============================================================
// tienda-templates.js - Plantillas HTML para las Tiendas
// ============================================================

// ============================================================
// CORRECCIÓN DE ESTILOS PARA REPORTES
// ============================================================
(function() {
    // Inyectamos un estilo CSS para garantizar que los reportes se vean
    const estiloReportes = document.createElement('style');
    estiloReportes.textContent = `
        .reportes-container {
            display: block !important;
            width: 100% !important;
            min-height: 500px !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
        }
        .reportes-container[style*="display: none"] {
            display: none !important; /* Respeta la ocultación inicial */
        }
    `;
    document.head.appendChild(estiloReportes);
})();
// ============================================================


(function() {
    'use strict';

    if (typeof window.TiendaApp === 'undefined') {
        console.error("Error: TiendaApp no está definida. Asegúrate de cargar tienda-app.js primero.");
        return;
    }

    const proto = window.TiendaApp.prototype;

    // --- 1. Plantilla del Menú Principal ---
    proto.getHtmlMenuPrincipal = function() {
        const id = (n) => this.id('tm2-' + n);
        const svg = {
            bd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
            conc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
            est: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
            rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
        };
        const card = (accion, icono, titulo, desc, badgeId, metId) => `
            <div class="tm2-card" data-action="${accion}" role="button" tabindex="0">
                <div class="tm2-card-head"><div class="tm2-ico">${icono}</div><div class="tm2-badge gris" id="${badgeId}">—</div></div>
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
                <div class="tm2-panel"><h3>Cobranza del mes</h3><div class="tm2-sub">Clientes con al menos una cuota pagada en el mes</div><div class="tm2-prog"><div id="${id('prog')}" style="width:0%"></div></div><div class="tm2-prog-nums"><span><b id="${id('cm-cuotas')}">—</b> clientes cobrados</span><span><b id="${id('cm-pct')}">—</b> del mes</span></div><div class="tm2-mini"><div class="tm2-m"><div class="tm2-m-v" id="${id('cm-hoy')}">—</div><div class="tm2-m-l">Cobrado hoy</div></div><div class="tm2-m"><div class="tm2-m-v" id="${id('cm-pagos-hoy')}">—</div><div class="tm2-m-l">Pagos hoy</div></div><div class="tm2-m"><div class="tm2-m-v" id="${id('cm-faltan')}">—</div><div class="tm2-m-l">Clientes por cobrar</div></div></div></div>
                <div class="tm2-panel"><h3>Alertas operativas</h3><div class="tm2-sub">Lo que requiere atención hoy</div><div id="${id('alertas')}"></div></div>
            </div>
            <div class="tm2-grid tm2-g-2-1">
                <div class="tm2-panel"><h3>Evolución de cobros — últimos 6 meses</h3><div class="tm2-sub">Monto cobrado por mes (solo esta tienda)</div><div id="${id('ch-evo')}" class="tm2-chart"></div></div>
                <div class="tm2-panel"><h3>Estado de cartera</h3><div class="tm2-sub">Créditos según su situación de pago</div><div id="${id('ch-donut')}" class="tm2-chart"></div></div>
            </div>
            <div class="tm2-grid tm2-g2">
                <div class="tm2-panel"><h3>Mayor tiempo sin pagar</h3><div class="tm2-sub">Ordenado por meses sin pagar; en empate, mayor deuda</div><table class="tm2-tabla"><thead><tr><th>Cliente</th><th>Sin pagar</th><th class="num">Deuda</th></tr></thead><tbody id="${id('tb-sinpagar')}"></tbody></table></div>
                <div class="tm2-panel"><h3>Últimos pagos registrados</h3><div class="tm2-sub">Actividad reciente de la tienda</div><table class="tm2-tabla"><thead><tr><th>Cliente</th><th>Fecha</th><th class="num">Monto</th></tr></thead><tbody id="${id('tb-ultimos')}"></tbody></table></div>
            </div>
        </div>`;
    };

    // --- 2. Plantilla de Base de Datos ---
    proto.getHtmlBaseDatos = function() {
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
                    <div class="search-field date-field"><input type="date" id="fecha-desde${sfx}" data-action-change="apply-filters"><span>a</span><input type="date" id="fecha-hasta${sfx}" data-action-change="apply-filters"></div>
                    <div class="search-field"><input type="number" id="monto-min${sfx}" placeholder="Monto minimo" data-action-input="debounced-filter"><span>-</span><input type="number" id="monto-max${sfx}" placeholder="Monto maximo" data-action-input="debounced-filter"></div>
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
            <div class="table-container"><table class="data-table" id="tabla-clientes${sfx}"><thead><tr><th>N</th><th>Fact.</th><th>Cliente</th><th>Monto (Bs)</th><th>Fecha</th><th>Cedula</th><th>Cuotas</th><th>Depositado (Bs)</th><th>Deuda (Bs)</th><th>Estado</th><th>Acc.</th></tr></thead><tbody id="tabla-body${sfx}"></tbody></table></div>
            <div class="pagination">
                <button id="btn-primero${sfx}" data-action="goto-page" data-page="first" disabled>|&lt;</button>
                <button id="btn-anterior${sfx}" data-action="goto-page" data-page="prev" disabled>&lt;</button>
                <span id="pagina-info${sfx}">Pagina 1 de 1</span>
                <button id="btn-siguiente${sfx}" data-action="goto-page" data-page="next">&gt;</button>
                <button id="btn-ultimo${sfx}" data-action="goto-page" data-page="last">&gt;|</button>
                <select id="registros-por-pagina${sfx}" data-action-change="items-per-page"><option value="10">10</option><option value="25" selected>25</option><option value="50">50</option><option value="100">100</option></select>
            </div>
            <div class="export-buttons">
                <button class="btn-export excel" data-action="export-excel">&#128190; Exportar Excel</button>
                <button class="btn-export pdf" data-action="export-pdf">&#128196; Exportar PDF</button>
                <button class="btn-export print" data-action="print-table">&#128424; Imprimir</button>
            </div>
        </div>`;
    };

    // --- 3. Plantilla de Conciliaciones ---
    proto.getHtmlConciliaciones = function() {
        const c = this.cfg.concPfx;
        const color = this.color;
        const key = this.cfg.key;
        return `
        <div id="${this.id('conciliaciones')}" style="display: none;">
            <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
            <div class="section-header"><h3>Conciliaciones Bancarias</h3><p>Registro de depositos bancarios por numero de factura</p></div>
            <div class="card" style="margin-bottom: 20px; padding: 25px;">
                <div id="${c}-mensaje-inicial" style="text-align:center;padding:30px;color:#718096;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:10px;opacity:.5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><p>Ingrese un número de factura para buscar o cree un nuevo registro.</p></div>
                
                <div id="${c}-busqueda"><h4>Buscar Factura</h4><div class="form-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;"><input type="text" id="${c}-factura-buscar" placeholder="Numero de Factura" style="flex:1;min-width:200px;padding:10px;border:1px solid #ddd;border-radius:6px;" onkeypress="if(event.key==='Enter')window.Tiendas.get('${key}').buscarFactura()"><button onclick="window.Tiendas.get('${key}').buscarFactura()" class="btn-primary" style="background:${color};color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Buscar</button><button onclick="window.Tiendas.get('${key}').mostrarNuevoRegistro()" class="btn-success" style="background:#38a169;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">+ Nuevo Registro</button></div></div>

                <div id="${c}-resultado-encontrada" style="display:none;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;"><h4 style="color:${color};margin:0;">Factura Encontrada</h4><button onclick="window.Tiendas.get('${key}').volverABuscarFactura()" style="background:#e2e8f0;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;">&#8592; Volver a búsqueda</button></div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;"><div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Factura</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-factura">-</div></div><div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cliente</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-nombre">-</div></div><div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cédula</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-cedula">-</div></div><div style="background:#f8fafc;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Monto</div><div style="font-size:16px;font-weight:700;color:#1a365d;" id="${c}-info-monto">-</div></div><div style="background:#fff5f5;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Deuda</div><div style="font-size:16px;font-weight:700;color:#e53e3e;" id="${c}-info-deuda">-</div></div><div style="background:#f0fff4;padding:12px;border-radius:8px;"><div style="font-size:10px;color:#718096;text-transform:uppercase;">Cuotas</div><div style="font-size:16px;font-weight:700;color:#38a169;" id="${c}-info-cuotas">-</div></div></div>
                    <h5 style="margin:15px 0 8px;color:#1a365d;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Historial de Cuotas</h5><div style="overflow-x:auto;margin-bottom:20px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>Cuota</th><th>Monto Bs</th><th>Referencia</th><th>Fecha</th><th>Tasa</th><th>Monto $</th></tr></thead><tbody id="${c}-tabla-cuotas-body"></tbody></table></div>
                    <div data-card="form-cuota" style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;background:#fff;"><h5 style="margin:0 0 12px;color:${color};font-size:13px;">Registrar Nueva Cuota</h5><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;"><div class="form-group"><label>N° Cuota</label><input type="number" id="${c}-cuota-numero" readonly style="background:#f7fafc;font-weight:700;"></div><div class="form-group"><label>Monto (Bs) *</label><input type="number" id="${c}-cuota-monto" step="0.01" oninput="window.Tiendas.get('${key}').calcularDolar()"></div><div class="form-group"><label>Referencia *</label><input type="text" id="${c}-cuota-ref"></div><div class="form-group"><label>Fecha *</label><input type="date" id="${c}-cuota-fecha" onchange="window.Tiendas.get('${key}').obtenerTasaPorFecha()"></div><div class="form-group"><label>Tasa BCV *</label><input type="number" id="${c}-cuota-tasa" step="0.0001" oninput="window.Tiendas.get('${key}').calcularDolar()"></div><div class="form-group"><label>Monto ($)</label><input type="number" id="${c}-cuota-dolar" readonly style="background:#ebf8ff;font-weight:600;"></div></div><div id="${c}-tasa-mensaje" style="margin-top:8px;font-size:11px;"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;"><button onclick="window.Tiendas.get('${key}').limpiarFormularioConciliacion()" style="background:#e2e8f0;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Limpiar</button><button onclick="window.Tiendas.get('${key}').guardarCuota()" style="background:${color};color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600;">&#128190; Guardar Cuota</button></div></div>
                </div>

                <div id="${c}-no-encontrada" style="display:none;text-align:center;padding:30px;"><div style="font-size:48px;margin-bottom:10px;">&#128269;</div><h4 style="color:#e53e3e;margin:0 0 8px;">Factura no encontrada</h4><p style="color:#718096;margin:0 0 15px;">No existe la factura N° <strong id="${c}-no-encontrada-numero"></strong> en esta tienda.</p><button onclick="window.Tiendas.get('${key}').mostrarFormularioNuevoRegistro()" style="background:${color};color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Crear nuevo registro</button></div>

                <div id="${c}-nuevo-registro" style="display:none;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;"><h4 style="color:${color};margin:0;">Nuevo Registro de Credito</h4><button onclick="window.Tiendas.get('${key}').volverABuscar()" style="background:#e2e8f0;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;">&#8592; Volver</button></div>
                    <div class="tabs-nuevo-registro" style="margin-bottom:20px;"><div class="tab-header" style="display:flex;border-bottom:2px solid #e2e8f0;gap:4px;"><button type="button" class="tab-btn active" data-tab="factura" onclick="window.Tiendas.get('${key}').cambiarTabNuevoRegistro('factura')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid ${color};transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="font-size:16px;">&#128196;</span> Datos de la Factura</button><button type="button" class="tab-btn" data-tab="inicial" onclick="window.Tiendas.get('${key}').cambiarTabNuevoRegistro('inicial')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="font-size:16px;">&#128176;</span> Deposito Inicial</button><button type="button" class="tab-btn" data-tab="cuotas" onclick="window.Tiendas.get('${key}').cambiarTabNuevoRegistro('cuotas')" style="flex:1;padding:12px 16px;border:none;background:transparent;color:#718096;font-size:13px;font-weight:600;cursor:pointer;border-bottom:3px solid transparent;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="font-size:16px;">&#128202;</span> Plan de Cuotas</button></div></div>
                    <div class="nuevo-registro-form">
                        <div id="${c}-tab-factura" class="tab-panel active" style="display:block;"><div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;"><h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128196; Datos de la Factura</h4><div class="form-grid-2"><div class="form-group"><label>N° Factura *</label><input type="text" id="${c}-nueva-factura" required></div><div class="form-group"><label>Fecha Factura *</label><input type="date" id="${c}-nueva-fecha-factura" required></div><div class="form-group"><label>Nombre y Apellido *</label><input type="text" id="${c}-nueva-nombre" required></div><div class="form-group"><label>Cedula</label><input type="text" id="${c}-nueva-cedula"></div><div class="form-group"><label>Telefono</label><input type="text" id="${c}-nueva-telefono" placeholder="0412-1234567"></div><div class="form-group"><label>Monto Factura (Bs) *</label><input type="number" id="${c}-nueva-monto" min="0" step="0.01" required></div><div class="form-group"><label>Tasa BCV Factura *</label><input type="number" id="${c}-nueva-tasa-factura" min="0.0001" step="0.0001" required placeholder="Auto"></div><div class="form-group"><label>Monto Facturado ($)</label><input type="number" id="${c}-nueva-monto-usd" readonly class="calculado"></div></div><div style="display:flex;justify-content:flex-end;margin-top:16px;"><button type="button" onclick="window.Tiendas.get('${key}').siguienteTabNuevoRegistro('inicial')" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Siguiente &#8594;</button></div></div></div>
                        <div id="${c}-tab-inicial" class="tab-panel" style="display:none;"><div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;"><h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128176; Deposito Inicial</h4><div class="form-grid-2"><div class="form-group"><label>Inicial (Bs) *</label><input type="number" id="${c}-nueva-inicial-bs" min="0" step="0.01" required><div class="form-error" id="${c}-error-inicial"></div></div><div class="form-group"><label>Inicial ($)</label><input type="number" id="${c}-nueva-inicial-usd" readonly class="calculado"></div><div class="form-group"><label>Referencia Inicial *</label><input type="text" id="${c}-nueva-ref-inicial" required></div><div class="form-group"><label>Fecha Inicial *</label><input type="date" id="${c}-nueva-fecha-inicial" required><div class="form-error" id="${c}-error-fecha-inicial"></div></div><div class="form-group"><label>Tasa BCV Inicial *</label><input type="number" id="${c}-nueva-tasa-inicial" min="0.0001" step="0.0001" required placeholder="Auto"></div></div><div style="display:flex;justify-content:space-between;margin-top:16px;"><button type="button" onclick="window.Tiendas.get('${key}').cambiarTabNuevoRegistro('factura')" style="background:#e2e8f0;color:#4a5568;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#8592; Anterior</button><button type="button" onclick="window.Tiendas.get('${key}').siguienteTabNuevoRegistro('cuotas')" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Siguiente &#8594;</button></div></div></div>
                        <div id="${c}-tab-cuotas" class="tab-panel" style="display:none;"><div class="form-bloque" style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;background:#f8fafc;"><h4 style="margin:0 0 16px 0;font-size:14px;color:#1a365d;">&#128202; Plan de Cuotas</h4><div class="form-grid-3"><div class="form-group"><label>Total de Cuotas *</label><select id="${c}-nueva-total-cuotas" required><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4" selected>4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option></select></div><div class="form-group"><label>Deuda ($)</label><input type="number" id="${c}-nueva-deuda-usd" readonly class="calculado"></div><div class="form-group"><label>Monto Cuota ($)</label><input type="number" id="${c}-nueva-monto-cuota" readonly class="calculado"></div></div><div style="display:flex;justify-content:space-between;margin-top:16px;"><button type="button" onclick="window.Tiendas.get('${key}').cambiarTabNuevoRegistro('inicial')" style="background:#e2e8f0;color:#4a5568;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#8592; Anterior</button><div style="display:flex;gap:10px;"><button onclick="window.Tiendas.get('${key}').limpiarFormularioNuevaConciliacion()" style="background:#e2e8f0;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px;">Limpiar</button><button onclick="window.Tiendas.get('${key}').guardarNuevaConciliacion()" style="background:${color};color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">&#128190; Guardar Registro</button></div></div></div></div>
                </div>
            </div>
        </div>`;
    };

    // --- 4. Plantilla de Reportes ---
    proto.getHtmlReportes = function() {
        const b = this.cfg.busqPfx;
        return `
        <div id="${this.id('busqueda')}" class="reportes-container" style="display: none;">
            <button data-action="show-menu" class="btn-volver">&#8592; Volver al Menu</button>
            <div style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; border-radius: 12px;"><h2><i class="fas fa-chart-bar"></i> Reportes Tienda ${this.nombre}</h2><p style="opacity: 0.9; margin-top: 5px;">Genera reportes personalizados con filtros avanzados</p></div>
            <div class="card" style="margin-bottom: 20px; padding: 25px;"><h4 style="margin-bottom: 15px; color: #1a365d;"><i class="fas fa-filter"></i> Filtros del Reporte</h4><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;"><div class="form-group"><label>Fecha Desde</label><input type="date" id="${b}-fecha-desde"></div><div class="form-group"><label>Fecha Hasta</label><input type="date" id="${b}-fecha-hasta"></div><div class="form-group"><label>Estado</label><select id="${b}-estado"><option value="todos">Todos</option><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option><option value="mora">En Mora</option><option value="abiertas">Facturas Abiertas</option><option value="canceladas">Facturas Canceladas</option></select></div><div class="form-group"><label>Monto Deuda Min</label><input type="number" id="${b}-monto-min" placeholder="0.00"></div><div class="form-group"><label>Monto Deuda Max</label><input type="number" id="${b}-monto-max" placeholder="9999999"></div><div class="form-group"><label>Nombre Cliente</label><input type="text" id="${b}-nombre" placeholder="Buscar cliente..."></div></div><div style="display: flex; gap: 10px; justify-content: flex-end;"><button data-action="limpiar-reporte" style="padding: 10px 20px; background: #edf2f7; color: #4a5568; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;"><i class="fas fa-eraser"></i> Limpiar</button><button data-action="generar-reporte" style="padding: 10px 24px; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);"><i class="fas fa-sync-alt"></i> Generar Reporte</button></div></div>
            <div id="${b}-resumen" style="display: none; margin-bottom: 20px;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;"><div class="card" style="border-left: 4px solid #4299e1; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-total">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Total Clientes</div></div><div class="card" style="border-left: 4px solid #f56565; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-deuda">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Deuda Total</div></div><div class="card" style="border-left: 4px solid #48bb78; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-pagado">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Total Pagado</div></div><div class="card" style="border-left: 4px solid #ed8936; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-mora">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Clientes en Mora</div></div><div class="card" style="border-left: 4px solid #9f7aea; padding: 20px;"><div style="font-size: 28px; font-weight: 700; color: #1a365d;" id="${b}-res-promedio">0</div><div style="font-size: 12px; color: #718096; text-transform: uppercase;">Promedio Deuda</div></div></div></div>
            <div class="card" id="${b}-tabla-container" style="display: none; margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;"><h4 style="color: #1a365d;"><i class="fas fa-list"></i> Resultados</h4><span style="font-size: 13px; color: #718096; background: #edf2f7; padding: 6px 14px; border-radius: 20px;" id="${b}-contador">0 registros</span></div><div style="overflow-x: auto;"><table class="data-table" id="${b}-tabla"><thead><tr style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white;"><th>Nro</th><th>Factura</th><th>Cliente</th><th>Cedula</th><th>Monto</th><th>Cuotas</th><th>Depositado</th><th>Deuda</th><th>Estado</th><th>Fecha</th></tr></thead><tbody id="${b}-tbody"></tbody></table></div><div id="${b}-paginacion"></div></div>
            <div id="${b}-graficos" style="display: none; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;"><div class="card" style="padding: 25px;"><h4 style="margin-bottom: 20px; color: #1a365d;"><i class="fas fa-chart-bar"></i> Deuda por Estado</h4><div id="${b}-graf-barras"></div></div><div class="card" style="padding: 25px;"><h4 style="margin-bottom: 20px; color: #1a365d;"><i class="fas fa-chart-pie"></i> Distribución de Pagos</h4><div id="${b}-graf-pastel" style="display: flex; align-items: center; justify-content: center; gap: 30px;"></div></div></div>
            <div id="${b}-exportar" style="display: none; text-align: center; padding: 20px; border-top: 1px solid #e2e8f0;"><div style="display: inline-flex; gap: 20px;"><button data-action="exportar-reporte-excel" style="padding: 15px 30px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; color: #15803d; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 180px;"><i class="fas fa-file-excel" style="font-size: 32px; color: #22c55e;"></i><span>Exportar Excel</span><small style="font-size: 11px; opacity: 0.7;">.xlsx</small></button><button data-action="exportar-reporte-pdf" style="padding: 15px 30px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; color: #b91c1c; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 180px;"><i class="fas fa-file-pdf" style="font-size: 32px; color: #ef4444;"></i><span>Exportar PDF</span><small style="font-size: 11px; opacity: 0.7;">.pdf</small></button></div></div>
        </div>`;
    };

    console.log('✅ Plantillas HTML de tiendas cargadas.');
})();