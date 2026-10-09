// ============================================================
//  FASE VENDEDORES v8.0 — Solo Tienda Caracas
//  Módulos: Clientes, Inventario, Cotización, Nota de Entrega.
//  Se monta dentro de panel.html (contentVend*).
//  No toca la lógica de tiendas/créditos existente.
// ============================================================
window.Vendedores = (() => {
    const API = '/api/vendedores';

    // ---------- utilidades ----------
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s === null || s === undefined ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const fmtUSD = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
    const fmtBs = (n) => 'Bs ' + (parseFloat(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtNum = (n) => String(n).padStart(5, '0');
    const fmtFecha = (f) => {
        if (!f) return '—';
        const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : String(f).slice(0, 10);
    };
    const rolActual = () => {
        try { return (JSON.parse(localStorage.getItem('usuario') || '{}').rol) || 'administrador'; }
        catch (e) { return 'administrador'; }
    };
    const esAdmin = () => rolActual() === 'administrador';
    const avisar = (msg, tipo) => {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(msg, tipo || 'info');
        else alert(msg);
    };

    async function api(ruta, opts = {}) {
        const r = await fetch(API + ruta, {
            method: opts.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });
        let j = null;
        try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
        if (!r.ok) {
            const err = new Error((j && (j.error || (j.errors && j.errors[0] && j.errors[0].msg))) || ('Error ' + r.status));
            if (j && j.codigo) err.codigo = j.codigo;
            if (j) err.data = j;
            throw err;
        }
        return j;
    }

    // ---------- estilos corporativos reutilizables ----------
    const S = {
        card: 'background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.06);',
        titulo: 'margin:0 0 4px 0;font-size:18px;color:#1a365d;font-weight:700;',
        sub: 'margin:0 0 16px 0;font-size:13px;color:#718096;',
        btnPri: 'background:#2c5282;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;',
        btnOk: 'background:#38a169;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;',
        btnNeutro: 'background:#e2e8f0;color:#2d3748;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;',
        btnPeligro: 'background:#e53e3e;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;',
        btnMini: 'border:none;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:600;cursor:pointer;margin-right:4px;',
        input: 'width:100%;padding:9px 10px;border:1px solid #cbd5e0;border-radius:8px;font-size:13px;box-sizing:border-box;',
        label: 'display:block;font-size:12px;font-weight:600;color:#4a5568;margin-bottom:4px;',
        tabla: 'width:100%;border-collapse:collapse;font-size:13px;',
        th: 'background:#1a365d;color:#fff;text-align:left;padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;',
        td: 'padding:9px 8px;border-bottom:1px solid #edf2f7;color:#2d3748;vertical-align:middle;'
    };

    const badgeEstado = (estado) => {
        const colores = { borrador: '#718096', enviada: '#3182ce', aprobada: '#38a169', rechazada: '#e53e3e' };
        const c = colores[estado] || '#718096';
        return `<span style="background:${c};color:#fff;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;text-transform:uppercase;">${esc(estado)}</span>`;
    };

    // ============================================================
    //  MODAL GENÉRICO
    // ============================================================
    function abrirModal(titulo, htmlCuerpo, ancho) {
        cerrarModal();
        const ov = document.createElement('div');
        ov.id = 'vend-modal-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:30px 12px;';
        ov.innerHTML = `
          <div style="background:#fff;border-radius:14px;width:100%;max-width:${ancho || 640}px;box-shadow:0 20px 50px rgba(0,0,0,.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:2px solid #edf2f7;">
              <h3 style="margin:0;font-size:16px;color:#1a365d;">${titulo}</h3>
              <button onclick="Vendedores.cerrarModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#718096;">✕</button>
            </div>
            <div style="padding:20px;">${htmlCuerpo}</div>
          </div>`;
        ov.addEventListener('click', (e) => { if (e.target === ov) cerrarModal(); });
        document.body.appendChild(ov);
        return ov;
    }
    function cerrarModal() {
        const ov = $('vend-modal-overlay');
        if (ov) ov.remove();
    }

    // ============================================================
    //  MÓDULO 1: CLIENTES
    // ============================================================
    async function renderClientes() {
        const cont = $('contentVendClientes');
        cont.innerHTML = `
          <div style="${S.card}">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <div>
                <h3 style="${S.titulo}">Clientes — Vendedores Caracas</h3>
                <p style="${S.sub}">Registro de clientes del área de vendedores</p>
              </div>
              <button style="${S.btnPri}" onclick="Vendedores.modalCliente()">＋ Nuevo Cliente</button>
            </div>
            <div style="margin-bottom:14px;">
              <input id="vend-cli-buscar" style="${S.input};max-width:340px;" placeholder="🔍 Buscar por nombre, apellido o cédula/RIF…" oninput="Vendedores.buscarClientes(this.value)">
            </div>
            <div id="vend-cli-tabla" style="overflow-x:auto;">Cargando…</div>
          </div>`;
        await buscarClientes('');
    }

    async function buscarClientes(q) {
        const cont = $('vend-cli-tabla');
        try {
            const r = await api('/clientes' + (q ? '?q=' + encodeURIComponent(q) : ''));
            const cs = r.clientes || [];
            if (!cs.length) { cont.innerHTML = '<p style="color:#718096;padding:20px;text-align:center;">Sin clientes registrados.</p>'; return; }
            cont.innerHTML = `<table style="${S.tabla}">
              <thead><tr>
                <th style="${S.th}">Cliente</th><th style="${S.th}">C.I / RIF</th><th style="${S.th}">Teléfono</th>
                <th style="${S.th}">Ocupación</th><th style="${S.th}">Sexo</th>
                <th style="${S.th}">Email</th><th style="${S.th}">Acciones</th>
              </tr></thead><tbody>${cs.map(c => `
                <tr>
                  <td style="${S.td}"><b>${esc(c.apellidos)}, ${esc(c.nombres)}</b></td>
                  <td style="${S.td}">${esc(c.cedula_rif)}</td>
                  <td style="${S.td}">${esc(c.telefono || '—')}</td>
                  <td style="${S.td}">${parseInt(c.es_militar) === 1 ? '🎖️ Militar' : 'No militar'}</td>
                  <td style="${S.td}">${esc(c.sexo || '—')}</td>
                  <td style="${S.td}">${esc(c.email || '—')}</td>
                  <td style="${S.td}">
                    <button style="${S.btnMini};background:#2c5282;color:#fff;" onclick='Vendedores.modalCliente(${JSON.stringify(c)})'>✏️ Editar</button>
                    ${esAdmin() ? `<button style="${S.btnMini};background:#e53e3e;color:#fff;" onclick="Vendedores.eliminarCliente(${c.id})">🗑️</button>` : ''}
                  </td>
                </tr>`).join('')}</tbody></table>`;
        } catch (e) {
            cont.innerHTML = `<p style="color:#e53e3e;">${esc(e.message)}</p>`;
        }
    }

    function modalCliente(c) {
        c = c || {};
        const esEdicion = !!c.id;
        abrirModal(esEdicion ? 'Editar Cliente' : 'Nuevo Cliente', `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="${S.label}">Nombres *</label><input id="vc-nombres" style="${S.input}" value="${esc(c.nombres || '')}"></div>
            <div><label style="${S.label}">Apellidos *</label><input id="vc-apellidos" style="${S.input}" value="${esc(c.apellidos || '')}"></div>
            <div><label style="${S.label}">Cédula o RIF *</label><input id="vc-cedula" style="${S.input}" value="${esc(c.cedula_rif || '')}"></div>
            <div><label style="${S.label}">Teléfono</label><input id="vc-telefono" style="${S.input}" value="${esc(c.telefono || '')}"></div>
            <div><label style="${S.label}">Ocupación</label>
              <select id="vc-ocupacion" style="${S.input}">
                <option value="No militar" ${parseInt(c.es_militar) === 1 ? '' : 'selected'}>No militar</option>
                <option value="Militar" ${parseInt(c.es_militar) === 1 ? 'selected' : ''}>Militar</option>
              </select></div>
            <div><label style="${S.label}">Sexo</label>
              <select id="vc-sexo" style="${S.input}">
                <option value="">—</option>
                <option value="Masculino" ${c.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                <option value="Femenino" ${c.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
              </select></div>
            <div><label style="${S.label}">Email</label><input id="vc-email" type="email" style="${S.input}" value="${esc(c.email || '')}"></div>
            <div style="grid-column:1/-1;"><label style="${S.label}">Dirección</label><textarea id="vc-direccion" style="${S.input}" rows="2">${esc(c.direccion || '')}</textarea></div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
            <button style="${S.btnNeutro}" onclick="Vendedores.cerrarModal()">Cancelar</button>
            <button style="${S.btnOk}" onclick="Vendedores.guardarCliente(${c.id || 'null'})">💾 Guardar</button>
          </div>`);
    }

    async function guardarCliente(id) {
        const body = {
            nombres: $('vc-nombres').value.trim(),
            apellidos: $('vc-apellidos').value.trim(),
            cedula_rif: $('vc-cedula').value.trim(),
            telefono: $('vc-telefono').value.trim(),
            ocupacion: $('vc-ocupacion').value,
            es_militar: $('vc-ocupacion').value === 'Militar' ? 1 : 0,
            sexo: $('vc-sexo').value,
            email: $('vc-email').value.trim(),
            direccion: $('vc-direccion').value.trim()
        };
        if (!body.nombres || !body.apellidos || !body.cedula_rif) {
            avisar('Nombres, apellidos y cédula/RIF son obligatorios', 'warning'); return;
        }
        try {
            if (id) await api('/clientes/' + id, { method: 'PUT', body });
            else await api('/clientes', { method: 'POST', body });
            cerrarModal();
            avisar('Cliente guardado correctamente', 'success');
            buscarClientes(($('vend-cli-buscar') || {}).value || '');
        } catch (e) { avisar(e.message, 'error'); }
    }

    async function eliminarCliente(id) {
        if (!confirm('¿Eliminar este cliente? Solo es posible si no tiene cotizaciones.')) return;
        try {
            await api('/clientes/' + id, { method: 'DELETE' });
            avisar('Cliente eliminado', 'success');
            buscarClientes(($('vend-cli-buscar') || {}).value || '');
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ============================================================
    //  MÓDULO 2: INVENTARIO
    // ============================================================
    async function renderInventario() {
        const cont = $('contentVendInventario');
        cont.innerHTML = `
          <div style="${S.card}">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <div>
                <h3 style="${S.titulo}">Inventario — Caracas</h3>
                <p style="${S.sub}">Artículos disponibles para cotización (precios en USD)</p>
              </div>
              <button style="${S.btnPri}" onclick="Vendedores.modalArticulo()">＋ Nuevo Artículo</button>
            </div>
            <div style="margin-bottom:14px;">
              <input id="vend-inv-buscar" style="${S.input};max-width:340px;" placeholder="🔍 Buscar por código o descripción…" oninput="Vendedores.buscarInventario(this.value)">
            </div>
            <div id="vend-inv-tabla" style="overflow-x:auto;">Cargando…</div>
          </div>`;
        await buscarInventario('');
    }

    async function buscarInventario(q) {
        const cont = $('vend-inv-tabla');
        try {
            const r = await api('/inventario' + (q ? '?q=' + encodeURIComponent(q) : ''));
            const arts = r.articulos || [];
            if (!arts.length) { cont.innerHTML = '<p style="color:#718096;padding:20px;text-align:center;">Sin artículos en inventario.</p>'; return; }
            cont.innerHTML = `<table style="${S.tabla}">
              <thead><tr>
                <th style="${S.th}">Código</th><th style="${S.th}">Descripción</th>
                <th style="${S.th}">Disponible (queda)</th><th style="${S.th}">Vend. Contado</th>
                <th style="${S.th}">Vend. Crédito</th><th style="${S.th}">Precio Contado</th>
                <th style="${S.th}">Precio Crédito</th><th style="${S.th}">Acciones</th>
              </tr></thead><tbody>${arts.map(a => `
                <tr>
                  <td style="${S.td}"><b>${esc(a.codigo)}</b></td>
                  <td style="${S.td}">${esc(a.descripcion)}</td>
                  <td style="${S.td}"><span style="font-weight:700;color:${parseInt(a.cantidad_disponible) > 0 ? '#38a169' : '#e53e3e'};">${a.cantidad_disponible}</span></td>
                  <td style="${S.td};text-align:center;">${parseInt(a.vendido_contado) || 0}</td>
                  <td style="${S.td};text-align:center;">${parseInt(a.vendido_credito) || 0}</td>
                  <td style="${S.td}">${fmtUSD(a.precio_contado)}</td>
                  <td style="${S.td}">${fmtUSD(a.precio_credito)}</td>
                  <td style="${S.td}">
                    <button style="${S.btnMini};background:#2c5282;color:#fff;" onclick='Vendedores.modalArticulo(${JSON.stringify(a)})'>✏️ Editar</button>
                    ${esAdmin() ? `<button style="${S.btnMini};background:#e53e3e;color:#fff;" onclick="Vendedores.eliminarArticulo(${a.id})">🗑️</button>` : ''}
                  </td>
                </tr>`).join('')}</tbody></table>`;
        } catch (e) {
            cont.innerHTML = `<p style="color:#e53e3e;">${esc(e.message)}</p>`;
        }
    }

    function modalArticulo(a) {
        a = a || {};
        const esEdicion = !!a.id;
        abrirModal(esEdicion ? 'Editar Artículo' : 'Nuevo Artículo', `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="${S.label}">Código *</label><input id="va-codigo" style="${S.input}" value="${esc(a.codigo || '')}"></div>
            <div><label style="${S.label}">Cantidad disponible</label><input id="va-cantidad" type="number" min="0" style="${S.input}" value="${a.cantidad_disponible !== undefined ? a.cantidad_disponible : 0}"></div>
            <div style="grid-column:1/-1;"><label style="${S.label}">Descripción *</label><input id="va-descripcion" style="${S.input}" value="${esc(a.descripcion || '')}"></div>
            <div><label style="${S.label}">Precio al contado (USD)</label><input id="va-contado" type="number" step="0.01" min="0" style="${S.input}" value="${a.precio_contado !== undefined ? a.precio_contado : ''}"></div>
            <div><label style="${S.label}">Precio a crédito (USD)</label><input id="va-credito" type="number" step="0.01" min="0" style="${S.input}" value="${a.precio_credito !== undefined ? a.precio_credito : ''}"></div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
            <button style="${S.btnNeutro}" onclick="Vendedores.cerrarModal()">Cancelar</button>
            <button style="${S.btnOk}" onclick="Vendedores.guardarArticulo(${a.id || 'null'})">💾 Guardar</button>
          </div>`);
    }

    async function guardarArticulo(id) {
        const body = {
            codigo: $('va-codigo').value.trim(),
            descripcion: $('va-descripcion').value.trim(),
            cantidad_disponible: parseInt($('va-cantidad').value) || 0,
            precio_contado: parseFloat($('va-contado').value) || 0,
            precio_credito: parseFloat($('va-credito').value) || 0
        };
        if (!body.codigo || !body.descripcion) { avisar('Código y descripción son obligatorios', 'warning'); return; }
        try {
            if (id) await api('/inventario/' + id, { method: 'PUT', body });
            else await api('/inventario', { method: 'POST', body });
            cerrarModal();
            avisar('Artículo guardado correctamente', 'success');
            buscarInventario(($('vend-inv-buscar') || {}).value || '');
        } catch (e) {
            // mismo código: ofrecer SUMAR la cantidad en vez de crear otro ítem
            if (e && e.codigo === 'CODIGO_EXISTE' && e.data && e.data.articulo) {
                modalSumarStock(e.data.articulo, body);
                return;
            }
            avisar(e.message, 'error');
        }
    }

    // Modal de confirmación: el código ya existe -> sumar stock
    let stockPendiente = null;
    function modalSumarStock(art, body) {
        stockPendiente = body; // los datos del formulario se conservan aquí (el modal reemplaza el form)
        const actual = parseInt(art.cantidad_disponible) || 0;
        const quedara = actual + body.cantidad_disponible;
        abrirModal('⚠️ Código ya registrado', `
          <div style="font-size:13px;color:#4a5568;line-height:1.6;">
            <p style="margin:0 0 10px 0;">El artículo <b>${esc(art.codigo)}</b> — ${esc(art.descripcion || '')} — <b>ya existe</b> en el inventario.</p>
            <div style="background:#fffaf0;border:1px solid #f6e05e;border-radius:10px;padding:12px;text-align:center;">
              <div>Vas a <b>sumarle ${body.cantidad_disponible}</b> unidad(es) a este artículo:</div>
              <div style="font-size:18px;font-weight:700;color:#c05621;margin-top:6px;">${actual} + ${body.cantidad_disponible} = ${quedara} disponibles</div>
            </div>
            <p style="margin:10px 0 0 0;font-size:12px;color:#718096;">No se creará un artículo nuevo, solo se actualizará la cantidad.</p>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
            <button style="${S.btnNeutro}" onclick="Vendedores.cerrarModal()">Cancelar</button>
            <button style="${S.btnOk}" onclick="Vendedores.confirmarSumaStock()">✓ Aceptar y sumar</button>
          </div>`);
    }

    async function confirmarSumaStock() {
        if (!stockPendiente) return;
        const body = stockPendiente;
        try {
            await api('/inventario', { method: 'POST', body: { ...body, sumar: true } });
            stockPendiente = null;
            cerrarModal();
            avisar(`Se sumaron ${body.cantidad_disponible} unidades a ${body.codigo.toUpperCase()}`, 'success');
            buscarInventario(($('vend-inv-buscar') || {}).value || '');
        } catch (e) { avisar(e.message, 'error'); }
    }

    async function eliminarArticulo(id) {
        if (!confirm('¿Eliminar este artículo del inventario?')) return;
        try {
            await api('/inventario/' + id, { method: 'DELETE' });
            avisar('Artículo eliminado', 'success');
            buscarInventario(($('vend-inv-buscar') || {}).value || '');
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ============================================================
    //  MÓDULO 3: COTIZACIONES
    // ============================================================
    let cotEstadoFiltro = '';

    async function renderCotizaciones() {
        const cont = $('contentVendCotizaciones');
        cont.innerHTML = `
          <div style="${S.card}">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <div>
                <h3 style="${S.titulo}">Cotizaciones — Caracas</h3>
                <p style="${S.sub}">Todas las cotizaciones del área de vendedores</p>
              </div>
              <button style="${S.btnPri}" onclick="Vendedores.modalCotizacion()">＋ Nueva Cotización</button>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
              ${['', 'borrador', 'enviada', 'aprobada', 'rechazada'].map(e => `
                <button data-estado="${e}" onclick="Vendedores.filtrarCotizaciones('${e}')"
                  style="${S.btnMini};padding:7px 14px;${cotEstadoFiltro === e ? 'background:#1a365d;color:#fff;' : 'background:#e2e8f0;color:#2d3748;'}">
                  ${e === '' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
                </button>`).join('')}
            </div>
            <div id="vend-cot-tabla" style="overflow-x:auto;">Cargando…</div>
          </div>`;
        await cargarCotizaciones();
    }

    function filtrarCotizaciones(e) {
        cotEstadoFiltro = e;
        document.querySelectorAll('#contentVendCotizaciones [data-estado]').forEach(b => {
            const activo = b.getAttribute('data-estado') === e;
            b.style.background = activo ? '#1a365d' : '#e2e8f0';
            b.style.color = activo ? '#fff' : '#2d3748';
        });
        cargarCotizaciones();
    }

    async function cargarCotizaciones() {
        const cont = $('vend-cot-tabla');
        try {
            const r = await api('/cotizaciones' + (cotEstadoFiltro ? '?estado=' + cotEstadoFiltro : ''));
            const cs = r.cotizaciones || [];
            if (!cs.length) { cont.innerHTML = '<p style="color:#718096;padding:20px;text-align:center;">Sin cotizaciones.</p>'; return; }
            cont.innerHTML = `<table style="${S.tabla}">
              <thead><tr>
                <th style="${S.th}">N°</th><th style="${S.th}">Fecha</th><th style="${S.th}">Cliente</th>
                <th style="${S.th}">C.I / RIF</th><th style="${S.th}">Vendedor</th><th style="${S.th}">Tipo</th><th style="${S.th}">Total USD</th>
                <th style="${S.th}">Total Bs</th><th style="${S.th}">Estado</th><th style="${S.th}">Acciones</th>
              </tr></thead><tbody>${cs.map(c => {
                const esBorrador = c.estado === 'borrador';
                const yaTieneNota = parseInt(c.nota_entrega_generada) === 1;
                const puedeNota = !yaTieneNota && (c.estado === 'enviada' || c.estado === 'aprobada');
                return `
                <tr>
                  <td style="${S.td}"><b>${esc(c.numero_fmt)}</b></td>
                  <td style="${S.td}">${fmtFecha(c.fecha)}</td>
                  <td style="${S.td}">${esc(c.apellidos)}, ${esc(c.nombres)}</td>
                  <td style="${S.td}">${esc(c.cedula_rif)}</td>
                  <td style="${S.td}">👤 ${esc(c.vendedor_nombre || '—')}</td>
                  <td style="${S.td}">${c.tipo_precio === 'credito' ? 'Crédito' : 'Contado'}</td>
                  <td style="${S.td}"><b>${fmtUSD(c.total_usd)}</b></td>
                  <td style="${S.td}">${fmtBs(c.total_bs)}</td>
                  <td style="${S.td}">${badgeEstado(c.estado)}</td>
                  <td style="${S.td};white-space:nowrap;">
                    <button title="Descargar PDF" style="${S.btnMini};background:#2c5282;color:#fff;" onclick="Vendedores.pdfCotizacion(${c.id})">📄 PDF</button>
                    <button title="Imprimir" style="${S.btnMini};background:#2f855a;color:#fff;" onclick="Vendedores.pdfCotizacion(${c.id}, true)">🖨️</button>
                    <button title="Ver detalle" style="${S.btnMini};background:#4a5568;color:#fff;" onclick="Vendedores.verCotizacion(${c.id})">👁️ Ver</button>
                    ${esBorrador ? `<button title="Editar" style="${S.btnMini};background:#d69e2e;color:#fff;" onclick="Vendedores.editarCotizacion(${c.id})">✏️ Editar</button>` : ''}
                    <button title="Cambiar estado" style="${S.btnMini};background:#805ad5;color:#fff;" onclick="Vendedores.modalEstado(${c.id},'${c.estado}')">🔄 Estado</button>
                    <button title="${yaTieneNota ? 'Ya tiene nota de entrega' : 'Pasar a nota de entrega'}"
                      style="${S.btnMini};${puedeNota ? 'background:#38a169;color:#fff;' : 'background:#cbd5e0;color:#a0aec0;cursor:not-allowed;'}"
                      ${puedeNota ? `onclick="Vendedores.modalNotaEntrega(${c.id})"` : 'disabled'}>📦 Nota</button>
                    <button title="Eliminar" style="${S.btnMini};background:#e53e3e;color:#fff;" onclick="Vendedores.eliminarCotizacion(${c.id},'${c.estado}')">🗑️</button>
                  </td>
                </tr>`; }).join('')}</tbody></table>`;
        } catch (e) {
            cont.innerHTML = `<p style="color:#e53e3e;">${esc(e.message)}</p>`;
        }
    }

    // ---------- estado ----------
    function modalEstado(id, actual) {
        abrirModal('Cambiar estado — Cotización', `
          <p style="font-size:13px;color:#4a5568;">Estado actual: ${badgeEstado(actual)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            ${['borrador', 'enviada', 'aprobada', 'rechazada'].map(e =>
              `<button style="${S.btnMini};padding:9px 16px;background:${e === actual ? '#cbd5e0' : '#1a365d'};color:${e === actual ? '#a0aec0' : '#fff'};"
                ${e === actual ? 'disabled' : `onclick="Vendedores.cambiarEstado(${id},'${e}')"`}>${e.charAt(0).toUpperCase() + e.slice(1)}</button>`).join('')}
          </div>`);
    }

    async function cambiarEstado(id, estado) {
        try {
            await api('/cotizaciones/' + id + '/estado', { method: 'PUT', body: { estado } });
            cerrarModal();
            avisar(estado === 'borrador'
                ? 'Cotización en borrador — puedes editarla. Si ya tenía nota de entrega, se actualizará al guardar.'
                : 'Estado actualizado a ' + estado, 'success');
            cargarCotizaciones();
        } catch (e) { avisar(e.message, 'error'); }
    }

    async function eliminarCotizacion(id, estado) {
        const aviso = estado === 'borrador'
            ? '¿Eliminar esta cotización?\n\nSi ya tiene nota de entrega, también se eliminará automáticamente y el inventario comprometido se liberará.'
            : 'Esta cotización NO está en borrador. ¿Eliminarla de todos modos?\n\nSi tiene nota de entrega, también se eliminará y el inventario comprometido se liberará.';
        if (!confirm(aviso)) return;
        try {
            const r = await api('/cotizaciones/' + id, { method: 'DELETE' });
            avisar(r && r.nota_eliminada
                ? 'Cotización y nota de entrega eliminadas — inventario liberado'
                : 'Cotización eliminada', 'success');
            cargarCotizaciones();
            buscarInventario('');
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ---------- ver detalle ----------
    async function verCotizacion(id) {
        try {
            const r = await api('/cotizaciones/' + id);
            const c = r.cotizacion, items = r.items || [];
            abrirModal('Cotización N° ' + c.numero_fmt, `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:14px;">
                <div><b>Cliente:</b> ${esc(c.apellidos)}, ${esc(c.nombres)}</div>
                <div><b>C.I/RIF:</b> ${esc(c.cedula_rif)}</div>
                <div><b>Teléfono:</b> ${esc(c.telefono || '—')}</div>
                <div><b>Ocupación:</b> ${parseInt(c.es_militar) === 1 ? '🎖️ Militar' : 'No militar'}</div>
                <div><b>Fecha:</b> ${fmtFecha(c.fecha)}</div>
                <div><b>Estado:</b> ${badgeEstado(c.estado)}</div>
                <div><b>Tipo precio:</b> ${c.tipo_precio === 'credito' ? 'Crédito' : 'Contado'}</div>
                <div><b>Tasa BCV:</b> ${c.tasa_bcv ? fmtBs(c.tasa_bcv) : '—'}</div>
              </div>
              <table style="${S.tabla}">
                <thead><tr><th style="${S.th}">Código</th><th style="${S.th}">Descripción</th><th style="${S.th}">Cant</th><th style="${S.th}">P.Unit</th><th style="${S.th}">Subtotal</th></tr></thead>
                <tbody>${items.map(i => `<tr>
                  <td style="${S.td}">${esc(i.codigo || '')}</td><td style="${S.td}">${esc(i.descripcion || '')}</td>
                  <td style="${S.td}">${i.cantidad}</td><td style="${S.td}">${fmtUSD(i.precio_unitario_usd)}</td>
                  <td style="${S.td}">${fmtUSD(i.subtotal_usd)}</td></tr>`).join('')}</tbody>
              </table>
              <div style="text-align:right;margin-top:12px;font-size:14px;">
                <div><b>Total:</b> ${fmtUSD(c.total_usd)} &nbsp;·&nbsp; ${fmtBs(c.total_bs)}</div>
              </div>
              ${c.observaciones ? `<p style="font-size:12px;color:#718096;margin-top:10px;"><b>Observaciones:</b> ${esc(c.observaciones)}</p>` : ''}
              ${r.nota_entrega ? `<p style="margin-top:10px;font-size:13px;color:#38a169;font-weight:700;">📦 Nota de entrega generada: N° ${fmtNum(r.nota_entrega.numero)}</p>` : ''}
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
                <button style="${S.btnMini};background:#2f855a;color:#fff;padding:8px 14px;" onclick="Vendedores.pdfCotizacion(${c.id}, true)">🖨️ Imprimir cotización</button>
                ${r.nota_entrega ? `<button style="${S.btnMini};background:#2f855a;color:#fff;padding:8px 14px;" onclick="Vendedores.pdfNota(${c.id}, true)">🖨️ Imprimir nota de entrega</button>` : ''}
              </div>
            `, 720);
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ============================================================
    //  MODAL COTIZACIÓN — 2 pestañas (cliente / artículos)
    // ============================================================
    let cotDraft = null; // borrador en construcción/edición
    let notaTotalUsd = 0; // total de la cotización en el modal de nota (para sugerir la inicial del 30%)

    function nuevaCotDraft() {
        return {
            id: null,
            cliente: null,          // {id, nombres, apellidos, cedula_rif,...} seleccionado
            clienteNuevo: {},       // datos si no existe
            items: [],              // [{inventario_id, codigo, descripcion, cantidad, precio_unitario_usd, disponible}]
            tipo_precio: 'contado',
            moneda: 'USD',
            tasa_bcv: 0,
            observaciones: '',
            pestana: 1
        };
    }

    async function modalCotizacion() {
        cotDraft = nuevaCotDraft();
        // tasa del día desde la API del sistema
        try {
            const r = await fetch('/api/bcv/actual');
            const j = await r.json();
            if (j && j.exito && j.tasa && j.tasa.usd) cotDraft.tasa_bcv = parseFloat(j.tasa.usd) || 0;
        } catch (e) { /* se puede escribir manual */ }
        pintarModalCotizacion();
    }

    async function editarCotizacion(id) {
        try {
            const r = await api('/cotizaciones/' + id);
            const c = r.cotizacion;
            cotDraft = nuevaCotDraft();
            cotDraft.id = c.id;
            cotDraft.cliente = { id: c.cliente_id, nombres: c.nombres, apellidos: c.apellidos, cedula_rif: c.cedula_rif, telefono: c.telefono, ocupacion: c.ocupacion, es_militar: c.es_militar, direccion: c.direccion, sexo: c.sexo, email: c.email };
            cotDraft.items = (r.items || []).map(i => ({ inventario_id: i.inventario_id, codigo: i.codigo, descripcion: i.descripcion, cantidad: i.cantidad, precio_unitario_usd: parseFloat(i.precio_unitario_usd) || 0, disponible: null }));
            cotDraft.tipo_precio = c.tipo_precio;
            cotDraft.moneda = c.moneda;
            cotDraft.tasa_bcv = parseFloat(c.tasa_bcv) || 0;
            cotDraft.observaciones = c.observaciones || '';
            pintarModalCotizacion();
        } catch (e) { avisar(e.message, 'error'); }
    }

    function pintarModalCotizacion() {
        const d = cotDraft;
        abrirModal((d.id ? 'Editar Cotización' : 'Nueva Cotización') + ' — Caracas', `
          <div style="display:flex;gap:0;border-bottom:2px solid #edf2f7;margin-bottom:16px;">
            <button id="cot-tab1" onclick="Vendedores.irPestana(1)" style="flex:1;padding:10px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;${d.pestana === 1 ? 'color:#1a365d;border-bottom:3px solid #2c5282;' : 'color:#a0aec0;'}">1 · Datos del Cliente</button>
            <button id="cot-tab2" onclick="Vendedores.irPestana(2)" style="flex:1;padding:10px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;${d.pestana === 2 ? 'color:#1a365d;border-bottom:3px solid #2c5282;' : 'color:#a0aec0;'}">2 · Artículos y Cotizador</button>
          </div>
          <div id="cot-cuerpo"></div>
        `, 860);
        pintarPestana();
    }

    function irPestana(n) {
        if (n === 2 && cotDraft.pestana === 1) leerFormCliente(); // conservar lo escrito
        cotDraft.pestana = n;
        $('cot-tab1').style.cssText += ';color:' + (n === 1 ? '#1a365d' : '#a0aec0') + ';';
        $('cot-tab1').style.borderBottom = n === 1 ? '3px solid #2c5282' : 'none';
        $('cot-tab2').style.borderBottom = n === 2 ? '3px solid #2c5282' : 'none';
        $('cot-tab2').style.color = n === 2 ? '#1a365d' : '#a0aec0';
        pintarPestana();
    }

    function pintarPestana() {
        if (cotDraft.pestana === 1) pintarPestanaCliente();
        else pintarPestanaArticulos();
    }

    // ---------- pestaña 1: cliente ----------
    function pintarPestanaCliente() {
        const d = cotDraft;
        const c = d.cliente;
        const cn = d.clienteNuevo || {};
        $('cot-cuerpo').innerHTML = `
          <div style="margin-bottom:14px;">
            <label style="${S.label}">Buscar cliente registrado (nombre, apellido o cédula/RIF)</label>
            <input id="cot-buscar-cli" style="${S.input}" placeholder="🔍 Escribe para buscar…" oninput="Vendedores.buscarClienteCot(this.value)">
            <div id="cot-res-cli" style="max-height:170px;overflow-y:auto;margin-top:6px;"></div>
          </div>
          ${c ? `
          <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:10px;padding:12px;margin-bottom:14px;font-size:13px;">
            <b style="color:#276749;">✓ Cliente seleccionado:</b> ${esc(c.apellidos)}, ${esc(c.nombres)} — ${esc(c.cedula_rif)}
            <button style="${S.btnMini};background:#e53e3e;color:#fff;float:right;" onclick="Vendedores.quitarClienteCot()">✕ Quitar</button>
          </div>` : `
          <p style="font-size:12px;color:#718096;margin:0 0 10px 0;">Si el cliente no existe, completa el registro aquí mismo (se guardará automáticamente en el módulo Clientes):</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="${S.label}">Nombres *</label><input id="cn-nombres" style="${S.input}" value="${esc(cn.nombres || '')}"></div>
            <div><label style="${S.label}">Apellidos *</label><input id="cn-apellidos" style="${S.input}" value="${esc(cn.apellidos || '')}"></div>
            <div><label style="${S.label}">Cédula o RIF *</label><input id="cn-cedula" style="${S.input}" value="${esc(cn.cedula_rif || '')}"></div>
            <div><label style="${S.label}">Teléfono</label><input id="cn-telefono" style="${S.input}" value="${esc(cn.telefono || '')}"></div>
            <div><label style="${S.label}">Ocupación</label>
              <select id="cn-ocupacion" style="${S.input}">
                <option value="No militar" ${parseInt(cn.es_militar) === 1 ? '' : 'selected'}>No militar</option>
                <option value="Militar" ${parseInt(cn.es_militar) === 1 ? 'selected' : ''}>Militar</option>
              </select></div>
            <div><label style="${S.label}">Sexo</label>
              <select id="cn-sexo" style="${S.input}">
                <option value="">—</option>
                <option value="Masculino" ${cn.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                <option value="Femenino" ${cn.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
              </select></div>
            <div><label style="${S.label}">Email</label><input id="cn-email" type="email" style="${S.input}" value="${esc(cn.email || '')}"></div>
            <div style="grid-column:1/-1;"><label style="${S.label}">Dirección</label><textarea id="cn-direccion" style="${S.input}" rows="2">${esc(cn.direccion || '')}</textarea></div>
          </div>`}
          <div style="display:flex;justify-content:flex-end;margin-top:18px;">
            <button style="${S.btnPri}" onclick="Vendedores.irPestana(2)">Siguiente: Artículos →</button>
          </div>`;
    }

    function leerFormCliente() {
        if (cotDraft.cliente) return; // ya hay seleccionado
        const v = (id) => { const el = $(id); return el ? el.value.trim() : ''; };
        const ocup = v('cn-ocupacion') || 'No militar';
        cotDraft.clienteNuevo = {
            nombres: v('cn-nombres'), apellidos: v('cn-apellidos'), cedula_rif: v('cn-cedula'),
            telefono: v('cn-telefono'), ocupacion: ocup,
            es_militar: ocup === 'Militar' ? 1 : 0, sexo: v('cn-sexo'),
            email: v('cn-email'), direccion: v('cn-direccion')
        };
    }

    async function buscarClienteCot(q) {
        const cont = $('cot-res-cli');
        if (!q || q.length < 2) { cont.innerHTML = ''; return; }
        try {
            const r = await api('/clientes?q=' + encodeURIComponent(q));
            const cs = r.clientes || [];
            cont.innerHTML = cs.length ? cs.map(c => `
              <div style="padding:8px 10px;border-bottom:1px solid #edf2f7;cursor:pointer;font-size:13px;"
                   onmouseover="this.style.background='#ebf5ff'" onmouseout="this.style.background=''"
                   onclick='Vendedores.elegirClienteCot(${JSON.stringify(c)})'>
                <b>${esc(c.apellidos)}, ${esc(c.nombres)}</b> — ${esc(c.cedula_rif)} ${parseInt(c.es_militar) === 1 ? '🎖️' : ''}
              </div>`).join('')
              : '<p style="font-size:12px;color:#a0aec0;padding:6px;">Sin coincidencias — puedes registrarlo abajo.</p>';
        } catch (e) { cont.innerHTML = ''; }
    }

    function elegirClienteCot(c) {
        cotDraft.cliente = c;
        cotDraft.clienteNuevo = {};
        pintarPestanaCliente();
    }
    function quitarClienteCot() {
        cotDraft.cliente = null;
        pintarPestanaCliente();
    }

    // ---------- pestaña 2: artículos + cotizador ----------
    function pintarPestanaArticulos() {
        const d = cotDraft;
        $('cot-cuerpo').innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div>
              <label style="${S.label}">Tipo de precio</label>
              <select id="cot-tipo-precio" style="${S.input}" onchange="Vendedores.cambiarTipoPrecio(this.value)">
                <option value="contado" ${d.tipo_precio === 'contado' ? 'selected' : ''}>Precio al contado</option>
                <option value="credito" ${d.tipo_precio === 'credito' ? 'selected' : ''}>Precio a crédito</option>
              </select>
            </div>
            <div>
              <label style="${S.label}">Buscar en inventario (código o descripción)</label>
              <input id="cot-buscar-art" style="${S.input}" placeholder="🔍 Escribe para buscar…" oninput="Vendedores.buscarArticuloCot(this.value)">
            </div>
          </div>
          <div id="cot-res-art" style="max-height:150px;overflow-y:auto;margin-bottom:12px;"></div>

          <div id="cot-items"></div>

          <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:14px;">
            <h4 style="margin:0 0 10px 0;font-size:13px;color:#1a365d;text-transform:uppercase;">Cotizador</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:end;">
              <div>
                <label style="${S.label}">Tasa del día (Bs/USD)</label>
                <input id="cot-tasa" type="number" step="0.0001" style="${S.input}" value="${d.tasa_bcv || ''}" oninput="Vendedores.recalcular()">
              </div>
              <div>
                <label style="${S.label}">Ver cotización en</label>
                <select id="cot-moneda" style="${S.input}" onchange="Vendedores.cambiarMoneda(this.value)">
                  <option value="USD" ${d.moneda === 'USD' ? 'selected' : ''}>Dólares (USD)</option>
                  <option value="BS" ${d.moneda === 'BS' ? 'selected' : ''}>Bolívares (Bs)</option>
                </select>
              </div>
              <div id="cot-totales" style="text-align:right;font-size:14px;"></div>
            </div>
          </div>

          <div style="margin-top:12px;">
            <label style="${S.label}">Observaciones</label>
            <textarea id="cot-obs" style="${S.input}" rows="2">${esc(d.observaciones || '')}</textarea>
          </div>

          <div style="display:flex;justify-content:space-between;margin-top:18px;">
            <button style="${S.btnNeutro}" onclick="Vendedores.irPestana(1)">← Volver al cliente</button>
            <button style="${S.btnOk}" onclick="Vendedores.guardarCotizacion()">💾 Guardar Cotización</button>
          </div>`;
        pintarItemsCot();
        recalcular();
    }

    async function buscarArticuloCot(q) {
        const cont = $('cot-res-art');
        if (!q || q.length < 2) { cont.innerHTML = ''; return; }
        try {
            const r = await api('/inventario?q=' + encodeURIComponent(q));
            const arts = r.articulos || [];
            cont.innerHTML = arts.length ? arts.map(a => {
                const disp = parseInt(a.cantidad_disponible) || 0;
                const precio = cotDraft.tipo_precio === 'credito' ? a.precio_credito : a.precio_contado;
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid #edf2f7;font-size:13px;">
                  <div><b>${esc(a.codigo)}</b> — ${esc(a.descripcion)}
                    <span style="font-size:11px;color:${disp > 0 ? '#38a169' : '#e53e3e'};font-weight:700;"> (disponible: ${disp})</span>
                    <span style="font-size:11px;color:#718096;"> · ${fmtUSD(precio)}</span>
                  </div>
                  <button style="${S.btnMini};${disp > 0 ? 'background:#38a169;color:#fff;' : 'background:#cbd5e0;color:#a0aec0;cursor:not-allowed;'}"
                    ${disp > 0 ? `onclick='Vendedores.agregarArticuloCot(${JSON.stringify(a)})'` : 'disabled'}>＋ Agregar</button>
                </div>`; }).join('')
              : '<p style="font-size:12px;color:#a0aec0;padding:6px;">Sin coincidencias en inventario.</p>';
        } catch (e) { cont.innerHTML = ''; }
    }

    function agregarArticuloCot(a) {
        const d = cotDraft;
        const existente = d.items.find(i => i.inventario_id === a.id);
        const disp = parseInt(a.cantidad_disponible) || 0;
        if (!existente && disp < 1) { avisar('Sin disponibilidad de ' + a.codigo, 'warning'); return; }
        if (existente) {
            if (existente.cantidad + 1 > disp) { avisar('Sin disponibilidad suficiente de ' + a.codigo, 'warning'); return; }
            existente.cantidad++;
        } else {
            const precio = d.tipo_precio === 'credito' ? parseFloat(a.precio_credito) : parseFloat(a.precio_contado);
            d.items.push({ inventario_id: a.id, codigo: a.codigo, descripcion: a.descripcion, cantidad: 1, precio_unitario_usd: precio || 0, disponible: disp });
        }
        pintarItemsCot();
        recalcular();
    }

    function cambiarCantidad(idx, valor) {
        const it = cotDraft.items[idx];
        let cant = parseInt(valor) || 1;
        if (cant < 1) cant = 1;
        if (it.disponible !== null && it.disponible !== undefined && cant > it.disponible) {
            avisar('Disponible máximo: ' + it.disponible, 'warning');
            cant = it.disponible;
        }
        it.cantidad = cant;
        pintarItemsCot();
        recalcular();
    }

    function quitarArticulo(idx) {
        cotDraft.items.splice(idx, 1);
        pintarItemsCot();
        recalcular();
    }

    function cambiarTipoPrecio(tipo) {
        cotDraft.tipo_precio = tipo;
        // recalcular precios de los items ya agregados según el tipo elegido
        cotDraft.items.forEach(async (it) => {
            if (!it.inventario_id) return;
            try {
                const r = await api('/inventario?q=' + encodeURIComponent(it.codigo));
                const a = (r.articulos || []).find(x => x.id === it.inventario_id);
                if (a) it.precio_unitario_usd = parseFloat(tipo === 'credito' ? a.precio_credito : a.precio_contado) || it.precio_unitario_usd;
            } catch (e) {}
            pintarItemsCot();
            recalcular();
        });
        pintarItemsCot();
        recalcular();
    }

    function cambiarMoneda(m) {
        cotDraft.moneda = m;
        recalcular();
    }

    function pintarItemsCot() {
        const cont = $('cot-items');
        if (!cont) return;
        const d = cotDraft;
        if (!d.items.length) {
            cont.innerHTML = '<p style="color:#a0aec0;font-size:13px;padding:14px;text-align:center;border:1px dashed #cbd5e0;border-radius:10px;">Sin artículos seleccionados — busca y agrega desde el inventario.</p>';
            return;
        }
        cont.innerHTML = `<table style="${S.tabla}">
          <thead><tr><th style="${S.th}">Código</th><th style="${S.th}">Descripción</th><th style="${S.th}">Cant</th><th style="${S.th}">P.Unit (USD)</th><th style="${S.th}">Subtotal</th><th style="${S.th}"></th></tr></thead>
          <tbody>${d.items.map((it, i) => `
            <tr>
              <td style="${S.td}"><b>${esc(it.codigo || '')}</b></td>
              <td style="${S.td}">${esc(it.descripcion || '')}</td>
              <td style="${S.td}"><input type="number" min="1" value="${it.cantidad}" style="width:64px;padding:5px;border:1px solid #cbd5e0;border-radius:6px;" onchange="Vendedores.cambiarCantidad(${i}, this.value)"></td>
              <td style="${S.td}">${fmtUSD(it.precio_unitario_usd)}</td>
              <td style="${S.td}"><b>${fmtUSD(it.cantidad * it.precio_unitario_usd)}</b></td>
              <td style="${S.td}"><button style="${S.btnMini};background:#e53e3e;color:#fff;" onclick="Vendedores.quitarArticulo(${i})">✕</button></td>
            </tr>`).join('')}</tbody></table>`;
    }

    function recalcular() {
        const cont = $('cot-totales');
        if (!cont) return;
        const tasaEl = $('cot-tasa');
        if (tasaEl) cotDraft.tasa_bcv = parseFloat(tasaEl.value) || 0;
        const totalUsd = cotDraft.items.reduce((s, i) => s + i.cantidad * i.precio_unitario_usd, 0);
        const totalBs = totalUsd * (cotDraft.tasa_bcv || 0);
        const enBs = cotDraft.moneda === 'BS';
        cont.innerHTML = `
          <div style="font-size:12px;color:#718096;">Total cotización</div>
          <div style="font-size:20px;font-weight:800;color:#1a365d;">${enBs ? fmtBs(totalBs) : fmtUSD(totalUsd)}</div>
          <div style="font-size:11px;color:#718096;">${enBs ? fmtUSD(totalUsd) : fmtBs(totalBs)}</div>`;
    }

    async function guardarCotizacion() {
        const d = cotDraft;
        d.observaciones = ($('cot-obs') || {}).value || '';
        if (!d.cliente && !(d.clienteNuevo && d.clienteNuevo.cedula_rif)) {
            leerFormCliente();
        }
        if (!d.cliente && (!d.clienteNuevo.nombres || !d.clienteNuevo.apellidos || !d.clienteNuevo.cedula_rif)) {
            avisar('Faltan los datos del cliente (pestaña 1)', 'warning'); return;
        }
        if (!d.items.length) { avisar('Agrega al menos un artículo', 'warning'); return; }

        const body = {
            fecha: new Date().toISOString().slice(0, 10),
            tipo_precio: d.tipo_precio,
            moneda: d.moneda,
            tasa_bcv: d.tasa_bcv,
            observaciones: d.observaciones,
            items: d.items.map(i => ({ inventario_id: i.inventario_id, codigo: i.codigo, descripcion: i.descripcion, cantidad: i.cantidad, precio_unitario_usd: i.precio_unitario_usd }))
        };
        if (d.cliente) body.cliente_id = d.cliente.id;
        else body.cliente = d.clienteNuevo;

        try {
            let r;
            if (d.id) r = await api('/cotizaciones/' + d.id, { method: 'PUT', body });
            else r = await api('/cotizaciones', { method: 'POST', body });
            cerrarModal();
            avisar(r && r.nota_actualizada
                ? 'Cotización actualizada — su nota de entrega también se actualizó con los nuevos montos'
                : 'Cotización guardada en estado borrador', 'success');
            cargarCotizaciones();
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ============================================================
    //  MÓDULO 4: NOTAS DE ENTREGA
    // ============================================================
    async function renderNotas() {
        const cont = $('contentVendNotas');
        cont.innerHTML = `
          <div style="${S.card}">
            <h3 style="${S.titulo}">Notas de Entrega — Caracas</h3>
            <p style="${S.sub}">Mismo número que su cotización de origen</p>
            <div id="vend-not-tabla" style="overflow-x:auto;">Cargando…</div>
          </div>`;
        try {
            const r = await api('/notas-entrega');
            const ns = r.notas || [];
            const cont2 = $('vend-not-tabla');
            if (!ns.length) { cont2.innerHTML = '<p style="color:#718096;padding:20px;text-align:center;">Sin notas de entrega generadas.</p>'; return; }
            cont2.innerHTML = `<table style="${S.tabla}">
              <thead><tr>
                <th style="${S.th}">N°</th><th style="${S.th}">Fecha</th><th style="${S.th}">Cliente</th>
                <th style="${S.th}">C.I / RIF</th><th style="${S.th}">Vendedor</th><th style="${S.th}">Forma de Pago</th>
                <th style="${S.th}">Inicial</th><th style="${S.th}">Cuotas</th><th style="${S.th}">Total</th>
                <th style="${S.th}">Acciones</th>
              </tr></thead><tbody>${ns.map(n => `
                <tr>
                  <td style="${S.td}"><b>${esc(n.numero_fmt)}</b></td>
                  <td style="${S.td}">${fmtFecha(n.fecha)}</td>
                  <td style="${S.td}">${esc(n.apellidos)}, ${esc(n.nombres)}</td>
                  <td style="${S.td}">${esc(n.cedula_rif)}</td>
                  <td style="${S.td}">👤 ${esc(n.vendedor_nombre || '—')}</td>
                  <td style="${S.td}">${n.forma_pago === 'credito' ? 'Crédito' : 'Contado'}</td>
                  <td style="${S.td}">${fmtUSD(n.inicial_usd)}</td>
                  <td style="${S.td}">${n.cuotas_quincenales || 0}</td>
                  <td style="${S.td}"><b>${fmtUSD(n.total_usd)}</b></td>
                  <td style="${S.td};white-space:nowrap;">
                    <button title="Descargar PDF" style="${S.btnMini};background:#2c5282;color:#fff;" onclick="Vendedores.pdfNota(${n.cotizacion_id})">📄 PDF</button>
                    <button title="Imprimir" style="${S.btnMini};background:#2f855a;color:#fff;" onclick="Vendedores.pdfNota(${n.cotizacion_id}, true)">🖨️</button>
                    <button style="${S.btnMini};background:#4a5568;color:#fff;" onclick="Vendedores.verCotizacion(${n.cotizacion_id})">👁️ Ver</button>
                  </td>
                </tr>`).join('')}</tbody></table>`;
        } catch (e) {
            $('vend-not-tabla').innerHTML = `<p style="color:#e53e3e;">${esc(e.message)}</p>`;
        }
    }

    // ---------- conversión: cotización → nota de entrega ----------
    function modalNotaEntrega(cotizacionId) {
        abrirModal('Generar Nota de Entrega', `
          <div id="ne-cargando" style="font-size:13px;color:#718096;">Cargando cotización…</div>
          <div id="ne-form" style="display:none;">
            <div id="ne-resumen" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:13px;margin-bottom:14px;"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="${S.label}">Forma de pago</label>
                <select id="ne-forma" style="${S.input}" onchange="Vendedores.toggleCreditoNota(this.value)">
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div id="ne-campo-inicial" style="display:none;">
                <label style="${S.label}">Inicial (USD)</label>
                <input id="ne-inicial" type="number" step="0.01" min="0" value="0" style="${S.input}">
                <div id="ne-inicial-hint" style="font-size:11px;color:#718096;margin-top:4px;"></div>
              </div>
              <div id="ne-campo-cuotas" style="display:none;">
                <label style="${S.label}">Cuotas quincenales (1-8)</label>
                <input id="ne-cuotas" type="number" min="1" max="8" value="4" style="${S.input}">
              </div>
              <div id="ne-campo-fecha" style="display:none;">
                <label style="${S.label}">Fecha primera cuota</label>
                <input id="ne-fecha" type="date" style="${S.input}">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
              <button style="${S.btnNeutro}" onclick="Vendedores.cerrarModal()">Cancelar</button>
              <button style="${S.btnOk}" onclick="Vendedores.generarNotaEntrega(${cotizacionId})">📦 Generar Nota de Entrega</button>
            </div>
          </div>`, 560);
        api('/cotizaciones/' + cotizacionId).then(r => {
            const c = r.cotizacion;
            notaTotalUsd = parseFloat(c.total_usd) || 0;
            $('ne-cargando').style.display = 'none';
            $('ne-form').style.display = 'block';
            $('ne-resumen').innerHTML = `
              <b>Cotización N° ${esc(c.numero_fmt)}</b> — la nota de entrega llevará el mismo número.<br>
              Cliente: ${esc(c.apellidos)}, ${esc(c.nombres)} (${esc(c.cedula_rif)})<br>
              Total: <b>${fmtUSD(c.total_usd)}</b> · ${fmtBs(c.total_bs)}`;
            const manana15 = new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().slice(0, 10);
            $('ne-fecha').value = manana15;
        }).catch(e => { $('ne-cargando').textContent = e.message; });
    }

    function toggleCreditoNota(v) {
        const esCredito = v === 'credito';
        $('ne-campo-inicial').style.display = esCredito ? 'block' : 'none';
        $('ne-campo-cuotas').style.display = esCredito ? 'block' : 'none';
        $('ne-campo-fecha').style.display = esCredito ? 'block' : 'none';
        if (esCredito) {
            // inicial sugerida: 30% del total de la compra (editable)
            const sugerida = Math.round(notaTotalUsd * 0.30 * 100) / 100;
            $('ne-inicial').value = sugerida.toFixed(2);
            $('ne-inicial-hint').textContent = 'Sugerida: 30% del total (' + fmtUSD(sugerida) + ') — puedes cambiarla si cancela más o menos.';
        }
    }

    async function generarNotaEntrega(cotizacionId) {
        const body = {
            forma_pago: $('ne-forma').value,
            inicial_usd: parseFloat(($('ne-inicial') || {}).value) || 0,
            cuotas_quincenales: parseInt(($('ne-cuotas') || {}).value) || 0,
            primera_fecha: ($('ne-fecha') || {}).value || ''
        };
        try {
            const r = await api('/cotizaciones/' + cotizacionId + '/nota-entrega', { method: 'POST', body });
            cerrarModal();
            avisar('Nota de entrega N° ' + fmtNum(r.nota_entrega.numero) + ' generada — inventario comprometido', 'success');
            cargarCotizaciones();
            buscarInventario('');
        } catch (e) { avisar(e.message, 'error'); }
    }

    // ============================================================
    //  PDFs (jsPDF + autotable, ya cargados en panel.html)
    //  Formato según planilla Inversora IPSFA escaneada
    // ============================================================
    // Logo Inversora IPSFA (public/assets/logo.png) precargado como dataURL
    let logoDataUrl = null;
    (function precargarLogo() {
        fetch('assets/logo.png').then(r => r.ok ? r.blob() : null).then(b => {
            if (!b) return;
            const fr = new FileReader();
            fr.onload = () => { logoDataUrl = fr.result; };
            fr.readAsDataURL(b);
        }).catch(() => {});
    })();

    function nuevoPDF() {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { avisar('Librería PDF no disponible', 'error'); return null; }
        return new jsPDF({ unit: 'mm', format: 'letter' });
    }

    function encabezadoIPSFA(doc, titulo, numeroFmt, fecha) {
        // membrete: logo a la izquierda + encabezado institucional (como la planilla)
        if (logoDataUrl) {
            try { doc.addImage(logoDataUrl, 'PNG', 14, 8, 34, 17); } catch (e) {}
        }
        doc.setFontSize(7.5);
        doc.setTextColor(90);
        doc.text([
            'REPÚBLICA BOLIVARIANA DE VENEZUELA',
            'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
            'VICEMINISTERIO DE SERVICIOS',
            'DIRECCIÓN GENERAL DE EMPRESAS Y SERVICIOS',
            'INSTITUTO DE PREVISIÓN SOCIAL DE LA FUERZA ARMADA',
            'INVERSORA IPSFA, C.A.'
        ], 112, 11, { align: 'center' });
        doc.setFontSize(15);
        doc.setTextColor(26, 54, 93);
        doc.text(titulo, 105, 38, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text('N° ' + numeroFmt, 195, 44, { align: 'right' });
        doc.text('CARACAS, ' + fmtFecha(fecha), 195, 49, { align: 'right' });
        doc.setDrawColor(26, 54, 93);
        doc.setLineWidth(0.6);
        doc.line(14, 52, 202, 52);
    }

    function bloqueClientePDF(doc, c, y) {
        doc.autoTable({
            startY: y,
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 1.8 },
            headStyles: { fillColor: [26, 54, 93] },
            body: [
                ['NOMBRE O RAZÓN:', (c.apellidos || '') + ', ' + (c.nombres || '')],
                ['RIF / C.I:', c.cedula_rif || ''],
                ['TELÉFONO:', c.telefono || ''],
                ['OCUPACIÓN / UNIDAD:', c.ocupacion || (parseInt(c.es_militar) === 1 ? 'MILITAR' : 'NO MILITAR')]
            ],
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
            margin: { left: 14, right: 14 }
        });
        return doc.lastAutoTable.finalY;
    }

    function pieIPSFA(doc) {
        doc.setFontSize(7);
        doc.setTextColor(110);
        doc.text('Inversora IPSFA, C.A. RIF: G-20016740-8 NIT: 0337521720 Av. Los Próceres Edif. Sede del IPSFA Nivel Sótano,', 105, 272, { align: 'center' });
        doc.text('Caracas D.C. Z.P. 1090, E-mail: inversoraventasgeneral@gmail.com 0412-283-52-01', 105, 276, { align: 'center' });
    }

    // Firmas centradas: ELABORADO POR = vendedor (tabla usuarios) · RECIBIDO POR = comprador (cliente)
    // yInicio = posición dinámica: las firmas van pegadas debajo de la última tabla
    function firmasPDF(doc, c, yInicio) {
        const vendedor = (c.vendedor_nombre || '').toUpperCase();
        const comprador = ((c.apellidos || '') + ', ' + (c.nombres || '')).toUpperCase();
        const ciComprador = c.cedula_rif || '';
        const centroV = 62, centroC = 148; // centros de cada columna de firma
        doc.setFontSize(9);
        doc.setTextColor(40);
        // vendedor
        doc.text('ELABORADO POR:', centroV, yInicio, { align: 'center' });
        if (vendedor) { doc.setFont(undefined, 'bold'); doc.text(vendedor, centroV, yInicio + 7, { align: 'center' }); doc.setFont(undefined, 'normal'); }
        doc.line(centroV - 27, yInicio + 10, centroV + 27, yInicio + 10);
        doc.text('Ejecutivo de ventas', centroV, yInicio + 15, { align: 'center' });
        doc.text('Inversora IPSFA, C.A', centroV, yInicio + 19, { align: 'center' });
        // comprador
        doc.text('RECIBIDO POR:', centroC, yInicio, { align: 'center' });
        if (comprador !== ',') { doc.setFont(undefined, 'bold'); doc.text(comprador, centroC, yInicio + 7, { align: 'center' }); doc.setFont(undefined, 'normal'); }
        doc.line(centroC - 27, yInicio + 10, centroC + 27, yInicio + 10);
        if (ciComprador) doc.text('C.I/RIF: ' + ciComprador, centroC, yInicio + 15, { align: 'center' });
    }

    // Firmas separadas ~3x de la última tabla; si no caben, saltan a una página nueva
    // reservarNotaPago=true deja espacio para el recuadro "reporta tu pago" (notas a crédito)
    function yParaFirmas(doc, yTabla, reservarNotaPago) {
        let y = yTabla + 42;
        const limite = reservarNotaPago ? 244 : 262;
        if (y + 22 > limite) { doc.addPage(); y = 40; }
        return y;
    }

    // Recuadro "reporta tu pago" — solo notas de entrega a CRÉDITO, arriba del pie de página
    function notaPagoPDF(doc) {
        doc.setFillColor(237, 242, 247);
        doc.setDrawColor(44, 82, 130);
        doc.setLineWidth(0.5);
        doc.roundedRect(30, 248, 156, 17, 2.5, 2.5, 'FD');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(26, 54, 93);
        doc.text('REPORTA TU PAGO PUNTUAL AL 0412-2935201', 108, 255.5, { align: 'center' });
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(74, 85, 104);
        doc.text('con tus datos: nombre, apellidos y cédula de identidad, para registrarlo', 108, 261.5, { align: 'center' });
    }

    async function pdfCotizacion(id, imprimir) {
        try {
            const r = await api('/cotizaciones/' + id);
            const c = r.cotizacion, items = r.items || [];
            const doc = nuevoPDF();
            if (!doc) return;
            encabezadoIPSFA(doc, 'COTIZACIÓN', c.numero_fmt, c.fecha);
            let y = bloqueClientePDF(doc, c, 56);

            doc.autoTable({
                startY: y + 4,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
                headStyles: { fillColor: [26, 54, 93], halign: 'center' },
                head: [['CANT', 'CÓDIGO', 'DESCRIPCIÓN', 'COSTO UNITARIO', 'COSTO TOTAL']],
                body: items.map(i => [i.cantidad, i.codigo || '', i.descripcion || '', fmtUSD(i.precio_unitario_usd), fmtUSD(i.subtotal_usd)]),
                foot: [['', '', '', 'TOTAL GENERAL', fmtUSD(c.total_usd)]],
                footStyles: { fillColor: [237, 242, 247], textColor: [26, 54, 93], fontStyle: 'bold' },
                margin: { left: 14, right: 14 }
            });
            firmasPDF(doc, c, yParaFirmas(doc, doc.lastAutoTable.finalY));
            pieIPSFA(doc);
            if (imprimir) imprimirPDF(doc); else doc.save('cotizacion-' + c.numero_fmt + '.pdf');
        } catch (e) { avisar(e.message, 'error'); }
    }

    async function pdfNota(cotizacionId, imprimir) {
        try {
            const r = await api('/cotizaciones/' + cotizacionId);
            const c = r.cotizacion, items = r.items || [], nota = r.nota_entrega;
            if (!nota) { avisar('Esta cotización aún no tiene nota de entrega', 'warning'); return; }
            const doc = nuevoPDF();
            if (!doc) return;
            encabezadoIPSFA(doc, 'NOTA DE ENTREGA', fmtNum(nota.numero), nota.fecha);
            let y = bloqueClientePDF(doc, c, 56);

            // forma de pago dentro del bloque (como la planilla)
            doc.autoTable({
                startY: y,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 1.8 },
                body: [['FORMA DE PAGO:', nota.forma_pago === 'credito' ? 'CRÉDITO' : 'CONTADO']],
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
                margin: { left: 14, right: 14 }
            });
            y = doc.lastAutoTable.finalY;

            const esCredito = nota.forma_pago === 'credito';
            const resta = Math.max(0, (parseFloat(c.total_usd) || 0) - (parseFloat(nota.inicial_usd) || 0));
            // al CONTADO no se muestran las columnas INICIAL ni RESTA
            doc.autoTable(esCredito ? {
                startY: y + 4,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
                headStyles: { fillColor: [26, 54, 93], halign: 'center' },
                head: [['CANT', 'DESCRIPCIÓN', 'COSTO UNITARIO', 'INICIAL', 'RESTA', 'COSTO TOTAL']],
                body: items.map((i, idx) => [
                    i.cantidad, i.descripcion || '', fmtUSD(i.precio_unitario_usd),
                    idx === 0 ? fmtUSD(nota.inicial_usd) : '',
                    idx === 0 ? fmtUSD(resta) : '',
                    fmtUSD(i.subtotal_usd)
                ]),
                foot: [['', '', '', 'TOTAL GENERAL', '', fmtUSD(c.total_usd)]],
                footStyles: { fillColor: [237, 242, 247], textColor: [26, 54, 93], fontStyle: 'bold' },
                margin: { left: 14, right: 14 }
            } : {
                startY: y + 4,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
                headStyles: { fillColor: [26, 54, 93], halign: 'center' },
                head: [['CANT', 'DESCRIPCIÓN', 'COSTO UNITARIO', 'COSTO TOTAL']],
                body: items.map(i => [
                    i.cantidad, i.descripcion || '', fmtUSD(i.precio_unitario_usd), fmtUSD(i.subtotal_usd)
                ]),
                foot: [['', '', 'TOTAL GENERAL', fmtUSD(c.total_usd)]],
                footStyles: { fillColor: [237, 242, 247], textColor: [26, 54, 93], fontStyle: 'bold' },
                margin: { left: 14, right: 14 }
            });
            y = doc.lastAutoTable.finalY + 6;

            if (esCredito) {
                doc.setFontSize(9.5);
                doc.setTextColor(40);
                doc.text('CUOTAS QUINCENALES: ' + nota.cuotas_quincenales + '  de  ' + fmtUSD(nota.monto_cuota_usd), 14, y);
                y += 3;

                // cronograma de amortización (como la planilla)
                const cron = Array.isArray(nota.cronograma) ? nota.cronograma : [];
                const columnas = ['CUOTAS', 'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA', 'SÉPTIMA', 'OCTAVA'];
                const filaFecha = ['FECHA'], filaMonto = ['MONTO'];
                for (let i = 0; i < 8; i++) {
                    filaFecha.push(cron[i] ? fmtFecha(cron[i].fecha) : '');
                    filaMonto.push(cron[i] ? fmtUSD(cron[i].monto_usd) : '');
                }
                doc.autoTable({
                    startY: y,
                    theme: 'grid',
                    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
                    headStyles: { fillColor: [26, 54, 93] },
                    head: [columnas.slice(0, cron.length + 1)],
                    body: [filaFecha.slice(0, cron.length + 1), filaMonto.slice(0, cron.length + 1)],
                    margin: { left: 14, right: 14 }
                });
                doc.setFontSize(8);
                doc.setTextColor(90);
                doc.text('CRONOGRAMA DE AMORTIZACIÓN', 105, y - 1.5, { align: 'center' });
            }

            firmasPDF(doc, c, yParaFirmas(doc, doc.lastAutoTable.finalY, esCredito));
            if (esCredito) notaPagoPDF(doc); // solo crédito: recuadro "reporta tu pago"
            pieIPSFA(doc);
            if (imprimir) imprimirPDF(doc); else doc.save('nota-entrega-' + fmtNum(nota.numero) + '.pdf');
        } catch (e) { avisar(e.message, 'error'); }
    }

    // Abre el PDF en una pestaña nueva con el diálogo de imprimir
    function imprimirPDF(doc) {
        try {
            doc.autoPrint({ variant: 'non-conform' });
            window.open(doc.output('bloburl'), '_blank');
        } catch (e) { avisar('No se pudo abrir la impresión: ' + e.message, 'error'); }
    }

    // ============================================================
    //  API pública del módulo
    // ============================================================
    return {
        mostrar: (seccion) => {
            if (seccion === 'vend-clientes') return renderClientes();
            if (seccion === 'vend-inventario') return renderInventario();
            if (seccion === 'vend-cotizaciones') return renderCotizaciones();
            if (seccion === 'vend-notas') return renderNotas();
        },
        cerrarModal,
        // clientes
        modalCliente, guardarCliente, eliminarCliente, buscarClientes,
        // inventario
        modalArticulo, guardarArticulo, eliminarArticulo, buscarInventario, confirmarSumaStock,
        // cotizaciones
        modalCotizacion, editarCotizacion, verCotizacion, pdfCotizacion,
        filtrarCotizaciones, modalEstado, cambiarEstado, eliminarCotizacion,
        irPestana, buscarClienteCot, elegirClienteCot, quitarClienteCot,
        buscarArticuloCot, agregarArticuloCot, cambiarCantidad, quitarArticulo,
        cambiarTipoPrecio, cambiarMoneda, recalcular, guardarCotizacion,
        // notas de entrega
        modalNotaEntrega, toggleCreditoNota, generarNotaEntrega, pdfNota
    };
})();
