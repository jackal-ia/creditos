// ============================================================
// tienda-app.js - Lógica COMPLETA Y VERIFICADA
// ============================================================
(function() {
    'use strict';

    if (typeof window.TiendaApp !== 'undefined') {
        console.warn("⚠️ TiendaApp ya estaba definida. Sobrescribiendo...");
    }

    class TiendaApp {
        constructor(cfg) {
            this.cfg = cfg;
            this.key = cfg.key;
            this.nombre = cfg.nombre;
            this.color = TM_COLORES[cfg.key]?.acento || '#3182ce';

            // Estados
            this.allData = [];
            this.filteredData = [];
            this.currentPage = 1;
            this.itemsPerPage = ITEMS_PER_PAGE_DEFAULT;
            this.currentFilter = 'abiertas';
            this.initialized = false;
            this.debounceTimer = null;
            this.currentEditId = null;
            this.currentEditItem = null;
            this.cuotasAEliminar = [];
            this.concCliente = null;
            this.concTasa = null;
            this.repDatos = [];
            this.repResumen = {};
            this.repPagina = 1;
            this.repPorPagina = 10;
            this.mounted = false;
        }

        // Helpers
        id(nombre) { return this.cfg.pfx + '-' + nombre; }
        concId(nombre) { return this.cfg.concPfx + '-' + nombre; }
        busqId(nombre) { return this.cfg.busqPfx + '-' + nombre; }
        e(nombre) { return nombre + this.cfg.sfx; }
        el(domId) { return document.getElementById(domId); }

        _apiFetch(url, opts) {
            const token = localStorage.getItem('token');
            opts = opts || {};
            opts.headers = Object.assign({}, opts.headers, token ? { 'Authorization': 'Bearer ' + token } : {});
            return fetch(url, opts);
        }

        // ====================================================
        // MONTAJE
        // ====================================================
        mount() {
            if (this.mounted) return;
            const container = this.el(this.cfg.contentId);
            if (!container) {
                console.error(`[Tiendas] No existe #${this.cfg.contentId} para ${this.cfg.nombre}`);
                return;
            }
            // FIX: Forzar contenedor principal visible antes de inyectar HTML
            container.classList.remove('hidden');
            container.removeAttribute('hidden');
            container.style.removeProperty('display');
            container.style.setProperty('display', 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('position', 'relative', 'important');
            container.style.setProperty('width', '100%', 'important');
            container.style.setProperty('min-height', '100px', 'important');
            container.style.setProperty('overflow', 'visible', 'important');
            console.log(`[DEBUG Tienda ${this.cfg.nombre}] mount() — contenedor #${this.cfg.contentId} forzado a visible`);
            container.innerHTML = `
                <div class="${this.cfg.containerClass} tienda-modulo" data-tienda="${this.cfg.key}">
                    ${this.getHtmlMenuPrincipal()}
                    ${this.getHtmlBaseDatos()}
                    ${this.getHtmlConciliaciones()}
                    ${this.getHtmlReportes()}
                </div>
            `;
            this.attachEvents(container);
            this.mounted = true;
            console.log(`✅ Tienda ${this.cfg.nombre} montada`);
        }

        renderMenuPrincipal() { return this.getHtmlMenuPrincipal(); }
        renderBaseDatos() { return this.getHtmlBaseDatos(); }
        renderConciliaciones() { return this.getHtmlConciliaciones(); }
        renderReportes() { return this.getHtmlReportes(); }

        // ====================================================
        // NAVEGACIÓN (fix v6.7.6 — contenedor + !important + logs)
        // ====================================================
        showView(vista) {
            console.log(`[DEBUG Tienda ${this.cfg.nombre}] showView('${vista}') llamado`);

            // FIX 1: Forzar contenedor principal visible (puede tener .hidden del panel)
            const contenedorPrincipal = document.getElementById(this.cfg.contentId);
            if (contenedorPrincipal) {
                contenedorPrincipal.classList.remove('hidden');
                contenedorPrincipal.removeAttribute('hidden');
                contenedorPrincipal.style.removeProperty('display');
                contenedorPrincipal.style.setProperty('display', 'block', 'important');
                contenedorPrincipal.style.setProperty('visibility', 'visible', 'important');
                contenedorPrincipal.style.setProperty('opacity', '1', 'important');
                contenedorPrincipal.style.setProperty('position', 'relative', 'important');
                contenedorPrincipal.style.setProperty('width', '100%', 'important');
                contenedorPrincipal.style.setProperty('min-height', '100px', 'important');
                contenedorPrincipal.style.setProperty('overflow', 'visible', 'important');
                console.log(`[DEBUG] Contenedor principal #${this.cfg.contentId} forzado a visible`);
            } else {
                console.error(`[ERROR] No existe contenedor principal #${this.cfg.contentId}`);
            }

            const menu = this.el(this.id('menu-principal'));
            const baseDatos = this.el(this.id('base-datos'));
            const conciliaciones = this.el(this.id('conciliaciones'));
            const busqueda = this.el(this.id('busqueda'));

            console.log(`[DEBUG] Paneles encontrados: menu=${!!menu}, bd=${!!baseDatos}, conc=${!!conciliaciones}, rep=${!!busqueda}`);

            const mostrar = (el, activo, nombre) => {
                if (!el) { console.warn(`[WARN] Panel ${nombre} no encontrado`); return; }
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
                    console.log(`[DEBUG] Panel ${nombre} → VISIBLE`);
                } else {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('width', '0', 'important');
                    el.style.setProperty('min-width', '0', 'important');
                    el.style.setProperty('min-height', '0', 'important');
                    el.style.setProperty('position', 'absolute', 'important');
                    el.style.setProperty('overflow', 'hidden', 'important');
                    console.log(`[DEBUG] Panel ${nombre} → OCULTO`);
                }
            };

            mostrar(menu, vista === 'menu', 'menu');
            mostrar(baseDatos, vista === 'baseDatos', 'baseDatos');
            mostrar(conciliaciones, vista === 'conciliaciones', 'conciliaciones');
            mostrar(busqueda, vista === 'reportes', 'reportes');

            const destino = vista === 'menu' ? menu
                : (vista === 'baseDatos' ? baseDatos
                : (vista === 'conciliaciones' ? conciliaciones : busqueda));
            if (destino && destino.scrollIntoView) {
                setTimeout(() => {
                    try { destino.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
                }, 80);
            }

            if (vista === 'menu') this.initMenuDashboard();
            else if (vista === 'baseDatos') this.initDatos();
            else if (vista === 'conciliaciones') this.resetConciliaciones();
            else if (vista === 'reportes') this.initReportes();
        }        // ====================================================
        // DASHBOARD
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
            } catch (e) { console.error(`[${this.cfg.nombre}] Error en dashboard del menú:`, e); }
        }

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
                cartera += factura; cobradoTotal += depositado;
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
                                pagoEsteMes = true; cobradoMes += monto; pagosMes++;
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
                    sinPagar.push({ nombre: c.nombre_apellido || 'Sin nombre', deuda: deudaC, mesesSinPagar, ultimo: ultimaCuota, nuncaPago: !ultimaCuota });
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
                cartera, cobradoTotal, deuda, deudores, creditos: lista.length,
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

            const col = TM_COLORES[this.cfg.key] || TM_COLORES.caracas;
            raiz.style.setProperty('--acento', col.acento);
            raiz.style.setProperty('--acento-suave', col.suave);

            const r = this.tmCalcularMenu(this.allData, new Date());
            const setTxt = (n, v) => { const e = el(n); if (e) e.textContent = v; };
            const setHtml = (n, v) => { const e = el(n); if (e) e.innerHTML = v; };

            setTxt('k-cartera', 'Bs ' + TM_FMT.format(r.cartera));
            setHtml('k-creditos', '<b>' + r.creditos + '</b> créditos activos');
            setTxt('k-cobrado', 'Bs ' + TM_FMT.format(r.cobradoMes));
            setHtml('k-pagos-mes', '<b class="up">' + r.pagosMes + '</b> pagos este mes');
            setTxt('k-deuda', 'Bs ' + TM_FMT.format(r.deuda));
            setHtml('k-deudores', '<b class="warn">' + r.deudores + '</b> deudores activos');
            setTxt('k-recup', r.recuperacion.toFixed(1).replace('.', ',') + '%');

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

            const pct = r.creditos > 0 ? Math.round(r.conCuotaMes / r.creditos * 100) : 0;
            const prog = el('prog');
            if (prog) prog.style.width = pct + '%';
            setTxt('cm-cuotas', r.conCuotaMes + ' / ' + r.creditos);
            setTxt('cm-pct', pct + '%');
            setTxt('cm-hoy', 'Bs ' + TM_FMT.format(r.cobradoHoy));
            setTxt('cm-pagos-hoy', String(r.pagosHoy));
            setTxt('cm-faltan', String(r.porCobrar));

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
                        plotOptions: { pie: { donut: { size: '68%', labels: { show: true, value: { fontSize: '20px', fontWeight: 700, color: '#16324f' }, total: { show: true, label: 'créditos', fontSize: '11px', color: '#64748b' } } } } }
                    });
                    c2.render();
                    this._menuCharts.push(c2);
                }
            } else {
                setHtml('ch-evo', '<div class="tm2-sin-chart">Gráfico no disponible (ApexCharts no cargó)</div>');
                setHtml('ch-donut', '<div class="tm2-sin-chart">Gráfico no disponible (ApexCharts no cargó)</div>');
            }

            const tbSP = el('tb-sinpagar');
            if (tbSP) {
                tbSP.innerHTML = r.top5.length === 0
                    ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Sin deudores en este momento</td></tr>'
                    : r.top5.map(x => {
                        const sev = x.mesesSinPagar >= 2 ? 'r' : (x.mesesSinPagar === 1 ? 'a' : 'v');
                        const det = x.nuncaPago ? 'sin pagos registrados' : (x.ultimo ? 'último: ' + TM_MESES[x.ultimo.mes - 1] + ' ' + x.ultimo.anio : 'sin fecha');
                        const txtMeses = x.mesesSinPagar === 999 ? '—' : x.mesesSinPagar + (x.mesesSinPagar === 1 ? ' mes' : ' meses');
                        return `<tr><td class="cli">${tmEsc(x.nombre)}<span class="det">${det}</span></td><td><span class="tm2-pill ${sev}">${txtMeses}</span></td><td class="num">Bs ${TM_FMT.format(x.deuda)}</td></tr>`;
                    }).join('');
            }

            const tbU = el('tb-ultimos');
            if (tbU) {
                tbU.innerHTML = r.ultimos.length === 0
                    ? '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Sin pagos registrados</td></tr>'
                    : r.ultimos.map(x => `<tr><td class="cli">${tmEsc(x.nombre)}</td><td>${String(x.f.dia).padStart(2, '0')}/${String(x.f.mes).padStart(2, '0')}/${x.f.anio}</td><td class="num">Bs ${TM_FMT.format(x.monto)}</td></tr>`).join('');
            }
        }

        // ====================================================
        // BASE DE DATOS
        // ====================================================
        async initDatos() {
            if (this._cargando) return;
            this._cargando = true;
            await this.loadData();
            await new Promise(r => setTimeout(r, 50));
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
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const data = await response.json();
                this.allData = data.map(item => this.processItemData(item));
                this.filteredData = [...this.allData];
                console.log(`✅ [${this.cfg.nombre}] ${this.allData.length} registros cargados`);
            } catch (error) {
                console.error(`❌ [${this.cfg.nombre}] Error cargando datos:`, error);
                this.allData = [];
                this.filteredData = [];
                mostrarModalCorporativo('Error de Conexión', `No se pudieron cargar los datos de Tienda ${this.cfg.nombre}.\n\nVerifique que el servidor esté disponible e intente nuevamente.`, 'error');
            }
            showLoading(false);
        }

        processItemData(item) {
            let montoDepositado = 0, cuotasPagadas = 0;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuota = parseNumberES(item[`cuota_${i}`]);
                if (cuota > 0) { montoDepositado += cuota; cuotasPagadas++; }
            }
            const montoFactura = parseNumberES(item.monto_factura);
            let deuda = montoFactura - montoDepositado;
            if (Math.abs(montoFactura - montoDepositado) < 0.01) deuda = 0;
            item.monto_factura = montoFactura;
            item.monto_depositados = montoDepositado;
            item.deuda = deuda;
            item.cuotas_pagadas = cuotasPagadas;
            item.total_cuotas = TOTAL_CUOTAS;
            return item;
        }

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

        renderTable() {
            const tbody = this.el('tabla-body' + this.cfg.sfx);
            if (!tbody) return;

            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            const pageData = this.filteredData.slice(start, end);

            if (pageData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i> No se encontraron registros</td></tr>`;
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

            const estadoClass = { 'aldia': 'estado-aldia', 'deudor': 'estado-deudor', 'incompleto': 'estado-incompleto', 'abierta': 'estado-abierta', 'cancelada': 'estado-cancelada' }[estado];
            const estadoText = { 'aldia': 'Al día', 'deudor': 'Deudor', 'incompleto': 'Incompleto', 'abierta': 'Abierta', 'cancelada': 'Cancelada' }[estado];
            const estadoIcon = { 'aldia': 'fa-check-circle', 'deudor': 'fa-exclamation-circle', 'incompleto': 'fa-clock', 'abierta': 'fa-folder-open', 'cancelada': 'fa-check-double' }[estado];

            return `<tr class="fade-in"><td>${rowIndex}</td><td><strong>${item.nro_factura || ''}</strong></td><td>${item.nombre_apellido || ''}</td><td class="monto">${formatCurrency(item.monto_factura)}</td><td>${formatDate(item.fecha_factura)}</td><td>${item.cedula || ''}</td><td><div class="cuotas-progress"><div class="cuotas-bar"><div class="cuotas-fill" style="width: ${porcentaje}%"></div></div><span class="cuotas-text">${cuotasPagadas}</span></div></td><td class="monto">${formatCurrency(item.monto_depositados)}</td><td class="monto-deuda">${formatCurrency(item.deuda)}</td><td><span class="estado-badge ${estadoClass}"><i class="fas ${estadoIcon}"></i>${estadoText}</span></td><td><div class="acciones"><button class="btn-action btn-view" data-action="ver-detalle" data-id="${item.id}" title="Ver y editar"><i class="fas fa-eye"></i></button>${isAdminUser() ? `<button class="btn-action btn-delete" data-action="confirmar-eliminar" data-id="${item.id}" title="Eliminar registro"><i class="fas fa-trash-alt"></i></button>` : ''}</div></td></tr>`;
        }

        getTotalPages() { return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1; }

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
        // EXPORTACIONES
        // ====================================================
        exportToExcel() {
            const headers = ['N°', 'Factura', 'Nombre', 'Monto Factura (Bs)', 'Fecha Factura', 'Cédula', 'Cuotas Pagadas', 'Monto Depositado (Bs)', 'Deuda (Bs)', 'Estado'];
            const rows = this.filteredData.map(item => [item.numero, item.nro_factura, item.nombre_apellido, item.monto_factura, item.fecha_factura, item.cedula, item.cuotas_pagadas, item.monto_depositados, item.deuda, this.getEstado(item)]);
            const csv = [headers, ...rows].map(row => row.map(cell => `"${cell ?? ''}"`).join(',')).join('\n');
            downloadFile(csv, `tienda_${this.cfg.key}.csv`, 'text/csv');
        }

        exportToPDF() {
            const datosParaExportar = this.filteredData;
            if (datosParaExportar.length === 0) { notificar('No hay datos para exportar', 'error'); return; }
            if (!window.jspdf || !window.jspdf.jsPDF) { notificar('Librería PDF no disponible', 'error'); return; }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);
            const keyTienda = this.cfg.key;
            const nombreTienda = this.cfg.nombre;

            const generarPDF = async () => {
                if (typeof doc.autoTable !== 'function') { notificar('Error: Plugin autoTable no cargado.', 'error'); return; }

                let currentY = 12;
                doc.setFontSize(20); doc.setTextColor(26, 54, 93); doc.setFont('helvetica', 'bold');
                const titulo = 'Gestion de Creditos Inversora IPSFA C.A';
                const tituloWidth = doc.getTextWidth(titulo);
                doc.text(titulo, (pageWidth - tituloWidth) / 2, currentY + 16);

                doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
                const subtitulo = 'Listado de Clientes - Tienda ' + nombreTienda + ' (Filtro: ' + this.currentFilter + ')';
                const subtituloWidth = doc.getTextWidth(subtitulo);
                doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, currentY + 24);

                doc.setFontSize(10); doc.setTextColor(80, 80, 80);
                const fechaTexto = 'Fecha: ' + new Date().toLocaleDateString('es-VE') + '  |  Hora: ' + new Date().toLocaleTimeString('es-VE') + '  |  Total Registros: ' + datosParaExportar.length;
                const fechaWidth = doc.getTextWidth(fechaTexto);
                doc.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY + 32);

                currentY += 48;
                doc.setDrawColor(26, 54, 93); doc.setLineWidth(0.5); doc.line(margin, currentY, pageWidth - margin, currentY);
                currentY += 8;

                const headers = [['N°', 'Factura', 'Nombres y Apellidos', 'Cédula']];
                const rows = datosParaExportar.map((row, i) => [i + 1, row.nro_factura || '-', row.nombre_apellido || '-', row.cedula || '-']);

                const colNro = 15, colFactura = 30, colCliente = 80, colCedula = 30;
                const totalColWidth = colNro + colFactura + colCliente + colCedula;
                const scaleFactor = contentWidth / totalColWidth;

                doc.autoTable({
                    head: headers, body: rows, startY: currentY, theme: 'striped',
                    headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 11, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                    bodyStyles: { fontSize: 10, textColor: [50, 50, 50], valign: 'middle' },
                    alternateRowStyles: { fillColor: [240, 248, 255] },
                    margin: { top: 20, left: margin, right: margin },
                    columnStyles: {
                        0: { cellWidth: colNro * scaleFactor, halign: 'center' },
                        1: { cellWidth: colFactura * scaleFactor, halign: 'center' },
                        2: { cellWidth: colCliente * scaleFactor, halign: 'left' },
                        3: { cellWidth: colCedula * scaleFactor, halign: 'center' }
                    },
                    didDrawPage: function (data) {
                        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
                        doc.text('Inversora IPSFA - Sistema de Creditos', margin, pageHeight - 10);
                        doc.text('Pagina ' + data.pageNumber, pageWidth - margin - 20, pageHeight - 10);
                    }
                });

                doc.save('listado_' + keyTienda + '_' + new Date().toISOString().split('T')[0] + '.pdf');
                notificar('PDF exportado correctamente', 'success');
            };
            generarPDF().catch(err => { console.error('Error generando PDF:', err); notificar('Error al generar PDF: ' + err.message, 'error'); });
        }

        printTable() { window.print(); }

        // ====================================================
        // MODAL DE EDICIÓN / DETALLE DE CLIENTE
        // ====================================================
        get modalId() { return 'modal-editar-cliente' + this.cfg.sfx; }

        verDetalle(id) {
            this.__mostrarSpinner('Cargando cliente...');
            this._apiFetch(`${this.cfg.api}/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                .then(r => r.json())
                .then(data => {
                    this.__ocultarSpinner();
                    this.currentEditId = id;
                    this.currentEditItem = data;
                    const modal = this.createModalElement();
                    modal.dataset.clienteId = id;
                    this.fillFormData(data);
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
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;width:96%;max-width:1100px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);z-index:1001;';

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

        fillFormData(item) {
            const self = this;
            self.currentEditItem = item;
            const esAdmin = isAdminUser();
            const esNuevo = self.esRegistroNuevoV672(item);
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

            const btnGuardar = document.getElementById(self.cfg.key + '-btn-guardar-modal');
            if (btnGuardar) {
                btnGuardar.style.display = esAdmin ? 'inline-block' : 'none';
                btnGuardar.disabled = true;
                btnGuardar.style.opacity = '0.5';
                btnGuardar.style.cursor = 'not-allowed';
            }

            if (esAdmin) {
                // Limpieza de listeners previos: clonamos y reemplazamos cada input
                const inputs = body.querySelectorAll('input[name^="cuota_"], input[name^="ref_cuota_"], input[name^="tasa_cuota_"]');
                inputs.forEach(inp => {
                    const nuevo = inp.cloneNode(true);
                    inp.parentNode.replaceChild(nuevo, inp);
                    nuevo.addEventListener('input', function() { self.__marcarDirty(); });
                    nuevo.addEventListener('change', function() { self.__marcarDirty(); });
                });

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
                monto_cuota_usd: item.monto_cuota_usd
            };

            let cuotasEditadas = false;
            let montoDepositado = 0;

            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuotaOriginal = parseNumberES(item[`cuota_${i}`]);

                const cuotaInputEl = modal.querySelector(`[name="cuota_${i}"]`);
                if (!cuotaInputEl) continue;

                const cuotaInput = parseNumberES(cuotaInputEl.value);
                const refInput   = modal.querySelector(`[name="ref_cuota_${i}"]`)?.value.trim() || '';
                const fechaInput = this._parseFechaInputToISO(modal.querySelector(`[name="fecha_cuota_${i}"]`)?.value || '');
                const tasaInput  = parseNumberES(modal.querySelector(`[name="tasa_cuota_${i}"]`)?.value);

                const refOriginal   = item[`ref_cuota_${i}`] || '';
                const fechaOriginal = item[`fecha_cuota_${i}`] || '';
                const tasaOriginal  = parseNumberES(item[`tasa_cuota_${i}`]);

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

                // Recalcular dólar automáticamente
                const dolarVal = (cuotaInput > 0 && tasaInput > 0)
                    ? redondearDecimales(cuotaInput / tasaInput)
                    : 0;
                data[`dolar_depositado_cuota_${i}`] = dolarVal;

                if (cuotaInput > 0) montoDepositado += cuotaInput;
            }

            if (!cuotasEditadas) {
                data.monto_depositados = parseNumberES(item.monto_depositados);
                data.deuda = parseNumberES(item.deuda);
            } else {
                data.monto_depositados = montoDepositado;
                data.deuda = data.monto_factura - montoDepositado;
                if (Math.abs(data.deuda) < 0.01) data.deuda = 0;
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
            const resE = c('resultado-encontrada'), resN = c('nuevo-registro'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada'),
                  busq = c('busqueda'); // Corregido: variable con tilde para evitar errores
                  
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
            if (busq) busq.style.display = 'block';
            if (buscar) { buscar.value = ''; buscar.focus(); }
            this.concCliente = null;
        }

        volverABuscarFactura() {
            const c = (n) => this.el(this.concId(n));
            const resE = c('resultado-encontrada'), resN = c('nuevo-registro'),
                  msg = c('mensaje-inicial'), buscar = c('factura-buscar'), noEnc = c('no-encontrada'),
                  busq = c('busqueda');
            if (resE) resE.style.display = 'none';
            if (resN) resN.style.display = 'none';
            if (noEnc) noEnc.style.display = 'none';
            if (msg) msg.style.display = 'block';
            if (busq) busq.style.display = 'block';
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
            const resE = c('resultado-encontrada'), resN = c('nuevo-registro'), noEnc = c('no-encontrada');
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
            this.cambiarTabNuevoRegistro('factura');
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
            if (ff && !ff.value) ff.value = hoy; if (fi && !fi.value) fi.value = hoy; if (fFact && nroFactura) fFact.value = nroFactura;
            this.inicializarCalculosNuevoRegistro();
        }

        async _obtenerTasaBCV(fechaId, tasaId, mensajeId, onTasa) {
            const fechaEl = this.el(this.concId(fechaId));
            const fecha = fechaEl ? fechaEl.value : '';
            if (!fecha) return;
            const tasaInput = this.el(this.concId(tasaId));
            const mensaje = this.el(this.concId(mensajeId));
            if (!tasaInput || !mensaje) return;
            mensaje.textContent = '⏳ Consultando tasa BCV...'; mensaje.style.color = '#2c5282';
            let data = null; const token = localStorage.getItem('token');
            try {
                const response = await fetch('/api/bcv/fecha/' + fecha, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                if (response.ok) { data = await response.json(); } else { console.warn('Tasa por fecha devolvió ' + response.status + ', usando fallback'); }
            } catch (e) { console.warn('Error fetch tasa fecha:', e.message); }
            if (!data || !data.exito || !data.tasa) {
                mensaje.textContent = '⚠️ No hay tasa histórica. Consultando tasa actual...'; mensaje.style.color = '#ed8936';
                try {
                    const response = await fetch('/api/bcv/actual', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                    if (response.ok) { data = await response.json(); }
                } catch (e) { console.warn('Error fetch tasa actual:', e.message); }
                if (data && data.exito && data.tasa && data.tasa.current) {
                    let tasaUsd = null;
                    if (typeof data.tasa.current.usd === 'number') { tasaUsd = data.tasa.current.usd; }
                    else if (typeof data.tasa.current === 'number') { tasaUsd = data.tasa.current; }
                    else if (data.tasa.usd && typeof data.tasa.usd === 'number') { tasaUsd = data.tasa.usd; }
                    if (tasaUsd && tasaUsd > 0) {
                        tasaInput.value = tasaUsd.toFixed(4); this.concTasa = tasaUsd;
                        let fechaTasaStr = 'hoy';
                        if (data.tasa.current && typeof data.tasa.current.date === 'string') { fechaTasaStr = data.tasa.current.date; }
                        else if (data.tasa.date && typeof data.tasa.date === 'string') { fechaTasaStr = data.tasa.date; }
                        mensaje.textContent = '✅ Tasa actual: ' + tasaUsd.toFixed(4) + ' Bs (fecha: ' + fechaTasaStr + ')';
                        mensaje.style.color = '#28a745'; onTasa.call(this); return;
                    }
                }
            }
            if (data && data.exito && data.tasa) {
                let tasaUsd = null;
                if (data.tasa.usd && typeof data.tasa.usd === 'number') { tasaUsd = data.tasa.usd; }
                else if (data.tasa.current && typeof data.tasa.current.usd === 'number') { tasaUsd = data.tasa.current.usd; }
                if (tasaUsd && tasaUsd > 0) {
                    tasaInput.value = tasaUsd.toFixed(4); this.concTasa = tasaUsd;
                    let fechaTasa = 'hoy';
                    if (data.tasa.date && typeof data.tasa.date === 'string') { fechaTasa = data.tasa.date; }
                    else if (data.tasa.current && typeof data.tasa.current.date === 'string') { fechaTasa = data.tasa.current.date; }
                    mensaje.textContent = '✅ Tasa BCV obtenida: ' + fechaTasa; mensaje.style.color = '#28a745';
                } else {
                    tasaInput.value = '721.3456'; this.concTasa = 721.3456;
                    mensaje.textContent = '⚠️ Tasa BCV no disponible. Usando tasa por defecto: 721.3456 Bs';
                    mensaje.style.color = '#ed8936';
                }
                onTasa.call(this); return;
            }
            tasaInput.value = '721.3456'; this.concTasa = 721.3456;
            mensaje.textContent = '⚠️ Usando tasa por defecto: 721.3456 Bs';
            mensaje.style.color = '#ed8936';
            onTasa.call(this);
        }

        obtenerTasaPorFecha() { return this._obtenerTasaBCV('cuota-fecha', 'cuota-tasa', 'tasa-mensaje', this.calcularDolar); }
        obtenerTasaNueva() { return this._obtenerTasaBCV('nueva-cuota-fecha', 'nueva-cuota-tasa', 'nueva-tasa-mensaje', this.calcularDolarNueva); }

        calcularDolar() {
            const montoEl = this.el(this.concId('cuota-monto')); const tasaEl = this.el(this.concId('cuota-tasa')); const dolarEl = this.el(this.concId('cuota-dolar'));
            if (!montoEl || !tasaEl || !dolarEl) return;
            const monto = parseFloat(montoEl.value) || 0; const tasa = parseFloat(tasaEl.value) || 0;
            dolarEl.value = (monto > 0 && tasa > 0) ? (monto / tasa).toFixed(2) : '';
        }

        calcularDolarNueva() {
            const montoEl = this.el(this.concId('nueva-cuota-monto')); const tasaEl = this.el(this.concId('nueva-cuota-tasa')); const dolarEl = this.el(this.concId('nueva-cuota-dolar'));
            if (!montoEl || !tasaEl || !dolarEl) return;
            const monto = parseFloat(montoEl.value) || 0; const tasa = parseFloat(tasaEl.value) || 0;
            dolarEl.value = (monto > 0 && tasa > 0) ? (monto / tasa).toFixed(2) : '';
        }

        cargarHistorialCuotas(cliente) {
            const tbody = this.el(this.concId('tabla-cuotas-body'));
            if (!tbody) return;
            let html = ''; let tieneCuotas = false;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) {
                const cuota = cliente[`cuota_${i}`]; const ref = cliente[`ref_cuota_${i}`]; const fecha = cliente[`fecha_cuota_${i}`]; const tasa = cliente[`tasa_cuota_${i}`]; const dolar = cliente[`dolar_depositado_cuota_${i}`];
                if (parseNumberES(cuota) > 0) {
                    tieneCuotas = true;
                    html += `<tr><td><strong>Cuota ${i}</strong></td><td class="monto">${formatCurrency(cuota)}</td><td>${ref || '-'}</td><td>${formatDate(fecha)}</td><td>${parseNumberES(tasa) > 0 ? parseNumberES(tasa).toFixed(4) : '-'}</td><td class="monto">${parseNumberES(dolar) > 0 ? parseNumberES(dolar).toFixed(2) + ' $' : '-'}</td></tr>`;
                }
            }
            if (!tieneCuotas) { html = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No hay cuotas registradas</td></tr>'; }
            tbody.innerHTML = html;
        }

        _validacionModal(mensaje, focusId) { mostrarModalCorporativo('Validación', mensaje, 'warning', [{ texto: 'Aceptar', estilo: BTN.warning, accion: () => { if (focusId) { const el = this.el(this.concId(focusId)); if (el) el.focus(); } } }]); }

        async guardarCuota() {
            if (!this.concCliente) { mostrarModalCorporativo('Error', 'No hay cliente seleccionado', 'error'); return; }
            const c = (n) => this.el(this.concId(n));
            const cuotaNum = parseInt(c('cuota-numero')?.value); const monto = parseFloat(c('cuota-monto')?.value); const ref = c('cuota-ref')?.value.trim(); const fecha = c('cuota-fecha')?.value; const tasa = parseFloat(c('cuota-tasa')?.value); const dolar = parseFloat(c('cuota-dolar')?.value);
            if (!monto || monto <= 0) { this._validacionModal('Ingrese un monto válido', 'cuota-monto'); return; }
            if (!ref) { this._validacionModal('Ingrese la referencia del depósito', 'cuota-ref'); return; }
            if (!fecha) { this._validacionModal('Seleccione la fecha del depósito'); return; }
            if (!tasa || tasa <= 0) { this._validacionModal('La tasa BCV es obligatoria. Seleccione una fecha válida.'); return; }
            const data = {}; data[`cuota_${cuotaNum}`] = monto; data[`ref_cuota_${cuotaNum}`] = ref; data[`fecha_cuota_${cuotaNum}`] = fecha; data[`tasa_cuota_${cuotaNum}`] = tasa; data[`dolar_depositado_cuota_${cuotaNum}`] = dolar || (monto / tasa);
            let montoDepositado = 0;
            for (let i = 1; i <= TOTAL_CUOTAS; i++) { if (i === cuotaNum) { montoDepositado += monto; } else { montoDepositado += parseNumberES(this.concCliente[`cuota_${i}`]); } }
            const montoFactura = parseNumberES(this.concCliente.monto_factura); let deuda = montoFactura - montoDepositado; if (Math.abs(deuda) < 0.01) deuda = 0;
            data.monto_depositados = montoDepositado; data.deuda = deuda;
            showLoading(true);
            try {
                const response = await this._apiFetch(`${this.cfg.api}/${this.concCliente.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const result = await response.json();
                if (result.success || result.message) {
                    const refreshResponse = await this._apiFetch(`${this.cfg.api}/${this.concCliente.id}`);
                    if (refreshResponse.ok) { const refreshed = await refreshResponse.json(); this.concCliente = this.processItemData(refreshed); }
                    await this.loadData();
                    if (deuda <= 0) {
                        this.ocultarFormularioCuota();
                        mostrarModalCorporativo('¡Factura Cancelada!', 'La factura ha sido cancelada completamente.\n\n¿Desea registrar una cuota adicional?', 'exito', [{ texto: 'No, volver a búsqueda', estilo: BTN.neutro, accion: () => { const r = this.el(this.concId('resultado-encontrada')); if (r) r.style.display = 'none'; this.volverABuscarFactura(); } }, { texto: 'Sí, agregar cuota', estilo: BTN.aceptar, accion: () => this.mostrarFormularioCuota(this.concCliente) } ]);
                    } else { mostrarModalCorporativo('¡Cuota Guardada!', `Cuota ${cuotaNum} guardada exitosamente.\n\nDeuda restante: ${formatCurrency(deuda)}`, 'exito', [{ texto: 'Aceptar', estilo: BTN.aceptar, accion: () => this.volverABuscarFactura() }]); }
                } else { mostrarModalCorporativo('Error', result.error || 'No se pudo guardar', 'error'); }
            } catch (error) { console.error('Error guardando cuota:', error); mostrarModalCorporativo('Error', 'Error al guardar: ' + error.message, 'error'); } finally { showLoading(false); }
        }

        async guardarNuevaConciliacion() {
            const c = this.cfg.concPfx;
            const self = this;
            const num = (id) => { const el = document.getElementById(c + '-' + id); if (!el) return null; const v = el.value.trim().replace(',', '.'); if (v === '') return null; const n = parseFloat(v); return isNaN(n) ? null : n; };
            const payload = { nro_factura: document.getElementById(c + '-nueva-factura').value, fecha_factura: document.getElementById(c + '-nueva-fecha-factura').value, nombre_apellido: document.getElementById(c + '-nueva-nombre').value, cedula: document.getElementById(c + '-nueva-cedula').value, telefono: document.getElementById(c + '-nueva-telefono')?.value || '', monto_factura: num('nueva-monto'), monto_facturado_divisa: num('nueva-monto-usd'), cuotas: parseInt(document.getElementById(c + '-nueva-total-cuotas').value) || 4, inicial_bs: num('nueva-inicial-bs'), inicial_usd: num('nueva-inicial-usd'), ref_inicial: document.getElementById(c + '-nueva-ref-inicial').value, fecha_inicial: document.getElementById(c + '-nueva-fecha-inicial').value, tasa_inicial: num('nueva-tasa-inicial'), tasa_bcv_factura: num('nueva-tasa-factura'), monto_cuota_usd: num('nueva-monto-cuota'), numero_cuenta: '', banco: '' };
            if (!payload.nro_factura || !payload.nombre_apellido || !payload.fecha_factura) { mostrarModalCorporativo('Validación', 'Complete los campos obligatorios', 'warning'); return; }
            if (!payload.monto_factura || payload.monto_factura <= 0) { mostrarModalCorporativo('Validación', 'El monto de factura debe ser mayor a cero', 'warning'); return; }
            if (!payload.inicial_bs || payload.inicial_bs <= 0) { mostrarModalCorporativo('Validación', 'El inicial debe ser mayor a cero', 'warning'); return; }
            if (payload.inicial_bs > payload.monto_factura) { mostrarModalCorporativo('Validación', 'El inicial no puede superar el monto total', 'warning'); return; }
            if (payload.cedula && payload.cedula.trim() !== '') {
                const cedulaLimpia = payload.cedula.trim();
                const duplicado = self.allData.find(item => { const cedulaExistente = (item.cedula || '').trim(); return cedulaExistente && cedulaExistente === cedulaLimpia; });
                if (duplicado) {
                    mostrarModalCorporativo('⚠️ Cédula ya registrada', 'La cédula <strong>' + cedulaLimpia + '</strong> ya existe en la base de datos.\n\nCliente: ' + (duplicado.nombre_apellido || 'N/A') + '\nFactura: ' + (duplicado.nro_factura || 'N/A') + '\n\n¿Desea continuar y crear el registro de todas formas?', 'warning', [{ texto: 'Cancelar', estilo: BTN.neutro }, { texto: 'Sí, continuar', estilo: BTN.warning, accion: () => self._ejecutarGuardarNuevaConciliacion(payload) } ]); return;
                }
            }
            await self._ejecutarGuardarNuevaConciliacion(payload);
        }

        async _ejecutarGuardarNuevaConciliacion(payload) {
            try {
                const response = await this._apiFetch(this.cfg.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (response.status === 413) { mostrarModalCorporativo('Error', 'Los datos enviados son demasiado grandes. Contacte al administrador.', 'error'); return; }
                if (response.status === 429) { mostrarModalCorporativo('Error', 'Demasiadas peticiones. Espere un minuto e intente nuevamente.', 'error'); return; }
                const data = await response.json();
                if (!response.ok) { mostrarModalCorporativo('Error', data.error || 'Error al guardar el registro', 'error'); return; }
                if (data.advertencia) { mostrarModalCorporativo('Advertencia', data.advertencia.mensaje + '\nFacturas: ' + data.advertencia.facturas.join(', '), 'warning'); }
                mostrarModalCorporativo('Éxito', 'Registro creado exitosamente', 'exito');
                this.limpiarFormularioNuevaConciliacion();
                this.volverABuscar();
                this.loadData();
            } catch (err) { mostrarModalCorporativo('Error de Conexión', 'No se pudo conectar con el servidor', 'error'); }
        }

        limpiarFormularioConciliacion() {
            const c = (n) => this.el(this.concId(n)); const setVal = (n, v) => { const el = c(n); if (el) el.value = v; };
            setVal('cuota-monto', ''); setVal('cuota-ref', ''); setVal('cuota-tasa', ''); setVal('cuota-dolar', '');
            const msg = c('tasa-mensaje'); if (msg) msg.textContent = '';
        }

        limpiarFormularioNuevaConciliacion() {
            const c = (n) => this.el(this.concId(n)); const setVal = (n, v) => { const el = c(n); if (el) el.value = v; };
            setVal('nueva-nombre', ''); setVal('nueva-cedula', ''); setVal('nueva-monto', ''); setVal('nueva-fecha-factura', new Date().toISOString().split('T')[0]); setVal('nueva-cuota-monto', ''); setVal('nueva-cuota-ref', ''); setVal('nueva-cuota-tasa', ''); setVal('nueva-cuota-dolar', '');
            const msg = c('nueva-tasa-mensaje'); if (msg) msg.textContent = '';
        }

        // ====================================================
        // NUEVO REGISTRO (Pestañas y cálculos)
        // ====================================================
        cambiarTabNuevoRegistro(tabName) {
            const c = this.cfg.concPfx; const root = document.getElementById(c + '-nuevo-registro'); if (!root) return;
            root.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none'); root.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.style.borderBottom = '3px solid transparent'; b.style.color = '#718096'; });
            const panel = document.getElementById(c + '-tab-' + tabName); if (panel) panel.style.display = 'block'; const btn = root.querySelector('.tab-btn[data-tab="' + tabName + '"]'); if (btn) { btn.classList.add('active'); btn.style.borderBottom = '3px solid ' + this.color; btn.style.color = this.color; }
        }

        siguienteTabNuevoRegistro(tabName) { this.cambiarTabNuevoRegistro(tabName); }

        inicializarCalculosNuevoRegistro() {
            const c = this.cfg.concPfx; const self = this; const el = (id) => document.getElementById(c + '-' + id); const formContainer = el('nuevo-registro'); if (formContainer && formContainer.dataset.listenersInit === '1') return; if (formContainer) formContainer.dataset.listenersInit = '1';
            const extraerTasa = (data) => { if (!data || !data.tasa) return null; if (typeof data.tasa.usd === 'number') return data.tasa.usd; if (data.tasa.current && typeof data.tasa.current.usd === 'number') return data.tasa.current.usd; if (typeof data.tasa === 'number') return data.tasa; if (typeof data.tasa === 'string') { const parsed = parseFloat(data.tasa.replace(',', '.')); return isNaN(parsed) ? null : parsed; } return null; };
            const calcularMontoUSD = async () => { const montoBs = parseFloat(el('nueva-monto').value) || 0; const fecha = el('nueva-fecha-factura').value; if (montoBs <= 0 || !fecha) { el('nueva-monto-usd').value = ''; return; } let tasa = parseFloat(el('nueva-tasa-factura').value); if (!tasa || tasa <= 0.0001) { try { const res = await fetch('/api/bcv/fecha/' + fecha, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }); if (!res.ok) throw new Error('HTTP ' + res.status); const data = await res.json(); const tasaVal = extraerTasa(data); if (tasaVal) { tasa = tasaVal; el('nueva-tasa-factura').value = tasa.toFixed(4); } } catch (e) { console.warn('Error consultando tasa factura:', e.message); } } if (tasa > 0) { el('nueva-monto-usd').value = redondearDecimales(montoBs / tasa).toFixed(2); } else { el('nueva-monto-usd').value = ''; } self.calcularDeudaYCuota(); };
            const calcularInicialUSD = async () => { const inicialBs = parseFloat(el('nueva-inicial-bs').value) || 0; const fecha = el('nueva-fecha-inicial').value; if (inicialBs <= 0 || !fecha) { el('nueva-inicial-usd').value = ''; return; } let tasa = parseFloat(el('nueva-tasa-inicial').value); if (!tasa || tasa <= 0.0001) { try { const res = await fetch('/api/bcv/fecha/' + fecha, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }); if (!res.ok) throw new Error('HTTP ' + res.status); const data = await res.json(); const tasaVal = extraerTasa(data); if (tasaVal) { tasa = tasaVal; el('nueva-tasa-inicial').value = tasa.toFixed(4); } } catch (e) { console.warn('Error consultando tasa inicial:', e.message); } } if (tasa > 0) { el('nueva-inicial-usd').value = redondearDecimales(inicialBs / tasa).toFixed(2); } else { el('nueva-inicial-usd').value = ''; } self.calcularDeudaYCuota(); };
            el('nueva-monto').addEventListener('input', calcularMontoUSD); el('nueva-fecha-factura').addEventListener('change', calcularMontoUSD); el('nueva-tasa-factura').addEventListener('input', calcularMontoUSD); el('nueva-inicial-bs').addEventListener('input', calcularInicialUSD); el('nueva-fecha-inicial').addEventListener('change', calcularInicialUSD); el('nueva-tasa-inicial').addEventListener('input', calcularInicialUSD); el('nueva-total-cuotas').addEventListener('change', () => self.calcularDeudaYCuota());
        }

        calcularDeudaYCuota() {
            const c = this.cfg.concPfx; const montoUsd = parseFloat(document.getElementById(c + '-nueva-monto-usd').value) || 0; const inicialUsd = parseFloat(document.getElementById(c + '-nueva-inicial-usd').value) || 0; const cuotas = parseInt(document.getElementById(c + '-nueva-total-cuotas').value) || 4; const deuda = redondearDecimales(montoUsd - inicialUsd); const cuota = cuotas > 0 ? redondearDecimales(deuda / cuotas) : 0; document.getElementById(c + '-nueva-deuda-usd').value = deuda.toFixed(2); document.getElementById(c + '-nueva-monto-cuota').value = cuota.toFixed(2);
        }

        // ====================================================
        // MODAL ESTÉTICO (Resumen, Cuotas, Discrepancias)
        // ====================================================
        esRegistroNuevoV672(cliente) { return cliente.inicial_bs !== null && cliente.inicial_bs !== undefined && cliente.inicial_bs !== '' && parseFloat(cliente.inicial_bs) > 0; }

        calcularResumenMontos(cliente) {
            const esNuevo = this.esRegistroNuevoV672(cliente);
            const montoFacturadoUSD = parseFloat(cliente.monto_facturado_divisa) || parseFloat(cliente.monto_factura) / parseFloat(cliente.tasa_bcv_factura || 1);
            const inicialBs = esNuevo ? parseFloat(cliente.inicial_bs) : parseFloat(cliente.cuota_1 || 0);
            const inicialUSD = esNuevo ? parseFloat(cliente.inicial_usd) : parseFloat(cliente.dolar_depositado_cuota_1 || 0);
            const deudaUSD = montoFacturadoUSD - inicialUSD;
            const deudaBs = parseFloat(cliente.monto_factura) - inicialBs;
            const totalCuotas = parseInt(cliente.cuotas) || 4;
            const montoCuotaUSD = esNuevo ? parseFloat(cliente.monto_cuota_usd) : redondearDecimales(deudaUSD / totalCuotas);

            let totalDepositadoBs = inicialBs;
            let totalDepositadoUSD = inicialUSD;
            let cuotasPagadas = 0;
            for (let i = 1; i <= 11; i++) {
                const cuotaBs = parseFloat(cliente['cuota_' + i] || 0);
                const cuotaUSD = parseFloat(cliente['dolar_depositado_cuota_' + i] || 0);
                if (cuotaBs > 0) { totalDepositadoBs += cuotaBs; totalDepositadoUSD += cuotaUSD; cuotasPagadas++; }
            }

            const deudaPendienteBs = parseFloat(cliente.monto_factura) - totalDepositadoBs;
            const deudaPendienteUSD = montoFacturadoUSD - totalDepositadoUSD;
            const proximaCuota = Math.min(montoCuotaUSD, deudaPendienteUSD);

            return { montoFacturadoUSD, inicialBs, inicialUSD, deudaUSD, deudaBs, totalCuotas, montoCuotaUSD, totalDepositadoBs, totalDepositadoUSD, deudaPendienteBs, deudaPendienteUSD, cuotasPagadas, proximaCuota };
        }

        calcularDiscrepanciasFrontend(cliente) {
            const montoCuotaUSD = parseFloat(cliente.monto_cuota_usd) || 0;
            const totalCuotas = parseInt(cliente.cuotas) || 4;
            const montoFacturadoDivisa = parseFloat(cliente.monto_facturado_divisa)
                || (parseFloat(cliente.monto_factura) / parseFloat(cliente.tasa_bcv_factura || 1));
            const inicialUSD = parseFloat(cliente.inicial_usd) || 0;
            const deudaTotal = montoFacturadoDivisa - inicialUSD;

            let cuotasPagadas = 0;
            for (let i = 1; i <= 11; i++) {
                const cuotaBs = parseFloat(cliente['cuota_' + i]) || 0;
                if (cuotaBs > 0) cuotasPagadas++;
            }

            const discrepancias = {};
            for (let i = 1; i <= 11; i++) {
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

        renderizarPanelResumen(cliente, esNuevo) {
            const resumen = this.calcularResumenMontos(cliente);
            const montoFacturadoUSD = esNuevo ? resumen.montoFacturadoUSD.toFixed(2) + ' $' : '—';
            const inicialBs = esNuevo ? resumen.inicialBs.toFixed(2) : '—';
            const inicialUSD = esNuevo ? resumen.inicialUSD.toFixed(2) + ' $' : '—';
            const deudaUSD = esNuevo ? resumen.deudaUSD.toFixed(2) + ' $' : '—';
            const cuotasInfo = esNuevo ? resumen.totalCuotas + ' cuotas de ' + resumen.montoCuotaUSD.toFixed(2) + ' $' : '—';
            const deudaPendienteUSD = esNuevo ? resumen.deudaPendienteUSD.toFixed(2) + ' $' : '—';
            const proximaCuota = esNuevo && resumen.proximaCuota > 0 ? resumen.proximaCuota.toFixed(2) + ' $' : '0.00 $';

            let alertaDiscrepancias = '';
            let disc = cliente.discrepancias_cuotas;
            if (!disc || Object.keys(disc).length === 0) { disc = this.calcularDiscrepanciasFrontend(cliente); }
            if (disc && Object.keys(disc).length > 0) {
                if (typeof disc === 'string') disc = JSON.parse(disc);
                let discHtml = '<div style="background:#fff5f5;border:1px solid #feb2b2;border-radius:8px;padding:12px;margin-top:12px;color:#c53030;">';
                discHtml += '<strong style="display:block;margin-bottom:8px;font-size:13px;">⚠️ Discrepancias Detectadas</strong>';
                for (let num in disc) {
                    if (disc.hasOwnProperty(num)) {
                        const d = disc[num];
                        const diff = parseFloat(d.diferencia) || 0;
                        const esFaltante = diff > 0;
                        const signo = esFaltante ? 'Faltan' : 'Sobran';
                        const color = esFaltante ? '#c53030' : '#dd6b20';
                        discHtml += '<div style="font-size:12px;margin-bottom:4px;padding:4px 0;border-bottom:1px dashed #feb2b2;">';
                        discHtml += '<strong>Cuota ' + num + ':</strong> ';
                        discHtml += 'Esperado <strong>' + (parseFloat(d.esperado) || 0).toFixed(2) + '$</strong> / ';
                        discHtml += 'Recibido <strong>' + (parseFloat(d.recibido) || 0).toFixed(2) + '$</strong> ';
                        discHtml += '<span style="color:' + color + ';font-weight:700">→ ' + signo + ' ' + Math.abs(diff).toFixed(2) + '$</span>';
                        discHtml += '</div>';
                    }
                }
                discHtml += '</div>';
                alertaDiscrepancias = discHtml;
            }

            return '<div class="panel-resumen" style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;">' +
                '<h4 style="margin:0 0 14px 0;font-size:14px;color:#1a365d;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Resumen de Montos</h4>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Monto Factura (Bs)</span><span style="color:#1a365d;font-weight:700;font-family:monospace;font-size:14px;">' + (parseFloat(cliente.monto_factura) || 0).toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Monto Facturado ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + montoFacturadoUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Inicial (Bs)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + inicialBs + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Inicial ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + inicialUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Deuda ($)</span><span style="color:#2c5282;font-weight:700;font-family:monospace;font-size:14px;">' + deudaUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Cuotas</span><span style="color:#2c5282;font-weight:700;font-size:14px;">' + cuotasInfo + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Depositado (Bs)</span><span style="color:#38a169;font-weight:700;font-family:monospace;font-size:14px;">' + resumen.totalDepositadoBs.toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#4a5568;font-weight:500;">Deuda Pendiente (Bs)</span><span style="color:#e53e3e;font-weight:700;font-family:monospace;font-size:14px;">' + resumen.deudaPendienteBs.toFixed(2) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Deuda Pendiente ($)</span><span style="color:#e53e3e;font-weight:700;font-family:monospace;font-size:14px;">' + deudaPendienteUSD + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;background:#f7fafc;"><span style="color:#4a5568;font-weight:500;">Próxima Cuota</span><span style="color:#3182ce;font-weight:700;font-family:monospace;font-size:14px;">' + proximaCuota + '</span></div>' +
                alertaDiscrepancias +
                '</div>';
        }

        renderizarPanelCuotas(cliente, esNuevo, esAdmin) {
            const resumen = this.calcularResumenMontos(cliente);
            const discrepancias = cliente.discrepancias_cuotas ? (typeof cliente.discrepancias_cuotas === 'string' ? JSON.parse(cliente.discrepancias_cuotas) : cliente.discrepancias_cuotas) : {};
            const montoCuotaUSD = resumen.montoCuotaUSD;
            const totalCuotas = resumen.totalCuotas;

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

            for (let i = 1; i <= 11; i++) {
                const cuotaBs = cliente['cuota_' + i];
                const refCuota = cliente['ref_cuota_' + i];
                const fechaCuota = cliente['fecha_cuota_' + i];
                const tasaCuota = cliente['tasa_cuota_' + i];
                const dolarCuota = cliente['dolar_depositado_cuota_' + i];
                
                const tieneDatos = _tieneValorReal(cuotaBs) || _tieneValorReal(refCuota) || _tieneValorReal(fechaCuota) || _tieneValorReal(tasaCuota) || _tieneValorReal(dolarCuota);
                if (!tieneDatos) continue;
                const tieneValor = parseFloat(cuotaBs) > 0;
                const readonlyAttr = esAdmin ? '' : 'readonly';
                const disabledAttr = esAdmin ? '' : 'disabled';

                let estadoHTML = '<span style="color:#718096;font-size:9px">Pendiente</span>';
                if (tieneValor) {
                    const recibido = parseFloat(dolarCuota) || 0;
                    const esUltimaPagada = i === resumen.cuotasPagadas && i === totalCuotas;
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
                html += '<td><input type="text" name="ref_cuota_' + i + '" value="' + refCuota + '" ' + readonlyAttr + '></td>';
                html += '<td><input type="text" name="fecha_cuota_' + i + '" value="' + this.formatearFechaInput(fechaCuota) + '" ' + disabledAttr + ' class="solo-lectura" placeholder="dd-mm-aaaa" style="text-align:center;font-family:monospace;font-size:12px;"></td>';
                html += '<td><input type="number" name="tasa_cuota_' + i + '" value="' + tasaCuota + '" ' + readonlyAttr + ' step="0.0001" onchange="window.Tiendas.get(\'' + this.cfg.key + '\').__recalcularCuotaModal(this, ' + i + ')"></td>';
                html += '<td><input type="number" name="dolar_cuota_' + i + '" value="' + dolarCuota + '" readonly step="0.01" class="calculado"></td>';
                html += '<td>' + estadoHTML + '</td>';
                html += '</tr>';
            }

            html += '</tbody></table>';
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
            const montoBs = parseFloat(fila.querySelector('[name="cuota_' + numCuota + '"]').value) || 0;
            const tasa = parseFloat(fila.querySelector('[name="tasa_cuota_' + numCuota + '"]').value) || 0;
            const dolarInput = fila.querySelector('[name="dolar_cuota_' + numCuota + '"]');
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
            for (let i = 1; i <= 11; i++) {
                const cuotaBs = modal.querySelector('[name="cuota_' + i + '"]');
                const cuotaUSD = modal.querySelector('[name="dolar_cuota_' + i + '"]');
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

        __toggleAllCuotas(masterCheckbox) {
            const self = this;
            const modal = document.getElementById(self.cfg.key + '-modal-v672');
            if (!modal) return;
            const checks = modal.querySelectorAll('input[name^="eliminar-cuota-"]');
            checks.forEach(chk => { chk.checked = masterCheckbox.checked; });
            self.__actualizarBarraEliminar();
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

        volverABuscar() { const c = this.cfg.concPfx; document.getElementById(c + '-busqueda').style.display = 'block'; document.getElementById(c + '-resultado-encontrada').style.display = 'none'; document.getElementById(c + '-nuevo-registro').style.display = 'none'; document.getElementById(c + '-factura-buscar').value = ''; }

        // ====================================================
        // REPORTES (Filtros, Tabla y Gráficos)
        // ====================================================
        initReportes() {
            // Simplemente reiniciamos las variables para que el reporte se vea vacío al entrar
            this.repDatos = [];
            this.repResumen = {};
            this.repPagina = 1;
            
            // Buscamos los elementos HTML de los reportes y los limpiamos (ocultamos resultados previos)
            const b = (n) => this.el(this.busqId(n));
            const resumen = b('resumen'), tabla = b('tabla-container'),
                  graficos = b('graficos'), exportar = b('exportar'), paginacion = b('paginacion');
            
            // Aseguramos que los bloques de resultados estén ocultos al abrir la pestaña
            if (resumen) resumen.style.display = 'none';
            if (tabla) tabla.style.display = 'none';
            if (graficos) graficos.style.display = 'none';
            if (exportar) exportar.style.display = 'none';
            if (paginacion) paginacion.innerHTML = '';

            // Ponemos fechas por defecto
            const hoy = new Date();
            const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const desde = this.el(this.busqId('fecha-desde'));
            const hasta = this.el(this.busqId('fecha-hasta'));
            if (desde && !desde.value) desde.value = primerDia.toISOString().split('T')[0];
            if (hasta && !hasta.value) hasta.value = hoy.toISOString().split('T')[0];
        }

        calcularEstadoReporte(row) {
            const deuda = parseFloat(row.deuda) || 0; const depositado = parseFloat(row.monto_depositados) || 0; const total = parseFloat(row.monto_factura) || 0;
            const f = tmParseFecha(row.fecha_factura); let dias = 0;
            if (f) { const fechaObj = new Date(f.anio, f.mes - 1, f.dia); dias = (new Date() - fechaObj) / (1000 * 60 * 60 * 24); } else { dias = 99999; }
            if (deuda <= 0 || depositado >= total) { return { texto: 'Pagado', style: 'background:#d1fae5;color:#059669;' }; }
            if (dias > 30 && deuda > 0) { return { texto: 'En Mora', style: 'background:#fee2e2;color:#dc2626;' }; }
            return { texto: 'Pendiente', style: 'background:#fef3c7;color:#d97706;' };
        }

        async generarReporte() {
            showLoading(true); const b = (n) => this.el(this.busqId(n));
            try {
                const filtros = { fecha_desde: b('fecha-desde')?.value || null, fecha_hasta: b('fecha-hasta')?.value || null, estado: b('estado')?.value || 'todos', monto_min: b('monto-min')?.value || null, monto_max: b('monto-max')?.value || null, nombre_cliente: b('nombre')?.value || null };
                const response = await this._apiFetch(this.cfg.reportesApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filtros) });
                const data = await response.json();
                if (!data.exito) { throw new Error(data.error || 'Error al generar reporte'); }
                this.repDatos = data.datos || []; this.repResumen = data.resumen || {};
                const resumen = b('resumen'); if (resumen) resumen.style.display = 'grid';
                const setText = (n, v) => { const el = b(n); if (el) el.textContent = v; };
                setText('res-total', formatNumber(this.repResumen.total_clientes || 0)); setText('res-deuda', formatCurrency(this.repResumen.total_deuda || 0)); setText('res-pagado', formatCurrency(this.repResumen.total_depositado || 0)); setText('res-mora', formatNumber(this.repResumen.clientes_mora || 0)); setText('res-promedio', formatCurrency(this.repResumen.promedio_deuda || 0));
                const tablaContainer = b('tabla-container'); if (tablaContainer) tablaContainer.style.display = 'block'; setText('contador', this.repDatos.length + ' registros');
                this.repPagina = 1; this.repPorPagina = 10; this.renderTablaReporte();
                const graficos = b('graficos'); if (graficos) graficos.style.display = 'grid'; this.renderGraficosReporte();
                const exportar = b('exportar'); if (exportar) exportar.style.display = 'block';
                notificar('Busqueda generada: ' + data.total + ' registros', 'success');
            } catch (e) { console.error('Error:', e); notificar('Error: ' + e.message, 'error'); } finally { showLoading(false); }
        }

        renderTablaReporte() {
            const tbody = this.el(this.busqId('tbody')); const contador = this.el(this.busqId('contador')); if (!tbody) return;
            const inicio = (this.repPagina - 1) * this.repPorPagina; const fin = inicio + this.repPorPagina;
            const datosPagina = this.repDatos.slice(inicio, fin); const totalPaginas = Math.ceil(this.repDatos.length / this.repPorPagina) || 1;
            if (contador) contador.textContent = this.repDatos.length + ' registros (Página ' + this.repPagina + ' de ' + totalPaginas + ')';
            if (datosPagina.length === 0) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#718096;">No hay registros que coincidan con los filtros</td></tr>'; } else {
                tbody.innerHTML = datosPagina.map((row, i) => {
                    const estado = this.calcularEstadoReporte(row); const numeroReal = inicio + i + 1;
                    return `<tr><td>${numeroReal}</td><td>${row.nro_factura || '-'}</td><td>${row.nombre_apellido || '-'}</td><td>${row.cedula || '-'}</td><td style="text-align:right;font-family:monospace;font-weight:600;">${formatCurrency(row.monto_factura || 0)}</td><td>${row.cuotas || '-'}</td><td style="text-align:right;font-family:monospace;color:#38a169;">${formatCurrency(row.monto_depositados || 0)}</td><td style="text-align:right;font-family:monospace;color:#e53e3e;">${formatCurrency(row.deuda || 0)}</td><td><span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;${estado.style}">${estado.texto}</span></td><td>${formatDate(row.fecha_factura)}</td></tr>`;
                }).join('');
            }
            this.renderPaginacionReporte(totalPaginas);
        }

        renderPaginacionReporte(totalPaginas) {
            const contenedor = this.el(this.busqId('paginacion')); if (!contenedor) return;
            if (totalPaginas <= 1) { contenedor.innerHTML = ''; return; }
            const btnStyle = 'padding:8px 14px;border:1px solid #e2e8f0;background:white;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#4a5568;transition:all 0.2s;'; const disStyle = 'opacity:0.4;cursor:not-allowed;';
            contenedor.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;padding:15px;border-top:1px solid #e2e8f0;';
            contenedor.innerHTML = `<button data-action="rep-goto-page" data-page="first" style="${btnStyle}${this.repPagina === 1 ? disStyle : ''}" ${this.repPagina === 1 ? 'disabled' : ''}>|&lt;</button><button data-action="rep-goto-page" data-page="prev" style="${btnStyle}${this.repPagina === 1 ? disStyle : ''}" ${this.repPagina === 1 ? 'disabled' : ''}>&lt;</button><span style="font-size:13px;color:#64748b;font-weight:500;margin:0 10px;">Página ${this.repPagina} de ${totalPaginas}</span><button data-action="rep-goto-page" data-page="next" style="${btnStyle}${this.repPagina >= totalPaginas ? disStyle : ''}" ${this.repPagina >= totalPaginas ? 'disabled' : ''}>&gt;</button><button data-action="rep-goto-page" data-page="last" style="${btnStyle}${this.repPagina >= totalPaginas ? disStyle : ''}" ${this.repPagina >= totalPaginas ? 'disabled' : ''}>&gt;|</button><span style="font-size:12px;color:#718096;margin-left:15px;">Mostrar:</span><select data-action-change="rep-items-per-page" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;">${[10, 25, 50, 100].map(n => `<option value="${n}" ${n === this.repPorPagina ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
        }

        repGoToPage(page) {
            const totalPaginas = Math.ceil(this.repDatos.length / this.repPorPagina) || 1;
            if (page === 'first') page = 1; else if (page === 'prev') page = this.repPagina - 1; else if (page === 'next') page = this.repPagina + 1; else if (page === 'last') page = totalPaginas;
            if (page < 1 || page > totalPaginas) return; this.repPagina = page; this.renderTablaReporte();
            const tablaContainer = this.el(this.busqId('tabla-container')); if (tablaContainer) tablaContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        repChangeItemsPerPage(valor) { this.repPorPagina = parseInt(valor) || 10; this.repPagina = 1; this.renderTablaReporte(); }

        renderGraficosReporte() {
            const porEstado = { pendiente: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'Pendiente').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0), pagado: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'Pagado').reduce((s, r) => s + (parseFloat(r.monto_depositados) || 0), 0), mora: this.repDatos.filter(r => this.calcularEstadoReporte(r).texto === 'En Mora').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0) };
            const maxValor = Math.max(porEstado.pendiente, porEstado.pagado, porEstado.mora, 1);
            const barras = this.el(this.busqId('graf-barras'));
            if (barras) {
                barras.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pendiente</div><div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${(porEstado.pendiente / maxValor * 100)}%;background:linear-gradient(90deg,#f6e05e,#d69e2e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;"><span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pendiente)}</span></div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">Pagado</div><div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${(porEstado.pagado / maxValor * 100)}%;background:linear-gradient(90deg,#68d391,#38a169);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;"><span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.pagado)}</span></div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:100px;font-size:13px;color:#4a5568;text-align:right;">En Mora</div><div style="flex:1;height:28px;background:#edf2f7;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${(porEstado.mora / maxValor * 100)}%;background:linear-gradient(90deg,#fc8181,#e53e3e);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;transition:width 0.8s ease;"><span style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${formatCurrency(porEstado.mora)}</span></div></div></div></div>`;
            }
            const total = this.repResumen.total_facturado || 1;
            const pagadoPct = ((this.repResumen.total_depositado || 0) / total * 100).toFixed(1);
            const pendientePct = ((this.repResumen.total_deuda || 0) / total * 100).toFixed(1);
            const pastel = this.el(this.busqId('graf-pastel'));
            if (pastel) {
                pastel.innerHTML = `<div style="position:relative;width:180px;height:180px;"><svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);"><circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="20"/><circle cx="50" cy="50" r="40" fill="none" stroke="#48bb78" stroke-width="20" stroke-dasharray="${pagadoPct * 2.51} 251" stroke-linecap="round"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f56565" stroke-width="20" stroke-dasharray="${pendientePct * 2.51} 251" stroke-dashoffset="${-pagadoPct * 2.51}" stroke-linecap="round"/></svg></div><div style="display:flex;flex-direction:column;gap:10px;"><div style="display:flex;align-items:center;gap:10px;font-size:13px;"><div style="width:16px;height:16px;border-radius:4px;background:#48bb78;"></div><span style="color:#4a5568;">Pagado</span><span style="font-weight:600;color:#1a365d;margin-left:auto;">${pagadoPct}%</span></div><div style="display:flex;align-items:center;gap:10px;font-size:13px;"><div style="width:16px;height:16px;border-radius:4px;background:#f56565;"></div><span style="color:#4a5568;">Pendiente</span><span style="font-weight:600;color:#1a365d;margin-left:auto;">${pendientePct}%</span></div></div>`;
            }
        }

        limpiarReporte() {
            const b = (n) => this.el(this.busqId(n)); const setVal = (n, v) => { const el = b(n); if (el) el.value = v; };
            setVal('fecha-desde', ''); setVal('fecha-hasta', ''); setVal('estado', 'todos'); setVal('monto-min', ''); setVal('monto-max', ''); setVal('nombre', '');
            const resumen = b('resumen'), tabla = b('tabla-container'), graficos = b('graficos'), exportar = b('exportar'), paginacion = b('paginacion');
            if (resumen) resumen.style.display = 'none'; if (tabla) tabla.style.display = 'none'; if (graficos) graficos.style.display = 'none'; if (exportar) exportar.style.display = 'none'; if (paginacion) paginacion.innerHTML = '';
            this.repPagina = 1; this.repDatos = []; this.repResumen = {};
        }

        exportarReporteExcel() {
            if (this.repDatos.length === 0) { notificar('No hay datos para exportar', 'error'); return; }
            const datosExcel = this.repDatos.map(row => ({ 'Nro Factura': row.nro_factura || '', 'Cliente': row.nombre_apellido || '', 'Cédula': row.cedula || '', 'Monto Factura': parseFloat(row.monto_factura) || 0, 'Cuotas': row.cuotas || '', 'Depositado': parseFloat(row.monto_depositados) || 0, 'Deuda': parseFloat(row.deuda) || 0, 'Estado': this.calcularEstadoReporte(row).texto, 'Fecha Factura': row.fecha_factura || '' }));
            datosExcel.push({}); datosExcel.push({ 'Nro Factura': 'RESUMEN', 'Cliente': 'Total Clientes: ' + this.repResumen.total_clientes, 'Monto Factura': this.repResumen.total_facturado, 'Depositado': this.repResumen.total_depositado, 'Deuda': this.repResumen.total_deuda, 'Estado': 'Clientes Mora: ' + this.repResumen.clientes_mora });
            const nombreArchivo = 'busqueda_' + this.cfg.key + '_' + new Date().toISOString().split('T')[0];
            if (typeof XLSX !== 'undefined') {
                const ws = XLSX.utils.json_to_sheet(datosExcel); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Reporte ' + this.cfg.nombre); ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]; XLSX.writeFile(wb, nombreArchivo + '.xlsx'); notificar('Excel exportado correctamente', 'success');
            } else {
                console.warn('XLSX no disponible, exportando como CSV'); const headers = Object.keys(datosExcel[0]); const csv = [headers.join(',')].concat(datosExcel.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))).join('\n'); downloadFile('\uFEFF' + csv, nombreArchivo + '.csv', 'text/csv;charset=utf-8'); notificar('Exportado como CSV (librería Excel no disponible)', 'success');
            }
        }

        exportarReportePDF() {
            if (this.repDatos.length === 0) { notificar('No hay datos para exportar', 'error'); return; }
            if (!window.jspdf || !window.jspdf.jsPDF) { notificar('Librería PDF no disponible', 'error'); return; }
            const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', 'a4'); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 14; const contentWidth = pageWidth - (margin * 2); const repDatos = this.repDatos; const nombreTienda = this.cfg.nombre; const keyTienda = this.cfg.key;
            function cargarLogoComoBase64(url) { return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'Anonymous'; img.onload = function () { const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); }; img.onerror = function () { reject(new Error('No se pudo cargar el logo')); }; img.src = url; }); }
            const generarPDF = async () => {
                if (typeof doc.autoTable !== 'function') { notificar('Error: El plugin autoTable de jsPDF no está cargado.', 'error'); return; }
                let logoBase64 = null; try { logoBase64 = await cargarLogoComoBase64('assets/logo.png'); } catch (e) { console.log('Logo no disponible, continuando sin logo'); }
                let currentY = 12;
                if (logoBase64) { doc.addImage(logoBase64, 'PNG', margin, currentY, 50, 38); }
                doc.setFontSize(20); doc.setTextColor(26, 54, 93); doc.setFont('helvetica', 'bold'); const titulo = 'Gestion de Creditos Inversora IPSFA C.A'; const tituloWidth = doc.getTextWidth(titulo); doc.text(titulo, (pageWidth - tituloWidth) / 2, currentY + 16);
                doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal'); const subtitulo = 'Reporte de Busqueda Tienda ' + nombreTienda; const subtituloWidth = doc.getTextWidth(subtitulo); doc.text(subtitulo, (pageWidth - subtituloWidth) / 2, currentY + 24);
                doc.setFontSize(10); doc.setTextColor(80, 80, 80); const fechaTexto = 'Fecha: ' + new Date().toLocaleDateString('es-VE') + '  |  Hora: ' + new Date().toLocaleTimeString('es-VE') + '  |  Total Registros: ' + repDatos.length; const fechaWidth = doc.getTextWidth(fechaTexto); doc.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY + 32);
                currentY += 48; doc.setDrawColor(26, 54, 93); doc.setLineWidth(0.5); doc.line(margin, currentY, pageWidth - margin, currentY); currentY += 8;
                const headers = [['Nro', 'Factura', 'Cliente', 'Cedula', 'Telefono', 'Monto', 'Depositado', 'Deuda', 'Fecha']];
                const rows = repDatos.map((row, i) => [i + 1, row.nro_factura || '-', row.nombre_apellido || '-', row.cedula || '-', row.telefono || '-', formatCurrency(row.monto_factura || 0), formatCurrency(row.monto_depositados || 0), formatCurrency(row.deuda || 0), formatDate(row.fecha_factura)]);
                const colNro = 10, colFactura = 18, colCliente = 50, colCedula = 22, colTelefono = 25, colMonto = 28, colDepositado = 28, colDeuda = 28, colFecha = 22; const totalColWidth = colNro + colFactura + colCliente + colCedula + colTelefono + colMonto + colDepositado + colDeuda + colFecha; const scaleFactor = contentWidth / totalColWidth;
                doc.autoTable({ head: headers, body: rows, startY: currentY, theme: 'striped', headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle' }, bodyStyles: { fontSize: 8, textColor: [50, 50, 50], valign: 'middle' }, alternateRowStyles: { fillColor: [240, 248, 255] }, margin: { top: 20, left: margin, right: margin }, styles: { overflow: 'linebreak', cellWidth: 'wrap', lineColor: [200, 200, 200], lineWidth: 0.1 }, columnStyles: { 0: { cellWidth: colNro * scaleFactor, halign: 'center' }, 1: { cellWidth: colFactura * scaleFactor, halign: 'center' }, 2: { cellWidth: colCliente * scaleFactor, halign: 'left' }, 3: { cellWidth: colCedula * scaleFactor, halign: 'center' }, 4: { cellWidth: colTelefono * scaleFactor, halign: 'center' }, 5: { cellWidth: colMonto * scaleFactor, halign: 'right' }, 6: { cellWidth: colDepositado * scaleFactor, halign: 'right' }, 7: { cellWidth: colDeuda * scaleFactor, halign: 'right' }, 8: { cellWidth: colFecha * scaleFactor, halign: 'center' } }, didDrawPage: function (data) { doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text('Inversora IPSFA - Sistema de Creditos', margin, pageHeight - 10); doc.text('Pagina ' + data.pageNumber, pageWidth - margin - 20, pageHeight - 10); } });
                const finalY = doc.lastAutoTable.finalY + 10;
                const totalFacturado = repDatos.reduce((sum, r) => sum + (parseFloat(r.monto_factura) || 0), 0); const totalDepositado = repDatos.reduce((sum, r) => sum + (parseFloat(r.monto_depositados) || 0), 0); const totalDeuda = repDatos.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0);
                if (finalY + 50 > pageHeight - 20) { doc.addPage(); currentY = 20; } else { currentY = finalY; }
                const resumenHeight = 42; doc.setFillColor(26, 54, 93); doc.rect(margin, currentY, contentWidth, resumenHeight, 'F');
                doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); const tituloResumen = 'TOTALES DEL REPORTE'; const tituloResumenWidth = doc.getTextWidth(tituloResumen); doc.text(tituloResumen, (pageWidth - tituloResumenWidth) / 2, currentY + 8);
                doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3); doc.line(margin + 5, currentY + 12, pageWidth - margin - 5, currentY + 12);
                const colWidth = contentWidth / 3; const col1X = margin + 10; const col2X = margin + colWidth + 10; const col3X = margin + (colWidth * 2) + 10;
                doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'normal'); doc.text('TOTAL MONTO FACTURADO', col1X, currentY + 20); doc.text('TOTAL DEPOSITADO', col2X, currentY + 20); doc.text('TOTAL DEUDA PENDIENTE', col3X, currentY + 20);
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(251, 191, 36); doc.text(formatCurrency(totalFacturado), col1X, currentY + 30);
                doc.setTextColor(74, 222, 128); doc.text(formatCurrency(totalDepositado), col2X, currentY + 30);
                doc.setTextColor(248, 113, 113); doc.text(formatCurrency(totalDeuda), col3X, currentY + 30);
                doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'normal'); const clientesTexto = repDatos.length + ' clientes en el reporte'; const clientesWidth = doc.getTextWidth(clientesTexto); doc.text(clientesTexto, (pageWidth - clientesWidth) / 2, currentY + 38);
                doc.save('busqueda_' + keyTienda + '_' + new Date().toISOString().split('T')[0] + '.pdf'); notificar('PDF exportado correctamente', 'success');
            };
            generarPDF().catch(err => { console.error('Error generando PDF:', err); notificar('Error al generar PDF: ' + err.message, 'error'); });
        }

        // ====================================================
        // DELEGACIÓN DE EVENTOS
        // ====================================================
        attachEvents(container) {
            console.log(`[DEBUG Tienda ${this.cfg.nombre}] attachEvents montado en #${this.cfg.contentId}`);
            container.addEventListener('click', (ev) => {
                const target = ev.target.closest('[data-action]');
                if (!target) return;
                const action = target.dataset.action;
                console.log(`[DEBUG] Evento click capturado: action="${action}"`);
                const id = target.dataset.id ? parseInt(target.dataset.id) : null;
                switch (action) {
                    case 'show-menu': this.showView('menu'); break;
                    case 'show-base-datos': this.showView('baseDatos'); break;
                    case 'show-conciliaciones': this.showView('conciliaciones'); break;
                    case 'show-reportes': this.showView('reportes'); break;
                    case 'ver-morosos': this._filtroPendiente = 'morosos'; this.showView('baseDatos'); break;
                    case 'ver-sin-cuota-mes': this._filtroPendiente = 'sin-cuota-mes'; this.showView('baseDatos'); break;
                    case 'qa-nuevo-cliente': this.showView('conciliaciones'); this.mostrarFormularioNuevoRegistro(); break;
                    case 'ir-estadisticas': if (typeof window.mostrarSeccion === 'function') window.mostrarSeccion('estadisticas', this.cfg.key); break;
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
        }
    }

    window.TiendaApp = TiendaApp;
    console.log('✅ Lógica de TiendaApp cargada.');
})();