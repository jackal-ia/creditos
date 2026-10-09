// ============================================================
// ASISTENTE VIRTUAL IPSFA - Interacciones personalizadas
// ARCHIVO: routes/asistente-interaccion.js
// Montaje esperado: app.use('/api/asistente', require('./routes/asistente-interaccion'));
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// WHITELIST DE TABLAS (NUNCA interpolar input del usuario en SQL)
// ============================================================
const TIENDAS = { caracas: 'tienda_caracas', maracay: 'tienda_maracay', maracaibo: 'tienda_maracaibo' };
const TABLAS_PAGOS = { caracas: 'pagos_caracas', maracay: 'pagos_maracay', maracaibo: 'pagos_maracaibo' };

const fmtBs = (valor) => new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

const fmtNum = (valor) => new Intl.NumberFormat('es-VE').format(Number(valor) || 0);

const nombreTienda = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ============================================================
// CLASE: MensajeroPersonalizado
// Genera bienvenida, recordatorio de medio día y despedida
// ============================================================
class MensajeroPersonalizado {
    constructor(poolInst) {
        this.pool = poolInst;

        this.saludos = {
            manana: ['¡Buenos días', '¡Muy buenos días', '¡Feliz mañana'],
            tarde: ['¡Buenas tardes', '¡Muy buenas tardes', '¡Feliz tarde'],
            noche: ['¡Buenas noches', '¡Muy buenas noches', '¡Feliz noche']
        };

        this.consejosGenerales = [
            '💡 "Los clientes con más de 30 días de mora tienen mucha menos probabilidad de pago. Prioriza el contacto temprano."',
            '💡 "Una llamada personalizada aumenta la tasa de pago en un 40%. ¡El trato directo funciona!"',
            '💡 "Revisar los clientes al día te ayuda a mantener el flujo de caja sano."',
            '💡 "Ofrecer planes de pago flexibles reduce la morosidad considerablemente."',
            '💡 "El seguimiento semanal mejora la recuperación de cartera. ¡La constancia es clave!"',
            '💡 "Registra los pagos apenas lleguen: la información al día es tu mejor aliada."'
        ];
    }

    // Hora actual en Venezuela (America/Caracas, UTC-4)
    _horaVenezuela() {
        const partes = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Caracas',
            hour: 'numeric',
            hour12: false
        }).formatToParts(new Date());
        const hora = parseInt(partes.find(p => p.type === 'hour').value, 10);
        return isNaN(hora) ? new Date().getHours() : hora % 24;
    }

    _obtenerMomento(hora) {
        if (hora >= 5 && hora < 12) return 'manana';
        if (hora >= 12 && hora < 19) return 'tarde';
        return 'noche';
    }

    _aleatorio(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    // Resuelve las tiendas a consultar según rol del usuario
    _tiendasPara(usuario) {
        if (usuario.rol === 'operador') {
            return Object.prototype.hasOwnProperty.call(TIENDAS, usuario.tienda) ? [usuario.tienda] : [];
        }
        return usuario.tienda && Object.prototype.hasOwnProperty.call(TIENDAS, usuario.tienda) ? [usuario.tienda] : Object.keys(TIENDAS);
    }

    // --------------------------------------------------------
    // Bienvenida: saludo según hora + minuta del día + consejo
    // --------------------------------------------------------
    async generarBienvenida(usuario) {
        const hora = this._horaVenezuela();
        const momento = this._obtenerMomento(hora);
        const tiendas = this._tiendasPara(usuario);

        const minuta = await this._generarMinuta(tiendas);
        const consejo = await this._obtenerConsejo(tiendas);

        const saludo = `${this._aleatorio(this.saludos[momento])}, ${usuario.nombre}!`;
        const mensaje = this._formatearBienvenida(saludo, minuta, consejo);

        return {
            saludo,
            nombre: usuario.nombre,
            momento,
            minuta,
            consejo,
            mensaje_completo: mensaje
        };
    }

    // Minuta del día: morosos top 5, próximas cuotas top 5, estado de cartera
    async _generarMinuta(tiendas) {
        const minuta = {
            morosos: [],
            proximas_cuotas: [],
            estado_cartera: null
        };

        for (const t of tiendas) {
            // Top 5 morosos: deuda > 0 y más de 30 días desde fecha_factura
            const morososQ = `
                SELECT nombre_apellido, nro_factura, deuda,
                       EXTRACT(DAY FROM NOW() - fecha_factura)::int AS dias_mora
                FROM ${TIENDAS[t]}
                WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30
                ORDER BY deuda DESC
                LIMIT 5`;
            const morosos = await this.pool.query(morososQ);
            for (const m of morosos.rows) {
                minuta.morosos.push({ tienda: t, ...m, deuda: Number(m.deuda) || 0 });
            }

            // Top 5 próximas cuotas: columna real proxima_cuota > 0 (SPEC)
            const cuotasQ = `
                SELECT nombre_apellido, nro_factura, proxima_cuota, deuda
                FROM ${TIENDAS[t]}
                WHERE proxima_cuota > 0
                ORDER BY proxima_cuota DESC
                LIMIT 5`;
            const cuotas = await this.pool.query(cuotasQ);
            for (const c of cuotas.rows) {
                minuta.proximas_cuotas.push({ tienda: t, ...c, proxima_cuota: Number(c.proxima_cuota) || 0, deuda: Number(c.deuda) || 0 });
            }
        }

        // Estado de cartera (consolidado de las tiendas del usuario)
        let estado = {
            total_clientes: 0,
            deuda_total: 0,
            clientes_deudores: 0,
            clientes_al_dia: 0,
            facturado: 0,
            cobrado: 0,
            recuperacion: 0
        };
        for (const t of tiendas) {
            const estadoQ = `
                SELECT COUNT(*)::int AS total_clientes,
                       COALESCE(SUM(deuda), 0) AS deuda_total,
                       COUNT(*) FILTER (WHERE deuda > 0)::int AS clientes_deudores,
                       COUNT(*) FILTER (WHERE deuda <= 0)::int AS clientes_al_dia,
                       COALESCE(SUM(monto_factura), 0) AS facturado,
                       COALESCE(SUM(monto_depositados), 0) AS cobrado
                FROM ${TIENDAS[t]}`;
            const r = await this.pool.query(estadoQ);
            const row = r.rows[0];
            estado.total_clientes += row.total_clientes;
            estado.deuda_total += Number(row.deuda_total) || 0;
            estado.clientes_deudores += row.clientes_deudores;
            estado.clientes_al_dia += row.clientes_al_dia;
            estado.facturado += Number(row.facturado) || 0;
            estado.cobrado += Number(row.cobrado) || 0;
        }
        estado.recuperacion = estado.facturado > 0
            ? Math.round((estado.cobrado / estado.facturado) * 10000) / 100
            : 0;
        minuta.estado_cartera = estado;

        return minuta;
    }

    // Consejo del día: contextual según datos reales, con fallback predefinido
    async _obtenerConsejo(tiendas) {
        try {
            let morosos = 0;
            let deudores = 0;
            let cuotasPendientes = 0;

            for (const t of tiendas) {
                const q = `
                    SELECT COUNT(*) FILTER (WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30)::int AS morosos,
                           COUNT(*) FILTER (WHERE deuda > 0)::int AS deudores,
                           COUNT(*) FILTER (WHERE proxima_cuota > 0)::int AS cuotas_pendientes
                    FROM ${TIENDAS[t]}`;
                const r = await this.pool.query(q);
                morosos += r.rows[0].morosos;
                deudores += r.rows[0].deudores;
                cuotasPendientes += r.rows[0].cuotas_pendientes;
            }

            if (morosos > 5) {
                return `💡 "Tienes ${fmtNum(morosos)} clientes morosos (+30 días). Prioriza esos contactos hoy: cada día cuenta."`;
            }
            if (cuotasPendientes > 10) {
                return `💡 "Hay ${fmtNum(cuotasPendientes)} cuotas próximas por cobrar. Un recordatorio amable hoy evita morosos mañana."`;
            }
            if (deudores > 20) {
                return `💡 "Tu cartera de deudores es amplia (${fmtNum(deudores)} clientes). Agrupa tus llamadas por monto para avanzar más rápido."`;
            }
        } catch (error) {
            console.warn('⚠️ No se pudo generar consejo contextual:', error.message);
        }
        return this._aleatorio(this.consejosGenerales);
    }

    _formatearBienvenida(saludo, minuta, consejo) {
        const fecha = new Date().toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });
        let msg = `${saludo} 🌟\n\n📋 **Minuta del día — ${fecha}**\n`;

        if (minuta.morosos.length > 0) {
            msg += `\n📞 **Morosos prioritarios (top ${minuta.morosos.length}):**`;
            for (const m of minuta.morosos) {
                msg += `\n• ${m.nombre_apellido} (${m.nro_factura}) — Bs. ${fmtBs(m.deuda)} — ${m.dias_mora} días de mora [${nombreTienda(m.tienda)}]`;
            }
        } else {
            msg += '\n✅ No hay clientes morosos (+30 días) por contactar. ¡Bien ahí!';
        }

        if (minuta.proximas_cuotas.length > 0) {
            msg += `\n\n💰 **Próximas cuotas por cobrar (top ${minuta.proximas_cuotas.length}):**`;
            for (const c of minuta.proximas_cuotas) {
                msg += `\n• ${c.nombre_apellido} (${c.nro_factura}) — cuota: Bs. ${fmtBs(c.proxima_cuota)} [${nombreTienda(c.tienda)}]`;
            }
        } else {
            msg += '\n\n📅 No hay cuotas próximas pendientes por ahora.';
        }

        const e = minuta.estado_cartera;
        if (e) {
            const semaforo = e.recuperacion >= 80 ? '🟢 Buena' : (e.recuperacion >= 50 ? '🟡 Mejorable' : '🔴 Atención');
            msg += '\n\n📊 **Estado de tu cartera:**';
            msg += `\n• Clientes: ${fmtNum(e.total_clientes)} (${fmtNum(e.clientes_deudores)} deudores, ${fmtNum(e.clientes_al_dia)} al día)`;
            msg += `\n• Deuda total: Bs. ${fmtBs(e.deuda_total)}`;
            msg += `\n• Recuperación: ${e.recuperacion}% ${semaforo}`;
        }

        msg += `\n\n${consejo}\n\n¡Éxito en tu jornada! 💪🇻🇪`;
        return msg;
    }

    // --------------------------------------------------------
    // Recordatorio de medio día: avance del día
    // --------------------------------------------------------
    async generarRecordatorio(usuario) {
        const tiendas = this._tiendasPara(usuario);

        let pagosHoy = 0;
        let montoHoy = 0;
        let clientesFaltan = 0;

        for (const t of tiendas) {
            const pagosQ = `
                SELECT COUNT(*)::int AS pagos, COALESCE(SUM(monto_bs), 0) AS monto
                FROM ${TABLAS_PAGOS[t]}
                WHERE DATE(fecha) = CURRENT_DATE`;
            const p = await this.pool.query(pagosQ);
            pagosHoy += p.rows[0].pagos;
            montoHoy += Number(p.rows[0].monto) || 0;

            const faltanQ = `
                SELECT COUNT(*)::int AS faltan
                FROM ${TIENDAS[t]}
                WHERE deuda > 0`;
            const f = await this.pool.query(faltanQ);
            clientesFaltan += f.rows[0].faltan;
        }

        const datos = { pagos_hoy: pagosHoy, monto_hoy: montoHoy, clientes_faltan: clientesFaltan };
        const mensaje = this._formatearRecordatorio(usuario.nombre, datos);

        return { ...datos, mensaje_completo: mensaje };
    }

    _formatearRecordatorio(nombre, d) {
        let msg = `⏰ ¡Hola de nuevo, ${nombre}! Es hora del chequeo de medio día.\n\n`;
        msg += `📈 **Avance de hoy:**`;
        msg += `\n• Pagos registrados hoy: ${fmtNum(d.pagos_hoy)}`;
        msg += `\n• Monto cobrado hoy: Bs. ${fmtBs(d.monto_hoy)}`;
        msg += `\n• Clientes que aún faltan por pagar: ${fmtNum(d.clientes_faltan)}\n`;

        if (d.pagos_hoy === 0) {
            msg += '\n🚀 Todavía no se registran pagos hoy. ¡A darle con todo en lo que queda de jornada!';
        } else {
            msg += '\n💪 ¡Vas bien! Mantén el ritmo y registra cada pago apenas llegue.';
        }
        return msg;
    }

    // --------------------------------------------------------
    // Despedida: resumen de lo logrado hoy
    // --------------------------------------------------------
    async generarDespedida(usuario) {
        const tiendas = this._tiendasPara(usuario);

        let pagosHoy = 0;
        let montoHoy = 0;
        let deudaRestante = 0;
        let morosos = 0;

        for (const t of tiendas) {
            const pagosQ = `
                SELECT COUNT(*)::int AS pagos, COALESCE(SUM(monto_bs), 0) AS monto
                FROM ${TABLAS_PAGOS[t]}
                WHERE DATE(fecha) = CURRENT_DATE`;
            const p = await this.pool.query(pagosQ);
            pagosHoy += p.rows[0].pagos;
            montoHoy += Number(p.rows[0].monto) || 0;

            const carteraQ = `
                SELECT COALESCE(SUM(deuda), 0) AS deuda,
                       COUNT(*) FILTER (WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30)::int AS morosos
                FROM ${TIENDAS[t]}`;
            const c = await this.pool.query(carteraQ);
            deudaRestante += Number(c.rows[0].deuda) || 0;
            morosos += c.rows[0].morosos;
        }

        const datos = { pagos_hoy: pagosHoy, monto_hoy: montoHoy, deuda_restante: deudaRestante, morosos };
        const mensaje = this._formatearDespedida(usuario.nombre, datos);

        return { ...datos, mensaje_completo: mensaje };
    }

    _formatearDespedida(nombre, d) {
        let msg = `🌙 ¡Hasta mañana, ${nombre}! Gracias por tu trabajo de hoy.\n\n`;
        msg += `📋 **Resumen de tu jornada:**`;
        msg += `\n• Pagos registrados hoy: ${fmtNum(d.pagos_hoy)}`;
        msg += `\n• Monto cobrado hoy: Bs. ${fmtBs(d.monto_hoy)}`;
        msg += `\n• Deuda restante en cartera: Bs. ${fmtBs(d.deuda_restante)}`;
        msg += `\n• Clientes morosos pendientes: ${fmtNum(d.morosos)}\n`;

        if (d.pagos_hoy > 0) {
            msg += '\n🎉 ¡Buen trabajo hoy! Mañana seguimos recuperando cartera.';
        } else {
            msg += '\n💡 Mañana es otra oportunidad: empieza contactando a los morosos prioritarios.';
        }
        msg += '\n¡Descansa! 😊🇻🇪';
        return msg;
    }
}

const mensajero = new MensajeroPersonalizado(pool);

// Actualiza usuarios.ultimo_acceso (silencioso si la columna aún no existe)
async function actualizarUltimoAcceso(usuarioId) {
    try {
        await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuarioId]);
    } catch (error) {
        console.warn('⚠️ No se pudo actualizar ultimo_acceso:', error.message);
    }
}

// ============================================================
// GET /bienvenida — saludo + minuta del día + consejo
// ============================================================
router.get('/bienvenida', verificarToken, async (req, res) => {
    try {
        const bienvenida = await mensajero.generarBienvenida(req.usuario);
        actualizarUltimoAcceso(req.usuario.id); // silencioso, sin await bloqueante
        return res.json({ exito: true, ...bienvenida });
    } catch (error) {
        console.error('❌ Error en /bienvenida:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo generar la bienvenida en este momento.',
            codigo: 'ERROR_BIENVENIDA'
        });
    }
});

// ============================================================
// GET /recordatorio — avance del día (medio día)
// ============================================================
router.get('/recordatorio', verificarToken, async (req, res) => {
    try {
        const recordatorio = await mensajero.generarRecordatorio(req.usuario);
        return res.json({ exito: true, ...recordatorio });
    } catch (error) {
        console.error('❌ Error en /recordatorio:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo generar el recordatorio en este momento.',
            codigo: 'ERROR_RECORDATORIO'
        });
    }
});

// ============================================================
// GET /despedida — resumen de lo logrado hoy
// ============================================================
router.get('/despedida', verificarToken, async (req, res) => {
    try {
        const despedida = await mensajero.generarDespedida(req.usuario);
        return res.json({ exito: true, ...despedida });
    } catch (error) {
        console.error('❌ Error en /despedida:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo generar la despedida en este momento.',
            codigo: 'ERROR_DESPEDIDA'
        });
    }
});

module.exports = router;
module.exports.MensajeroPersonalizado = MensajeroPersonalizado;
