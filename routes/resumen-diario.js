// ============================================================
// ASISTENTE VIRTUAL IPSFA - Resumen diario y notificaciones
// ARCHIVO: routes/resumen-diario.js
// Montaje esperado: app.use('/api/resumen', require('./routes/resumen-diario').router);
// Las clases se exportan para el scheduler (cron): resumen 17:00 America/Caracas
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');

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
// CLASE: ResumenDiario
// Genera el resumen de actividad, cobros y estado de cartera del día
// ============================================================
class ResumenDiario {
    constructor(poolInst) {
        this.pool = poolInst;
    }

    // Tiendas a consultar: operador solo su tienda; admin sin tienda → todas
    _tiendasPara(tienda) {
        if (tienda && Object.prototype.hasOwnProperty.call(TIENDAS, tienda)) return [tienda];
        return Object.keys(TIENDAS);
    }

    /**
     * Genera el resumen del día para un usuario.
     * @param {number} usuarioId
     * @param {string|null} tienda - clave de tienda o null para consolidado
     * @returns {object} resumen del día
     */
    async generarResumen(usuarioId, tienda) {
        const tiendas = this._tiendasPara(tienda);
        const fecha = new Date().toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });

        const resumen = {
            usuario_id: usuarioId,
            tienda: tienda || 'todas',
            fecha,
            actividad: {
                pagos_registrados: 0,
                detalle_pagos: []
            },
            cobros: {
                monto_bs: 0,
                operaciones: 0
            },
            cartera: {
                total_clientes: 0,
                clientes_deudores: 0,
                clientes_al_dia: 0,
                clientes_morosos: 0,
                deuda_total: 0,
                recuperacion: 0
            }
        };

        let facturado = 0;
        let cobradoHistorico = 0;

        for (const t of tiendas) {
            // Cobros del día: SUM(monto_bs) de pagos_* de hoy (SPEC)
            const cobrosQ = `
                SELECT COUNT(*)::int AS operaciones, COALESCE(SUM(monto_bs), 0) AS monto_bs
                FROM ${TABLAS_PAGOS[t]}
                WHERE DATE(fecha) = CURRENT_DATE`;
            const cobros = await this.pool.query(cobrosQ);
            resumen.cobros.operaciones += cobros.rows[0].operaciones;
            resumen.cobros.monto_bs += Number(cobros.rows[0].monto_bs) || 0;
            resumen.actividad.pagos_registrados += cobros.rows[0].operaciones;

            // Detalle de pagos del día (máx. 10 por tienda)
            const detalleQ = `
                SELECT monto_bs, monto_usd, referencia, fecha
                FROM ${TABLAS_PAGOS[t]}
                WHERE DATE(fecha) = CURRENT_DATE
                ORDER BY fecha DESC
                LIMIT 10`;
            const detalle = await this.pool.query(detalleQ);
            for (const p of detalle.rows) {
                resumen.actividad.detalle_pagos.push({
                    tienda: t,
                    monto_bs: Number(p.monto_bs) || 0,
                    monto_usd: Number(p.monto_usd) || 0,
                    referencia: p.referencia,
                    fecha: p.fecha
                });
            }

            // Estado de cartera
            const carteraQ = `
                SELECT COUNT(*)::int AS total_clientes,
                       COUNT(*) FILTER (WHERE deuda > 0)::int AS clientes_deudores,
                       COUNT(*) FILTER (WHERE deuda <= 0)::int AS clientes_al_dia,
                       COUNT(*) FILTER (WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30)::int AS clientes_morosos,
                       COALESCE(SUM(deuda), 0) AS deuda_total,
                       COALESCE(SUM(monto_factura), 0) AS facturado,
                       COALESCE(SUM(monto_depositados), 0) AS cobrado
                FROM ${TIENDAS[t]}`;
            const c = await this.pool.query(carteraQ);
            const row = c.rows[0];
            resumen.cartera.total_clientes += row.total_clientes;
            resumen.cartera.clientes_deudores += row.clientes_deudores;
            resumen.cartera.clientes_al_dia += row.clientes_al_dia;
            resumen.cartera.clientes_morosos += row.clientes_morosos;
            resumen.cartera.deuda_total += Number(row.deuda_total) || 0;
            facturado += Number(row.facturado) || 0;
            cobradoHistorico += Number(row.cobrado) || 0;
        }

        resumen.cartera.recuperacion = facturado > 0
            ? Math.round((cobradoHistorico / facturado) * 10000) / 100
            : 0;

        resumen.mensaje = this._formatearMensaje(resumen);

        return resumen;
    }

    _formatearMensaje(r) {
        let msg = `📋 **Resumen del día — ${r.fecha}**\n`;
        msg += `\n💵 Cobros de hoy: **Bs. ${fmtBs(r.cobros.monto_bs)}** (${fmtNum(r.cobros.operaciones)} pagos registrados)`;
        msg += `\n📊 Cartera: ${fmtNum(r.cartera.total_clientes)} clientes, ${fmtNum(r.cartera.clientes_deudores)} deudores, ${fmtNum(r.cartera.clientes_morosos)} morosos`;
        msg += `\n💰 Deuda pendiente: Bs. ${fmtBs(r.cartera.deuda_total)} | Recuperación: ${r.cartera.recuperacion}%`;
        if (r.cobros.operaciones > 0) {
            msg += '\n\n🎉 ¡Buena jornada de cobranza hoy!';
        } else {
            msg += '\n\n💡 Hoy no se registraron pagos. Mañana arrancamos con todo.';
        }
        return msg;
    }

    // Guarda el resumen en la tabla resumenes_diarios (silencioso si no existe)
    async guardarResumen(resumen) {
        try {
            await this.pool.query(
                `INSERT INTO resumenes_diarios (usuario_id, tienda, resumen, fecha)
                 VALUES ($1, $2, $3, CURRENT_DATE)
                 ON CONFLICT (usuario_id, fecha)
                 DO UPDATE SET resumen = EXCLUDED.resumen, tienda = EXCLUDED.tienda`,
                [resumen.usuario_id, resumen.tienda, JSON.stringify(resumen)]
            );
        } catch (error) {
            console.warn('⚠️ No se pudo guardar el resumen diario:', error.message);
        }
    }
}

// ============================================================
// CLASE: NotificadorDiario
// Recorre usuarios activos y genera sus notificaciones diarias
// (usado por el scheduler cron a las 17:00 America/Caracas)
// ============================================================
class NotificadorDiario {
    constructor(poolInst) {
        this.pool = poolInst;
        this.resumenes = new ResumenDiario(poolInst);
    }

    async ejecutarNotificacionesDiarias() {
        const resultado = { usuarios_procesados: 0, notificaciones_creadas: 0, errores: 0 };

        let usuarios;
        try {
            const r = await this.pool.query(
                `SELECT id, nombre, rol, tienda FROM usuarios WHERE activo = true`
            );
            usuarios = r.rows;
        } catch (error) {
            console.error('❌ No se pudieron obtener los usuarios activos:', error.message);
            return { ...resultado, error: 'No se pudieron obtener los usuarios activos' };
        }

        for (const usuario of usuarios) {
            try {
                // Operadores: solo su tienda. Administradores: consolidado.
                const tienda = usuario.rol === 'operador' ? usuario.tienda : null;
                const resumen = await this.resumenes.generarResumen(usuario.id, tienda);

                const notificada = await this._crearNotificacion(
                    usuario.id,
                    '📋 Resumen del día',
                    resumen.mensaje,
                    'RESUMEN_DIARIO'
                );

                await this.resumenes.guardarResumen(resumen);

                resultado.usuarios_procesados++;
                // Solo cuenta si el INSERT de la notificación se realizó
                if (notificada) resultado.notificaciones_creadas++;
            } catch (error) {
                console.error(`❌ Error generando notificación para usuario ${usuario.id}:`, error.message);
                resultado.errores++;
            }
        }

        return resultado;
    }

    // Inserta una notificación (silencioso si la tabla aún no existe).
    // Esquema real: notificaciones(usuario_id, tipo, mensaje, datos JSONB, leida, created_at).
    // El título viaja dentro de datos para no romper el contrato de la tabla.
    async _crearNotificacion(usuarioId, titulo, mensaje, tipo) {
        try {
            await this.pool.query(
                `INSERT INTO notificaciones (usuario_id, tipo, mensaje, datos)
                 VALUES ($1, $2, $3, $4)`,
                [usuarioId, tipo, mensaje, JSON.stringify({ titulo })]
            );
            return true;
        } catch (error) {
            console.warn('⚠️ No se pudo crear la notificación:', error.message);
            return false;
        }
    }
}

// ============================================================
// Endpoints
// ============================================================

// GET /generar — ejecuta manualmente la generación de resúmenes (solo admin)
router.get('/generar', verificarToken, soloAdmin, async (req, res) => {
    try {
        const notificador = new NotificadorDiario(pool);
        const resultado = await notificador.ejecutarNotificacionesDiarias();
        return res.json({
            exito: true,
            mensaje: '✅ Resúmenes diarios generados y notificaciones enviadas.',
            resultado
        });
    } catch (error) {
        console.error('❌ Error en /resumen/generar:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudieron generar los resúmenes diarios.',
            codigo: 'ERROR_GENERAR_RESUMEN'
        });
    }
});

// GET /ver — resumen del día actual del usuario autenticado
router.get('/ver', verificarToken, async (req, res) => {
    try {
        const usuario = req.usuario;
        // Operadores siempre forzados a su tienda (SPEC)
        const tienda = usuario.rol === 'operador' ? usuario.tienda : null;

        if (usuario.rol === 'operador' && !Object.prototype.hasOwnProperty.call(TIENDAS, tienda)) {
            return res.status(400).json({
                exito: false,
                error: 'Tu usuario no tiene una tienda válida asignada.',
                codigo: 'TIENDA_INVALIDA'
            });
        }

        const resumenes = new ResumenDiario(pool);
        const resumen = await resumenes.generarResumen(usuario.id, tienda);

        return res.json({ exito: true, resumen });
    } catch (error) {
        console.error('❌ Error en /resumen/ver:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo generar el resumen del día.',
            codigo: 'ERROR_VER_RESUMEN'
        });
    }
});

module.exports = { router, ResumenDiario, NotificadorDiario };
