// ============================================================
//  VISTA MÓVIL DEL VENDEDOR v9.0 — "Ventas en Campo"
//  Pensada para teléfono: registrar cliente, armar cotización
//  y generar nota de entrega. La impresión se hace en la PC.
//  Usa la MISMA API /api/vendedores del panel de escritorio.
//  No toca la lógica de escritorio (panel.html / vendedores.js).
// ============================================================
window.Movil = (() => {
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
    const usuarioActual = () => {
        try { return JSON.parse(localStorage.getItem('usuario') || '{}'); }
        catch (e) { return {}; }
    };

    let toastTimer = null;
    function toast(msg, tipo) {
        const t = $('mv-toast');
        if (!t) return;
        t.textContent = msg;
        t.className = tipo || 'info';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.className = ''; t.style.display = 'none'; t.style.display = ''; }, 3500);
    }

    // fetch propio: agrega el token y maneja sesión vencida
    async function api(ruta, opts = {}) {
        // v9.7 — la cookie httpOnly autentica sola; ningún token en el navegador
        const headers = { 'Content-Type': 'application/json' };
        const r = await fetch(API + ruta, {
            method: opts.method || 'GET',
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });
        let j = null;
        try { j = await r.json(); } catch (e) { /* sin cuerpo */ }
        if (r.status === 401) { salir(); throw new Error('Sesión vencida — inicia sesión de nuevo'); }
        if (!r.ok) {
            const err = new Error((j && (j.error || (j.errors && j.errors[0] && j.errors[0].msg))) || ('Error ' + r.status));
            if (j) err.data = j;
            throw err;
        }
        return j;
    }

    // ============================================================
    //  SESIÓN
    // ============================================================
    function mostrarLogin() {
        $('mv-login').style.display = 'flex';
        $('mv-app').style.display = 'none';
    }
    function mostrarApp() {
        $('mv-login').style.display = 'none';
        $('mv-app').style.display = 'block';
        const u = usuarioActual();
        $('mv-usuario-nombre').textContent = '👤 ' + (u.nombre || u.email || 'Vendedor');
    }

    // v9.7.1 — 2FA en la app móvil: si la cuenta tiene doble factor, el
    // login devuelve mfa_requerido + preauth; se pide el código TOTP y se
    // verifica contra /api/auth/mfa-verify (mismo flujo que el panel).
    let preauthMfaMovil = null;

    function mostrarMfaMovil() {
        ['mv-email', 'mv-password'].forEach(function (id) {
            const el = $(id);
            if (el) {
                el.style.display = 'none';
                if (el.previousElementSibling) el.previousElementSibling.style.display = 'none';
            }
        });
        if (!$('mv-mfa-codigo')) {
            const btn = $('mv-btn-login');
            const lbl = document.createElement('label');
            lbl.setAttribute('for', 'mv-mfa-codigo');
            lbl.textContent = 'Código de verificación (app authenticator)';
            const inp = document.createElement('input');
            inp.id = 'mv-mfa-codigo';
            inp.type = 'text'; inp.maxLength = 6; inp.inputMode = 'numeric';
            inp.placeholder = '123456'; inp.setAttribute('autocomplete', 'one-time-code');
            btn.parentNode.insertBefore(lbl, btn);
            btn.parentNode.insertBefore(inp, btn);
        }
        $('mv-btn-login').textContent = 'Verificar e ingresar';
        const errBox = $('mv-login-error');
        errBox.textContent = 'Esta cuenta tiene 2FA. Abre tu app (Google Authenticator/Authy) e ingresa el código de 6 dígitos.';
        errBox.style.display = 'block';
        setTimeout(function () { $('mv-mfa-codigo').focus(); }, 100);
    }

    async function login() {
        const email = ($('mv-email').value || '').trim();
        const password = ($('mv-password').value || '').trim();
        const errBox = $('mv-login-error');
        errBox.style.display = 'none';

        let r, data;
        const btn = $('mv-btn-login');
        btn.disabled = true;
        btn.textContent = 'Ingresando…';

        try {
            if (preauthMfaMovil) {
                // Fase 2: verificar código TOTP
                const codigo = ($('mv-mfa-codigo').value || '').trim().replace(/\s/g, '');
                if (!/^\d{6}$/.test(codigo)) {
                    errBox.textContent = 'Ingresa el código de 6 dígitos de tu app';
                    errBox.style.display = 'block';
                    return;
                }
                r = await fetch('/api/auth/mfa-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preauth: preauthMfaMovil, codigo })
                });
                data = await r.json();
                if (r.ok) { preauthMfaMovil = null; }
            } else {
                if (!email || !password) {
                    errBox.textContent = 'Escribe tu correo y contraseña';
                    errBox.style.display = 'block';
                    return;
                }
                r = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                data = await r.json();
                if (r.ok && data.mfa_requerido) {
                    preauthMfaMovil = data.preauth;
                    btn.disabled = false;
                    mostrarMfaMovil();
                    return;
                }
            }
            if (!r.ok) {
                let msg = data.error || data.message || 'Credenciales incorrectas';
                if (data.detalle) msg += '\n' + data.detalle;
                errBox.textContent = msg;
                errBox.style.display = 'block';
                return;
            }
            // v9.7 — el token vive solo en la cookie httpOnly; aquí solo
            // bandera + datos no sensibles.
            localStorage.removeItem('token');
            localStorage.setItem('sesion_activa', '1');
            const userData = data.usuario || data.user || {};
            localStorage.setItem('usuario', JSON.stringify(userData));
            mostrarApp();
            iniciarDatos();
        } catch (e) {
            errBox.textContent = 'Error de conexión con el servidor';
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = preauthMfaMovil ? 'Verificar e ingresar' : 'Ingresar';
        }
    }

    function salir() {
        try { fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {}); } catch (e) {}
        localStorage.removeItem('sesion_activa');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        mostrarLogin();
    }

    // Al abrir: si hay token, validar que siga vivo contra la API
    async function arrancar() {
        if (localStorage.getItem('sesion_activa') !== '1') { mostrarLogin(); return; }
        try {
            await api('/clientes?q=__ping__');
            mostrarApp();
            iniciarDatos();
        } catch (e) {
            // si era 401 salir() ya mostró el login; otro error: mostrar login igual
            mostrarLogin();
        }
    }

    function iniciarDatos() {
        cargarTasa();
        listarClientes('');
        cargarHistorial();
    }

    async function cargarTasa() {
        try {
            const r = await fetch('/api/bcv/actual');
            const j = await r.json();
            if (j && j.exito && j.tasa && j.tasa.usd) {
                draft.tasa_bcv = parseFloat(j.tasa.usd) || 0;
                const el = $('mv-tasa');
                if (el) el.value = draft.tasa_bcv;
            }
        } catch (e) { /* se puede escribir manual */ }
    }

    // ============================================================
    //  NAVEGACIÓN (pestañas inferiores)
    // ============================================================
    function irTab(nombre) {
        ['cotizar', 'clientes', 'historial'].forEach(t => {
            $('mv-tab-' + t).classList.toggle('activo', t === nombre);
            $('mv-nav-' + t).classList.toggle('activo', t === nombre);
        });
        if (nombre === 'clientes') listarClientes(($('mv-buscar-cli2') || {}).value || '');
        if (nombre === 'historial') cargarHistorial();
        window.scrollTo(0, 0);
    }

    // ============================================================
    //  ASISTENTE DE COTIZACIÓN (3 pasos)
    // ============================================================
    let draft = null;
    function nuevoDraft() {
        return {
            cliente: null,        // cliente existente seleccionado
            clienteNuevo: {},     // datos del cliente nuevo (se crea al guardar)
            items: [],            // [{inventario_id, codigo, descripcion, cantidad, precio_unitario_usd, disponible}]
            tipo_precio: 'contado',
            tasa_bcv: 0,
            observaciones: ''
        };
    }
    draft = nuevoDraft();

    function irPaso(n) {
        if (n >= 2) leerFormCliente(); // conservar lo escrito en el form
        if (n === 3 && !validarCliente(false)) return;
        if (n === 3 && !draft.items.length) { toast('Agrega al menos un artículo', 'warning'); return; }
        [1, 2, 3].forEach(i => {
            $('mv-paso' + i).style.display = i === n ? 'block' : 'none';
            const p = $('mv-p' + i);
            p.className = i < n ? 'listo' : (i === n ? 'actual' : '');
        });
        if (n === 3) pintarResumen();
        window.scrollTo(0, 0);
    }

    function validarCliente(avisarSiFalta) {
        if (draft.cliente) return true;
        const cn = draft.clienteNuevo || {};
        const ok = !!(cn.nombres && cn.apellidos && cn.cedula_rif);
        if (!ok && avisarSiFalta !== false) toast('Faltan los datos del cliente (paso 1)', 'warning');
        return ok;
    }

    function leerFormCliente() {
        if (draft.cliente) return;
        const v = (id) => { const el = $(id); return el ? el.value.trim() : ''; };
        const ocup = v('mv-cn-ocupacion') || 'No militar';
        draft.clienteNuevo = {
            nombres: v('mv-cn-nombres'), apellidos: v('mv-cn-apellidos'), cedula_rif: v('mv-cn-cedula'),
            telefono: v('mv-cn-telefono'), ocupacion: ocup,
            es_militar: ocup === 'Militar' ? 1 : 0,
            direccion: v('mv-cn-direccion')
        };
    }

    // ---------- paso 1: buscar / elegir cliente ----------
    let _resCli = [];
    async function buscarCliente(q) {
        const cont = $('mv-res-cli');
        if (!q || q.trim().length < 2) { cont.innerHTML = ''; _resCli = []; return; }
        try {
            const r = await api('/clientes?q=' + encodeURIComponent(q.trim()));
            _resCli = r.clientes || [];
            cont.innerHTML = _resCli.length
                ? '<div class="mv-res">' + _resCli.map((c, i) => `
                    <div class="item" onclick="Movil.elegirCliente(${i})">
                      <b>${esc(c.apellidos)}, ${esc(c.nombres)}</b> ${parseInt(c.es_militar) === 1 ? '🎖️' : ''}
                      <small>${esc(c.cedula_rif)}${c.telefono ? ' · ' + esc(c.telefono) : ''}</small>
                    </div>`).join('') + '</div>'
                : '<div class="mv-res"><div class="vacio">Sin coincidencias — regístralo en "Cliente nuevo".</div></div>';
        } catch (e) { cont.innerHTML = ''; }
    }

    function elegirCliente(i) {
        draft.cliente = _resCli[i];
        draft.clienteNuevo = {};
        $('mv-res-cli').innerHTML = '';
        $('mv-buscar-cli').value = '';
        $('mv-cli-sel').innerHTML = `
          <div class="mv-sel">
            <div><b>✓ Cliente:</b> ${esc(draft.cliente.apellidos)}, ${esc(draft.cliente.nombres)}<br>
            <small style="color:#4a5568;">${esc(draft.cliente.cedula_rif)}</small></div>
            <button class="mv-btn-mini" style="background:#e53e3e;color:#fff;" onclick="Movil.quitarCliente()">✕</button>
          </div>`;
        $('mv-cli-nuevo-card').style.display = 'none';
    }
    function quitarCliente() {
        draft.cliente = null;
        $('mv-cli-sel').innerHTML = '';
        $('mv-cli-nuevo-card').style.display = 'block';
    }

    // ---------- paso 2: artículos ----------
    let _resArt = [];
    async function buscarArticulo(q) {
        const cont = $('mv-res-art');
        if (!q || q.trim().length < 2) { cont.innerHTML = ''; _resArt = []; return; }
        try {
            const r = await api('/inventario?q=' + encodeURIComponent(q.trim()));
            _resArt = r.articulos || [];
            cont.innerHTML = _resArt.length
                ? '<div class="mv-res">' + _resArt.map((a, i) => {
                    const disp = parseInt(a.cantidad_disponible) || 0;
                    const precio = draft.tipo_precio === 'credito' ? a.precio_credito : a.precio_contado;
                    return `
                    <div class="item" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                      <div><b>${esc(a.codigo)}</b> — ${esc(a.descripcion)}
                        <small style="color:${disp > 0 ? '#38a169' : '#e53e3e'};font-weight:700;">quedan ${disp}</small>
                        <small>${fmtUSD(precio)}</small>
                      </div>
                      <button class="mv-btn-mini" style="${disp > 0 ? 'background:#38a169;color:#fff;' : 'background:#cbd5e0;color:#a0aec0;'}"
                        ${disp > 0 ? `onclick="Movil.agregarArticulo(${i})"` : 'disabled'}>＋</button>
                    </div>`; }).join('') + '</div>'
                : '<div class="mv-res"><div class="vacio">Sin coincidencias en inventario.</div></div>';
        } catch (e) { cont.innerHTML = ''; }
    }

    function agregarArticulo(i) {
        const a = _resArt[i];
        const disp = parseInt(a.cantidad_disponible) || 0;
        const existente = draft.items.find(x => x.inventario_id === a.id);
        if (existente) {
            if (existente.cantidad + 1 > disp) { toast('Solo quedan ' + disp + ' de ' + a.codigo, 'warning'); return; }
            existente.cantidad++;
        } else {
            if (disp < 1) { toast('Sin disponibilidad de ' + a.codigo, 'warning'); return; }
            const precio = draft.tipo_precio === 'credito' ? parseFloat(a.precio_credito) : parseFloat(a.precio_contado);
            draft.items.push({ inventario_id: a.id, codigo: a.codigo, descripcion: a.descripcion, cantidad: 1, precio_unitario_usd: precio || 0, disponible: disp });
        }
        pintarCarrito();
    }

    function cambiarCantidad(i, delta) {
        const it = draft.items[i];
        if (!it) return;
        let cant = it.cantidad + delta;
        if (cant < 1) cant = 1;
        if (it.disponible !== null && it.disponible !== undefined && cant > it.disponible) {
            toast('Disponible máximo: ' + it.disponible, 'warning');
            cant = it.disponible;
        }
        it.cantidad = cant;
        pintarCarrito();
    }
    function quitarArticulo(i) {
        draft.items.splice(i, 1);
        pintarCarrito();
    }

    function pintarCarrito() {
        const cont = $('mv-carrito');
        if (!draft.items.length) { cont.innerHTML = ''; recalcular(); return; }
        cont.innerHTML = '<h3 style="font-size:14px;color:#1a365d;margin:4px 0 8px;">🛒 Artículos de la cotización</h3>' +
            draft.items.map((it, i) => `
            <div class="mv-item-car">
              <div style="display:flex;justify-content:space-between;gap:8px;">
                <div>
                  <div class="desc">${esc(it.codigo)} — ${esc(it.descripcion)}</div>
                  <div class="precio">${fmtUSD(it.precio_unitario_usd)} c/u · quedan ${it.disponible}</div>
                </div>
                <button class="mv-btn-mini" style="background:#e53e3e;color:#fff;height:34px;" onclick="Movil.quitarArticulo(${i})">✕</button>
              </div>
              <div class="mv-cant">
                <button onclick="Movil.cambiarCantidad(${i},-1)">−</button>
                <span class="n">${it.cantidad}</span>
                <button onclick="Movil.cambiarCantidad(${i},1)">＋</button>
                <span class="sub">${fmtUSD(it.cantidad * it.precio_unitario_usd)}</span>
              </div>
            </div>`).join('');
        recalcular();
    }

    async function cambiarTipoPrecio(tipo) {
        draft.tipo_precio = tipo;
        // actualizar precios de los items ya agregados
        for (const it of draft.items) {
            if (!it.inventario_id) continue;
            try {
                const r = await api('/inventario?q=' + encodeURIComponent(it.codigo));
                const a = (r.articulos || []).find(x => x.id === it.inventario_id);
                if (a) it.precio_unitario_usd = parseFloat(tipo === 'credito' ? a.precio_credito : a.precio_contado) || it.precio_unitario_usd;
            } catch (e) { /* conservar precio */ }
        }
        pintarCarrito();
        buscarArticulo(($('mv-buscar-art') || {}).value || '');
    }

    function totalUsd() {
        return draft.items.reduce((s, i) => s + i.cantidad * i.precio_unitario_usd, 0);
    }

    function recalcular() {
        const tasaEl = $('mv-tasa');
        if (tasaEl) draft.tasa_bcv = parseFloat(tasaEl.value) || 0;
        const tot = totalUsd();
        const totBs = tot * (draft.tasa_bcv || 0);
        if ($('mv-total-usd')) $('mv-total-usd').textContent = fmtUSD(tot);
        if ($('mv-total-bs')) $('mv-total-bs').textContent = fmtBs(totBs);
    }

    // ---------- paso 3: resumen + guardar ----------
    function pintarResumen() {
        const c = draft.cliente;
        const cn = draft.clienteNuevo || {};
        const nombreCli = c ? `${esc(c.apellidos)}, ${esc(c.nombres)} (${esc(c.cedula_rif)})`
                            : `${esc(cn.apellidos || '')}, ${esc(cn.nombres || '')} (${esc(cn.cedula_rif || '')}) — <b>nuevo</b>`;
        $('mv-resumen').innerHTML = `
          <h3>Resumen</h3>
          <div style="font-size:13px;margin-bottom:8px;">👤 ${nombreCli}</div>
          <div style="font-size:13px;margin-bottom:8px;">💵 ${draft.tipo_precio === 'credito' ? 'Precio a crédito' : 'Precio al contado'}</div>
          ${draft.items.map(it => `<div style="font-size:13px;padding:4px 0;border-top:1px dashed #e2e8f0;">
            ${it.cantidad} × ${esc(it.codigo)} — ${esc(it.descripcion)} <b style="float:right;">${fmtUSD(it.cantidad * it.precio_unitario_usd)}</b>
          </div>`).join('')}`;
        const tasaEl = $('mv-tasa');
        if (tasaEl && draft.tasa_bcv) tasaEl.value = draft.tasa_bcv;
        recalcular();
    }

    async function guardarCotizacion() {
        leerFormCliente();
        if (!validarCliente()) { irPaso(1); return; }
        if (!draft.items.length) { toast('Agrega al menos un artículo', 'warning'); irPaso(2); return; }
        draft.observaciones = ($('mv-obs') || {}).value || '';

        const body = {
            fecha: new Date().toISOString().slice(0, 10),
            tipo_precio: draft.tipo_precio,
            moneda: 'USD',
            tasa_bcv: draft.tasa_bcv,
            observaciones: draft.observaciones,
            items: draft.items.map(i => ({ inventario_id: i.inventario_id, codigo: i.codigo, descripcion: i.descripcion, cantidad: i.cantidad, precio_unitario_usd: i.precio_unitario_usd }))
        };
        if (draft.cliente) body.cliente_id = draft.cliente.id;
        else body.cliente = draft.clienteNuevo;

        const btn = $('mv-btn-guardar');
        btn.disabled = true;
        try {
            const r = await api('/cotizaciones', { method: 'POST', body });
            const cot = r.cotizacion || {};
            toast('Cotización N° ' + fmtNum(cot.numero || 0) + ' guardada', 'success');
            // ofrecer generar la nota de inmediato (flujo natural en campo)
            const idCot = cot.id;
            resetearAsistente();
            if (idCot) {
                abrirNota(idCot, true); // true = viene del asistente (hay que pasarla a enviada primero)
            }
            cargarHistorial();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    function resetearAsistente() {
        draft = nuevoDraft();
        cargarTasa();
        ['mv-buscar-cli', 'mv-cn-nombres', 'mv-cn-apellidos', 'mv-cn-cedula', 'mv-cn-telefono', 'mv-cn-direccion', 'mv-buscar-art', 'mv-obs'].forEach(id => { const el = $(id); if (el) el.value = ''; });
        $('mv-cli-sel').innerHTML = '';
        $('mv-res-cli').innerHTML = '';
        $('mv-res-art').innerHTML = '';
        $('mv-cli-nuevo-card').style.display = 'block';
        $('mv-tipo-precio').value = 'contado';
        pintarCarrito();
        irPaso(1);
    }

    // ============================================================
    //  NOTA DE ENTREGA (sheet inferior)
    // ============================================================
    let notaCtx = null; // {cotizacionId, totalUsd, eraBorrador}

    async function abrirNota(cotizacionId, eraBorrador) {
        try {
            const r = await api('/cotizaciones/' + cotizacionId);
            const c = r.cotizacion;
            notaCtx = { cotizacionId, totalUsd: parseFloat(c.total_usd) || 0, eraBorrador: !!eraBorrador };
            $('mv-nota-resumen').innerHTML = `
              <b>Cotización N° ${esc(c.numero_fmt)}</b> — la nota llevará el mismo número.<br>
              Cliente: ${esc(c.apellidos)}, ${esc(c.nombres)} (${esc(c.cedula_rif)})<br>
              Total: <b>${fmtUSD(c.total_usd)}</b> · ${fmtBs(c.total_bs)}`;
            $('mv-ne-forma').value = 'contado';
            toggleCredito('contado');
            const manana15 = new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().slice(0, 10);
            $('mv-ne-fecha').value = manana15;
            $('mv-nota-overlay').classList.add('abierto');
        } catch (e) { toast(e.message, 'error'); }
    }

    function toggleCredito(v) {
        const esCredito = v === 'credito';
        $('mv-ne-credito').style.display = esCredito ? 'block' : 'none';
        if (esCredito && notaCtx) {
            // inicial sugerida: 30% del total (editable, igual que en escritorio)
            const sugerida = Math.round(notaCtx.totalUsd * 0.30 * 100) / 100;
            $('mv-ne-inicial').value = sugerida.toFixed(2);
            $('mv-ne-hint').textContent = 'Sugerida: 30% del total (' + fmtUSD(sugerida) + ') — cámbiala si cancela más o menos.';
        }
    }

    function cerrarNota() {
        $('mv-nota-overlay').classList.remove('abierto');
        notaCtx = null;
    }

    async function generarNota() {
        if (!notaCtx) return;
        const body = {
            forma_pago: $('mv-ne-forma').value,
            inicial_usd: parseFloat(($('mv-ne-inicial') || {}).value) || 0,
            cuotas_quincenales: parseInt(($('mv-ne-cuotas') || {}).value) || 0,
            primera_fecha: ($('mv-ne-fecha') || {}).value || ''
        };
        if (body.forma_pago === 'credito' && (body.cuotas_quincenales < 1 || body.cuotas_quincenales > 8)) {
            toast('Las cuotas deben estar entre 1 y 8', 'warning'); return;
        }
        const btn = $('mv-btn-nota');
        btn.disabled = true;
        try {
            // la nota solo se genera desde cotización enviada/aprobada:
            // si viene del asistente (borrador), la pasamos a enviada primero
            if (notaCtx.eraBorrador) {
                await api('/cotizaciones/' + notaCtx.cotizacionId + '/estado', { method: 'PUT', body: { estado: 'enviada' } });
            }
            const r = await api('/cotizaciones/' + notaCtx.cotizacionId + '/nota-entrega', { method: 'POST', body });
            cerrarNota();
            toast('Nota de entrega N° ' + fmtNum(r.nota_entrega.numero) + ' generada — inventario comprometido', 'success');
            cargarHistorial();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ============================================================
    //  PESTAÑA CLIENTES (buscar + editar)
    // ============================================================
    let _listaCli = [];
    async function listarClientes(q) {
        const cont = $('mv-lista-cli');
        if (!cont) return;
        try {
            const r = await api('/clientes' + (q && q.trim() ? '?q=' + encodeURIComponent(q.trim()) : ''));
            _listaCli = r.clientes || [];
            cont.innerHTML = _listaCli.length
                ? '<div class="mv-res">' + _listaCli.map((c, i) => `
                    <div class="item" onclick="Movil.editarCliente(${i})">
                      <b>${esc(c.apellidos)}, ${esc(c.nombres)}</b> ${parseInt(c.es_militar) === 1 ? '🎖️' : ''}
                      <small>${esc(c.cedula_rif)}${c.telefono ? ' · ' + esc(c.telefono) : ''}</small>
                    </div>`).join('') + '</div>'
                : '<div class="mv-res"><div class="vacio">Sin clientes — regístralo desde la pestaña Cotizar.</div></div>';
        } catch (e) {
            cont.innerHTML = `<p style="color:#e53e3e;font-size:13px;">${esc(e.message)}</p>`;
        }
    }

    function editarCliente(i) {
        const c = _listaCli[i];
        if (!c) return;
        const cont = $('mv-lista-cli');
        cont.innerHTML = `
          <div class="mv-card" style="border:1.5px solid #2c5282;">
            <h3>✏️ Editar cliente</h3>
            <div class="mv-fila2">
              <div><label class="mv-label">Nombres *</label><input id="mv-ec-nombres" class="mv-input" value="${esc(c.nombres || '')}"></div>
              <div><label class="mv-label">Apellidos *</label><input id="mv-ec-apellidos" class="mv-input" value="${esc(c.apellidos || '')}"></div>
            </div>
            <label class="mv-label">Cédula o RIF *</label><input id="mv-ec-cedula" class="mv-input" value="${esc(c.cedula_rif || '')}">
            <div class="mv-fila2">
              <div><label class="mv-label">Teléfono</label><input id="mv-ec-telefono" class="mv-input" type="tel" value="${esc(c.telefono || '')}"></div>
              <div><label class="mv-label">Ocupación</label>
                <select id="mv-ec-ocupacion" class="mv-input">
                  <option value="No militar" ${parseInt(c.es_militar) === 1 ? '' : 'selected'}>No militar</option>
                  <option value="Militar" ${parseInt(c.es_militar) === 1 ? 'selected' : ''}>Militar</option>
                </select></div>
            </div>
            <label class="mv-label">Sexo</label>
            <select id="mv-ec-sexo" class="mv-input">
              <option value="">—</option>
              <option value="Masculino" ${c.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
              <option value="Femenino" ${c.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
            </select>
            <label class="mv-label">Email</label><input id="mv-ec-email" type="email" class="mv-input" value="${esc(c.email || '')}">
            <label class="mv-label">Dirección</label><textarea id="mv-ec-direccion" class="mv-input" rows="2">${esc(c.direccion || '')}</textarea>
            <button class="mv-btn mv-btn-ok" onclick="Movil.guardarEdicionCliente(${c.id})">💾 Guardar cambios</button>
            <button class="mv-btn mv-btn-neutro" onclick="Movil.listarClientes('')">Cancelar</button>
          </div>`;
        window.scrollTo(0, 0);
    }

    async function guardarEdicionCliente(id) {
        const v = (i) => { const el = $(i); return el ? el.value.trim() : ''; };
        const ocup = v('mv-ec-ocupacion') || 'No militar';
        const body = {
            nombres: v('mv-ec-nombres'), apellidos: v('mv-ec-apellidos'), cedula_rif: v('mv-ec-cedula'),
            telefono: v('mv-ec-telefono'), ocupacion: ocup, es_militar: ocup === 'Militar' ? 1 : 0,
            sexo: v('mv-ec-sexo'), email: v('mv-ec-email'), direccion: v('mv-ec-direccion')
        };
        if (!body.nombres || !body.apellidos || !body.cedula_rif) {
            toast('Nombres, apellidos y cédula/RIF son obligatorios', 'warning'); return;
        }
        try {
            await api('/clientes/' + id, { method: 'PUT', body });
            toast('Cliente actualizado', 'success');
            listarClientes('');
        } catch (e) { toast(e.message, 'error'); }
    }

    // ============================================================
    //  PESTAÑA HISTORIAL (cotizaciones + generar nota pendiente)
    // ============================================================
    let soloMias = true;

    function filtroHistorial(mias) {
        soloMias = mias;
        $('mv-filtro-mias').style.cssText = mias ? 'background:#1a365d;color:#fff;' : 'background:#e2e8f0;color:#2d3748;';
        $('mv-filtro-todas').style.cssText = mias ? 'background:#e2e8f0;color:#2d3748;' : 'background:#1a365d;color:#fff;';
        cargarHistorial();
    }

    async function cargarHistorial() {
        const cont = $('mv-lista-cot');
        if (!cont) return;
        try {
            const r = await api('/cotizaciones');
            let cs = r.cotizaciones || [];
            if (soloMias) {
                const miNombre = (usuarioActual().nombre || '').toUpperCase();
                if (miNombre) cs = cs.filter(c => (c.vendedor_nombre || '').toUpperCase() === miNombre);
            }
            // más recientes primero
            cs = cs.slice().sort((a, b) => (b.numero || 0) - (a.numero || 0));
            if (!cs.length) { cont.innerHTML = '<div class="mv-res"><div class="vacio">Sin cotizaciones todavía.</div></div>'; return; }
            cont.innerHTML = cs.map(c => {
                const yaTieneNota = parseInt(c.nota_entrega_generada) === 1;
                const puedeNota = !yaTieneNota && (c.estado === 'enviada' || c.estado === 'aprobada');
                const esBorrador = c.estado === 'borrador';
                return `
                <div class="mv-cot">
                  <div class="top">
                    <span class="num">N° ${esc(c.numero_fmt)}</span>
                    <span class="badge b-${esc(c.estado)}">${esc(c.estado)}</span>
                  </div>
                  <div class="cli">${esc(c.apellidos)}, ${esc(c.nombres)}</div>
                  <div class="meta">${esc(c.cedula_rif)} · ${fmtFecha(c.fecha)} · 👤 ${esc(c.vendedor_nombre || '—')} · <b>${fmtUSD(c.total_usd)}</b></div>
                  <div class="acciones">
                    ${yaTieneNota ? '<span class="mv-btn-mini" style="background:#c6f6d5;color:#276749;">📦 Nota generada</span>' : ''}
                    ${esBorrador ? `<button class="mv-btn-mini" style="background:#805ad5;color:#fff;" onclick="Movil.enviarCotizacion(${c.id})">▶ Marcar enviada</button>` : ''}
                    ${puedeNota ? `<button class="mv-btn-mini" style="background:#38a169;color:#fff;" onclick="Movil.abrirNota(${c.id}, false)">📦 Generar nota</button>` : ''}
                  </div>
                </div>`; }).join('');
        } catch (e) {
            cont.innerHTML = `<p style="color:#e53e3e;font-size:13px;">${esc(e.message)}</p>`;
        }
    }

    async function enviarCotizacion(id) {
        try {
            await api('/cotizaciones/' + id + '/estado', { method: 'PUT', body: { estado: 'enviada' } });
            toast('Cotización enviada — ya puedes generar la nota', 'success');
            cargarHistorial();
        } catch (e) { toast(e.message, 'error'); }
    }

    // ============================================================
    //  ARRANQUE
    // ============================================================
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', arrancar);
    }

    return {
        login, salir, irTab,
        irPaso, buscarCliente, elegirCliente, quitarCliente,
        buscarArticulo, agregarArticulo, cambiarCantidad, quitarArticulo,
        cambiarTipoPrecio, recalcular, guardarCotizacion, resetearAsistente,
        abrirNota, toggleCredito, cerrarNota, generarNota,
        listarClientes, editarCliente, guardarEdicionCliente,
        filtroHistorial, cargarHistorial, enviarCotizacion,
        // expuestos para pruebas
        _test: { totalUsd, validarCliente, nuevoDraft,
                 setDraft: (d) => { draft = d; }, getDraft: () => draft,
                 setNotaCtx: (c) => { notaCtx = c; }, getNotaCtx: () => notaCtx }
    };
})();
