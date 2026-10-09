// ============================================================
// ASISTENTE VIRTUAL IPSFA - Núcleo de consultas NLP
// ARCHIVO: routes/asistente.js
// Montaje esperado: app.use('/api/asistente', require('./routes/asistente'));
// ============================================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');
const validador = require('../utils/validaciones');

const router = express.Router();

// ============================================================
// WHITELIST DE TABLAS (NUNCA interpolar input del usuario en SQL)
// ============================================================
const TIENDAS = { caracas: 'tienda_caracas', maracay: 'tienda_maracay', maracaibo: 'tienda_maracaibo' };
const TABLAS_PAGOS = { caracas: 'pagos_caracas', maracay: 'pagos_maracay', maracaibo: 'pagos_maracaibo' };

// ============================================================
// Rate limit: 30 consultas por minuto por IP (SPEC, corrección 7)
// ============================================================
const limiterConsultar = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        exito: false,
        error: '¡Un momentico! Has hecho demasiadas consultas seguidas. Espera un minuto e intenta de nuevo. 😅',
        codigo: 'LIMITE_CONSULTAS'
    }
});

// ============================================================
// Helpers de formato (español venezolano)
// ============================================================
const fmtBs = (valor) => new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

const fmtNum = (valor) => new Intl.NumberFormat('es-VE').format(Number(valor) || 0);

const nombreTienda = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ============================================================
// CLASE: NLPProcessor
// Detección de intents por keywords ES-VE (sin IA externa)
// ============================================================
class NLPProcessor {
    constructor() {
        this.intents = {
            // --- Intents de gráficos (Fase 2) ---
            // Se definen primero: en empate de puntaje gana el primero,
            // así "gráfico" genérico mapea a cobros-por-tienda (SPEC).
            grafico_cobros_tienda: {
                tipoGrafico: 'cobros-por-tienda',
                keywords: ['gráfico de cobros', 'grafico de cobros', 'gráfico cobros por tienda', 'grafico cobros por tienda', 'gráfico por tienda', 'grafico por tienda', 'gráficos', 'graficos', 'gráfico', 'grafico']
            },
            grafico_cobros_mes: {
                tipoGrafico: 'cobros-por-mes',
                keywords: ['gráfico de cobros por mes', 'grafico de cobros por mes', 'cobros por mes', 'gráfico mensual', 'grafico mensual', 'cobros del año por mes', 'evolución de cobros', 'evolucion de cobros']
            },
            grafico_deuda_tienda: {
                tipoGrafico: 'deuda-por-tienda',
                keywords: ['gráfico de deuda', 'grafico de deuda', 'deuda por tienda']
            },
            grafico_top_deudores: {
                tipoGrafico: 'top-deudores',
                keywords: ['gráfico de deudores', 'grafico de deudores', 'top deudores', 'mayores deudores gráfico', 'mayores deudores grafico']
            },
            saludo: {
                keywords: ['hola', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches', 'buenas', 'qué tal', 'que tal', 'saludos', 'epa', 'buen día']
            },
            ayuda: {
                keywords: ['ayuda', 'ayúdame', 'ayudame', 'qué puedes hacer', 'que puedes hacer', 'cómo funcionas', 'como funcionas', 'opciones', 'comandos', 'qué sabes hacer', 'que sabes hacer']
            },
            cantidad_clientes: {
                keywords: ['cuántos clientes', 'cuantos clientes', 'cantidad de clientes', 'total de clientes', 'número de clientes', 'numero de clientes', 'clientes activos', 'cuántos clientes tengo', 'cuantos clientes tengo']
            },
            deuda_total: {
                keywords: ['deuda total', 'cuánto se debe', 'cuanto se debe', 'total por cobrar', 'cuánto deben', 'cuanto deben', 'deuda pendiente', 'cuánto me deben', 'cuanto me deben', 'monto por cobrar']
            },
            mayor_deudor: {
                keywords: ['mayor deudor', 'quién debe más', 'quien debe mas', 'el que más debe', 'el que mas debe', 'deuda más alta', 'deuda mas alta', 'mayor deuda', 'quién tiene la mayor deuda', 'quien tiene la mayor deuda', 'cliente que más debe']
            },
            clientes_morosos: {
                keywords: ['morosos', 'moroso', 'en mora', 'más de 30 días', 'mas de 30 dias', '30 días', '30 dias', 'vencidos', 'clientes atrasados', 'no han pagado', 'atrasados']
            },
            pagos_semana: {
                keywords: ['pagos de la semana', 'pagar esta semana', 'esta semana', 'próxima semana', 'proxima semana', 'cuotas pendientes', 'próximas cuotas', 'proximas cuotas', 'próxima cuota', 'proxima cuota', 'por cobrar esta semana', 'quiénes deben pagar', 'quienes deben pagar', 'cuántos deben pagar']
            },
            recuperacion: {
                keywords: ['recuperación', 'recuperacion', 'porcentaje de recuperación', 'porcentaje de recuperacion', 'recuperado', 'efectividad de cobro', 'qué tan efectivo', 'que tan efectivo', 'rendimiento de cobranza']
            },
            recaudado_mes: {
                keywords: ['recaudado', 'cobrado este mes', 'ingresos del mes', 'cuánto se ha cobrado', 'cuanto se ha cobrado', 'pagos del mes', 'recaudación', 'recaudacion', 'cobros del mes', 'cuánto hemos cobrado', 'cuanto hemos cobrado']
            },
            reporte_cartera: {
                keywords: ['reporte de cartera', 'estado de cartera', 'reporte', 'cartera', 'resumen de cartera', 'resumen general', 'reporte completo', 'cómo va la cartera', 'como va la cartera', 'estado general']
            }
        };

        this.tiendasConocidas = Object.keys(TIENDAS);
    }

    // Analiza la pregunta y devuelve { intent, confianza, tienda }
    analizarPregunta(pregunta, tiendaActual) {
        const lower = String(pregunta || '')
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, ''); // sin acentos para comparar

        let tienda = tiendaActual || null;

        // Detectar tienda mencionada en la pregunta
        for (const t of this.tiendasConocidas) {
            if (lower.includes(t)) {
                tienda = t;
                break;
            }
        }

        // Detectar intención por puntaje de keywords.
        // El puntaje es la keyword individual MÁS LARGA que coincide
        // (max, no suma): así una keyword específica como
        // 'grafico de cobros por mes' gana a la suma de keywords
        // genéricas solapadas ('grafico de cobros' + 'grafico').
        // El desempate sigue siendo por orden de definición.
        let mejorIntent = null;
        let mayorPuntaje = 0;
        let coincidencias = 0;

        for (const [intent, config] of Object.entries(this.intents)) {
            let puntaje = 0;
            let aciertos = 0;
            for (const keyword of config.keywords) {
                const kw = keyword.normalize('NFD').replace(/[̀-ͯ]/g, '');
                if (lower.includes(kw)) {
                    if (kw.length > puntaje) puntaje = kw.length;
                    aciertos++;
                }
            }
            if (puntaje > mayorPuntaje) {
                mayorPuntaje = puntaje;
                mejorIntent = intent;
                coincidencias = aciertos;
            }
        }

        if (!mejorIntent) {
            return { intent: 'fallback', tienda, confianza: 15 };
        }

        const confianza = Math.min(95, 50 + coincidencias * 15 + Math.min(mayorPuntaje, 20));
        return { intent: mejorIntent, tienda, confianza };
    }
}

// ============================================================
// CLASE: ReportGenerator
// Consultas SQL reales contra las columnas del contrato (SPEC)
// Nombres de tabla SOLO vía whitelist TIENDAS / TABLAS_PAGOS
// ============================================================
class ReportGenerator {
    constructor(poolInst) {
        this.pool = poolInst;
    }

    // Dispatcher principal: ejecuta el reporte según el intent
    async generar(intent, tiendas) {
        switch (intent) {
            case 'cantidad_clientes': return this.cantidadClientes(tiendas);
            case 'deuda_total': return this.deudaTotal(tiendas);
            case 'mayor_deudor': return this.mayorDeudor(tiendas);
            case 'clientes_morosos': return this.clientesMorosos(tiendas);
            case 'pagos_semana': return this.pagosSemana(tiendas);
            case 'recuperacion': return this.recuperacion(tiendas);
            case 'recaudado_mes': return this.recaudadoMes(tiendas);
            case 'reporte_cartera': return this.reporteCartera(tiendas);
            default: return null;
        }
    }

    async cantidadClientes(tiendas) {
        const porTienda = [];
        let total = 0;
        let deudores = 0;
        for (const t of tiendas) {
            const q = `
                SELECT COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE deuda > 0)::int AS deudores,
                       COUNT(*) FILTER (WHERE deuda <= 0)::int AS al_dia
                FROM ${TIENDAS[t]}`;
            const r = await this.pool.query(q);
            porTienda.push({ tienda: t, ...r.rows[0] });
            total += r.rows[0].total;
            deudores += r.rows[0].deudores;
        }
        return { total, deudores, porTienda };
    }

    async deudaTotal(tiendas) {
        const porTienda = [];
        let total = 0;
        for (const t of tiendas) {
            const q = `
                SELECT COALESCE(SUM(deuda), 0) AS deuda_total,
                       COUNT(*) FILTER (WHERE deuda > 0)::int AS clientes_deudores
                FROM ${TIENDAS[t]}`;
            const r = await this.pool.query(q);
            const deuda = Number(r.rows[0].deuda_total) || 0;
            porTienda.push({ tienda: t, deuda_total: deuda, clientes_deudores: r.rows[0].clientes_deudores });
            total += deuda;
        }
        return { total, porTienda };
    }

    async mayorDeudor(tiendas) {
        const deudores = [];
        for (const t of tiendas) {
            const q = `
                SELECT nombre_apellido, cedula, nro_factura, deuda
                FROM ${TIENDAS[t]}
                WHERE deuda > 0
                ORDER BY deuda DESC
                LIMIT 1`;
            const r = await this.pool.query(q);
            if (r.rows.length > 0) deudores.push({ tienda: t, ...r.rows[0], deuda: Number(r.rows[0].deuda) || 0 });
        }
        deudores.sort((a, b) => b.deuda - a.deuda);
        return { mayor: deudores[0] || null, porTienda: deudores };
    }

    // Morosos: deuda > 0 y más de 30 días desde fecha_factura (SPEC)
    async clientesMorosos(tiendas) {
        const porTienda = [];
        let total = 0;
        for (const t of tiendas) {
            const q = `
                SELECT nombre_apellido, nro_factura, deuda,
                       EXTRACT(DAY FROM NOW() - fecha_factura)::int AS dias_mora
                FROM ${TIENDAS[t]}
                WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30
                ORDER BY deuda DESC
                LIMIT 5`;
            const r = await this.pool.query(q);
            const countQ = `
                SELECT COUNT(*)::int AS total
                FROM ${TIENDAS[t]}
                WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30`;
            const c = await this.pool.query(countQ);
            const lista = r.rows.map(row => ({ ...row, deuda: Number(row.deuda) || 0 }));
            porTienda.push({ tienda: t, total: c.rows[0].total, top: lista });
            total += c.rows[0].total;
        }
        return { total, porTienda };
    }

    // Pagos de la semana: clientes con proxima_cuota > 0 (SPEC, corrección 5)
    async pagosSemana(tiendas) {
        const porTienda = [];
        let total = 0;
        let montoEstimado = 0;
        for (const t of tiendas) {
            const q = `
                SELECT nombre_apellido, nro_factura, proxima_cuota, deuda
                FROM ${TIENDAS[t]}
                WHERE proxima_cuota > 0
                ORDER BY proxima_cuota DESC
                LIMIT 5`;
            const r = await this.pool.query(q);
            const totQ = `
                SELECT COUNT(*)::int AS total, COALESCE(SUM(proxima_cuota), 0) AS monto
                FROM ${TIENDAS[t]}
                WHERE proxima_cuota > 0`;
            const tot = await this.pool.query(totQ);
            const lista = r.rows.map(row => ({ ...row, proxima_cuota: Number(row.proxima_cuota) || 0, deuda: Number(row.deuda) || 0 }));
            porTienda.push({ tienda: t, total: tot.rows[0].total, monto: Number(tot.rows[0].monto) || 0, top: lista });
            total += tot.rows[0].total;
            montoEstimado += Number(tot.rows[0].monto) || 0;
        }
        return { total, montoEstimado, porTienda };
    }

    // % recuperación = SUM(monto_depositados) / SUM(monto_factura) * 100
    async recuperacion(tiendas) {
        const porTienda = [];
        for (const t of tiendas) {
            const q = `
                SELECT COALESCE(SUM(monto_factura), 0) AS facturado,
                       COALESCE(SUM(monto_depositados), 0) AS cobrado,
                       COALESCE(SUM(deuda), 0) AS deuda
                FROM ${TIENDAS[t]}`;
            const r = await this.pool.query(q);
            const facturado = Number(r.rows[0].facturado) || 0;
            const cobrado = Number(r.rows[0].cobrado) || 0;
            const pct = facturado > 0 ? (cobrado / facturado) * 100 : 0;
            porTienda.push({ tienda: t, facturado, cobrado, deuda: Number(r.rows[0].deuda) || 0, porcentaje: Math.round(pct * 100) / 100 });
        }
        return { porTienda };
    }

    // Recaudado del mes: SUM(monto_bs) de pagos_* del mes en curso (SPEC)
    async recaudadoMes(tiendas) {
        const porTienda = [];
        let total = 0;
        let operaciones = 0;
        for (const t of tiendas) {
            const q = `
                SELECT COALESCE(SUM(monto_bs), 0) AS recaudado_bs,
                       COUNT(*)::int AS operaciones
                FROM ${TABLAS_PAGOS[t]}
                WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM NOW())
                  AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM NOW())`;
            const r = await this.pool.query(q);
            const rec = Number(r.rows[0].recaudado_bs) || 0;
            porTienda.push({ tienda: t, recaudado_bs: rec, operaciones: r.rows[0].operaciones });
            total += rec;
            operaciones += r.rows[0].operaciones;
        }
        return { total, operaciones, porTienda };
    }

    // Reporte consolidado de cartera por tienda
    async reporteCartera(tiendas) {
        const porTienda = [];
        for (const t of tiendas) {
            const q = `
                SELECT COUNT(*)::int AS total_clientes,
                       COALESCE(SUM(monto_factura), 0) AS total_facturado,
                       COALESCE(SUM(monto_depositados), 0) AS total_cobrado,
                       COALESCE(SUM(deuda), 0) AS total_deuda,
                       COUNT(*) FILTER (WHERE deuda > 0)::int AS clientes_deudores,
                       COUNT(*) FILTER (WHERE deuda <= 0)::int AS clientes_al_dia,
                       COUNT(*) FILTER (WHERE deuda > 0 AND EXTRACT(DAY FROM NOW() - fecha_factura) > 30)::int AS clientes_morosos
                FROM ${TIENDAS[t]}`;
            const r = await this.pool.query(q);
            const row = r.rows[0];
            const facturado = Number(row.total_facturado) || 0;
            const cobrado = Number(row.total_cobrado) || 0;
            porTienda.push({
                tienda: t,
                total_clientes: row.total_clientes,
                total_facturado: facturado,
                total_cobrado: cobrado,
                total_deuda: Number(row.total_deuda) || 0,
                clientes_deudores: row.clientes_deudores,
                clientes_al_dia: row.clientes_al_dia,
                clientes_morosos: row.clientes_morosos,
                recuperacion: facturado > 0 ? Math.round((cobrado / facturado) * 10000) / 100 : 0
            });
        }
        return { porTienda };
    }
}

// ============================================================
// Formateo de respuestas (español venezolano, emojis, montos es-VE)
// ============================================================
function formatearRespuesta(intent, datos, tiendas) {
    const variasTiendas = tiendas.length > 1;

    switch (intent) {
        case 'saludo':
            return '¡Hola, qué tal! 👋 Soy tu asistente virtual de IPSFA. Puedo ayudarte con la cartera de clientes, deudas, morosos, pagos de la semana y más. Escribe "ayuda" para ver todo lo que puedo hacer. 😊';

        case 'ayuda':
            return [
                '🤖 **Esto es lo que puedo hacer por ti:**',
                '',
                '• 👥 "¿Cuántos clientes tengo?"',
                '• 💰 "¿Cuál es la deuda total?"',
                '• ⚠️ "¿Quién es el mayor deudor?"',
                '• 📞 "¿Cuáles clientes están morosos?"',
                '• 📅 "¿Quiénes deben pagar esta semana?"',
                '• 📈 "¿Cómo va la recuperación?"',
                '• 💵 "¿Cuánto se ha recaudado este mes?"',
                '• 📊 "Dame un reporte de cartera"',
                '',
                'También puedes mencionar una tienda en tu pregunta, por ejemplo: "¿Cuántos clientes hay en Maracay?" 🇻🇪'
            ].join('\n');

        case 'cantidad_clientes': {
            let msg = `👥 Tienes un total de **${fmtNum(datos.total)} clientes** registrados`;
            msg += variasTiendas ? ' entre todas las tiendas:\n' : ':\n';
            for (const p of datos.porTienda) {
                msg += `\n🏪 **${nombreTienda(p.tienda)}**: ${fmtNum(p.total)} clientes (${fmtNum(p.deudores)} con deuda, ${fmtNum(p.al_dia)} al día)`;
            }
            return msg;
        }

        case 'deuda_total': {
            let msg = `💰 La deuda total pendiente por cobrar es de **Bs. ${fmtBs(datos.total)}**`;
            if (variasTiendas) {
                msg += ', distribuida así:\n';
                for (const p of datos.porTienda) {
                    msg += `\n🏪 **${nombreTienda(p.tienda)}**: Bs. ${fmtBs(p.deuda_total)} (${fmtNum(p.clientes_deudores)} deudores)`;
                }
            } else {
                msg += ` en ${fmtNum(datos.porTienda[0].clientes_deudores)} clientes de ${nombreTienda(datos.porTienda[0].tienda)}.`;
            }
            return msg;
        }

        case 'mayor_deudor': {
            if (!datos.mayor) return '✅ ¡Excelente! No hay clientes con deuda pendiente en este momento. 🎉';
            const m = datos.mayor;
            let msg = `⚠️ El mayor deudor es **${m.nombre_apellido}** (C.I. ${m.cedula}, factura ${m.nro_factura}) de **${nombreTienda(m.tienda)}**, con una deuda de **Bs. ${fmtBs(m.deuda)}**.`;
            if (datos.porTienda.length > 1) {
                msg += '\n\n📋 Mayores deudores por tienda:';
                for (const d of datos.porTienda) {
                    msg += `\n🏪 **${nombreTienda(d.tienda)}**: ${d.nombre_apellido} — Bs. ${fmtBs(d.deuda)}`;
                }
            }
            msg += '\n\n📞 Te recomiendo contactarlo cuanto antes.';
            return msg;
        }

        case 'clientes_morosos': {
            if (datos.total === 0) return '✅ ¡Qué buena noticia! No hay clientes morosos (con más de 30 días de mora) en este momento. 🎉';
            let msg = `🚨 Hay **${fmtNum(datos.total)} clientes morosos** (deuda activa con más de 30 días desde la factura):\n`;
            for (const p of datos.porTienda) {
                if (p.total === 0) continue;
                msg += `\n🏪 **${nombreTienda(p.tienda)}** (${fmtNum(p.total)} morosos):`;
                for (const c of p.top) {
                    msg += `\n• ${c.nombre_apellido} (${c.nro_factura}) — Bs. ${fmtBs(c.deuda)} — ${c.dias_mora} días de mora`;
                }
            }
            msg += '\n\n📞 Prioriza el contacto con estos clientes hoy mismo.';
            return msg;
        }

        case 'pagos_semana': {
            if (datos.total === 0) return '📅 No hay clientes con próxima cuota pendiente por cobrar en este momento. ✅';
            let msg = `📅 Hay **${fmtNum(datos.total)} clientes con cuota próxima** por un estimado de **Bs. ${fmtBs(datos.montoEstimado)}**:\n`;
            for (const p of datos.porTienda) {
                if (p.total === 0) continue;
                msg += `\n🏪 **${nombreTienda(p.tienda)}** (${fmtNum(p.total)} clientes):`;
                for (const c of p.top) {
                    msg += `\n• ${c.nombre_apellido} (${c.nro_factura}) — cuota: Bs. ${fmtBs(c.proxima_cuota)}`;
                }
            }
            msg += '\n\n💰 ¡A cobrar se ha dicho!';
            return msg;
        }

        case 'recuperacion': {
            let msg = '📈 **Estado de recuperación de cartera:**\n';
            for (const p of datos.porTienda) {
                const semaforo = p.porcentaje >= 80 ? '🟢' : (p.porcentaje >= 50 ? '🟡' : '🔴');
                msg += `\n🏪 **${nombreTienda(p.tienda)}**: ${p.porcentaje}% ${semaforo}`;
                msg += `\n   Facturado: Bs. ${fmtBs(p.facturado)} | Cobrado: Bs. ${fmtBs(p.cobrado)} | Pendiente: Bs. ${fmtBs(p.deuda)}\n`;
            }
            const prom = datos.porTienda.reduce((s, p) => s + p.porcentaje, 0) / datos.porTienda.length;
            msg += prom >= 80 ? '\n✅ ¡Vas muy bien con la recuperación!' : '\n💪 Hay espacio para mejorar la cobranza, ¡tú puedes!';
            return msg;
        }

        case 'recaudado_mes': {
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const mes = meses[new Date().getMonth()];
            let msg = `💵 En lo que va de **${mes}** se han recaudado **Bs. ${fmtBs(datos.total)}** en ${fmtNum(datos.operaciones)} pagos`;
            if (variasTiendas) {
                msg += ':\n';
                for (const p of datos.porTienda) {
                    msg += `\n🏪 **${nombreTienda(p.tienda)}**: Bs. ${fmtBs(p.recaudado_bs)} (${fmtNum(p.operaciones)} pagos)`;
                }
            } else {
                msg += ` en ${nombreTienda(datos.porTienda[0].tienda)}.`;
            }
            return msg;
        }

        case 'reporte_cartera': {
            let msg = '📊 **Reporte de cartera:**\n';
            for (const p of datos.porTienda) {
                const semaforo = p.recuperacion >= 80 ? '🟢' : (p.recuperacion >= 50 ? '🟡' : '🔴');
                msg += `\n🏪 **${nombreTienda(p.tienda)}** ${semaforo}`;
                msg += `\n• Clientes: ${fmtNum(p.total_clientes)} (${fmtNum(p.clientes_deudores)} deudores, ${fmtNum(p.clientes_al_dia)} al día)`;
                msg += `\n• Morosos (+30 días): ${fmtNum(p.clientes_morosos)}`;
                msg += `\n• Facturado: Bs. ${fmtBs(p.total_facturado)}`;
                msg += `\n• Cobrado: Bs. ${fmtBs(p.total_cobrado)} (${p.recuperacion}%)`;
                msg += `\n• Deuda pendiente: Bs. ${fmtBs(p.total_deuda)}\n`;
            }
            return msg;
        }

        default:
            return null;
    }
}

const RESPUESTA_FALLBACK = [
    '🤔 Mmm, no estoy seguro de haberte entendido, chamo. Intenta preguntarme algo como:',
    '',
    '• "¿Cuántos clientes tengo?"',
    '• "¿Cuál es la deuda total de Maracay?"',
    '• "¿Quiénes están morosos?"',
    '• "¿Cuánto se ha recaudado este mes?"',
    '',
    'O escribe "ayuda" para ver todo lo que puedo hacer. 😊'
].join('\n');

// ============================================================
// Instancias
// ============================================================
const nlp = new NLPProcessor();
const reportes = new ReportGenerator(pool);

// Guarda la conversación (silencioso: si la tabla aún no existe, no rompe la respuesta)
async function guardarConversacion(usuarioId, pregunta, respuesta, intent, tienda, confianza) {
    try {
        await pool.query(
            `INSERT INTO conversaciones_asistente (usuario_id, pregunta, respuesta, intent, tienda, confianza)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuarioId, pregunta, respuesta, intent, tienda || null, confianza ?? null]
        );
    } catch (error) {
        // Tabla conversaciones_asistente puede no existir aún: no interrumpir
        console.warn('⚠️ No se pudo guardar la conversación del asistente:', error.message);
    }
}

// ============================================================
// POST /consultar — procesa una pregunta en lenguaje natural
// ============================================================
router.post('/consultar', limiterConsultar, verificarToken, async (req, res) => {
    try {
        const { pregunta, tienda: tiendaBody } = req.body || {};

        // Validación básica de la pregunta
        if (!pregunta || typeof pregunta !== 'string' || pregunta.trim().length < 3) {
            return res.status(400).json({
                exito: false,
                error: 'La pregunta debe tener al menos 3 caracteres.',
                codigo: 'PREGUNTA_INVALIDA'
            });
        }
        if (pregunta.length > 500) {
            return res.status(400).json({
                exito: false,
                error: 'La pregunta es demasiado larga (máximo 500 caracteres).',
                codigo: 'PREGUNTA_MUY_LARGA'
            });
        }

        const usuario = req.usuario;
        let tienda = null;

        // Operadores SIEMPRE forzados a su tienda (SPEC)
        if (usuario.rol === 'operador') {
            tienda = usuario.tienda;
            if (!Object.prototype.hasOwnProperty.call(TIENDAS, tienda)) {
                return res.status(400).json({
                    exito: false,
                    error: 'Tu usuario no tiene una tienda válida asignada.',
                    codigo: 'TIENDA_INVALIDA'
                });
            }
        } else if (tiendaBody && Object.prototype.hasOwnProperty.call(TIENDAS, tiendaBody)) {
            tienda = tiendaBody;
        }

        // Análisis NLP (detecta también tienda mencionada en la pregunta)
        const analisis = nlp.analizarPregunta(pregunta, tienda);
        if (usuario.rol !== 'operador' && !tienda) tienda = analisis.tienda;

        const tiendas = tienda ? [tienda] : Object.keys(TIENDAS);

        let respuesta;
        if (analisis.intent === 'fallback') {
            respuesta = RESPUESTA_FALLBACK;
        } else {
            const datos = await reportes.generar(analisis.intent, tiendas);
            respuesta = formatearRespuesta(analisis.intent, datos, tiendas) || RESPUESTA_FALLBACK;
        }

        // Guardar conversación (silencioso)
        guardarConversacion(usuario.id, pregunta.trim(), respuesta, analisis.intent, tienda, analisis.confianza);

        return res.json({
            exito: true,
            respuesta,
            meta: {
                intent: analisis.intent,
                confianza: analisis.confianza,
                tienda: tienda || 'todas'
            }
        });
    } catch (error) {
        console.error('❌ Error en /consultar:', error);
        return res.status(500).json({
            exito: false,
            error: 'Ups, tuve un problemita procesando tu consulta. Intenta de nuevo en un momento. 😅',
            codigo: 'ERROR_CONSULTA'
        });
    }
});

// ============================================================
// GET /sugerencias — preguntas sugeridas según rol/tienda
// ============================================================
router.get('/sugerencias', verificarToken, async (req, res) => {
    try {
        const usuario = req.usuario;
        const esAdmin = usuario.rol === 'administrador';
        const tienda = esAdmin ? null : usuario.tienda;

        const sugerencias = [
            '¿Cuántos clientes tengo?',
            '¿Cuál es la deuda total?',
            '¿Quiénes están morosos?',
            '¿Quiénes deben pagar esta semana?',
            '¿Cuánto se ha recaudado este mes?',
            '¿Cómo va la recuperación?',
            '¿Quién es el mayor deudor?',
            'Dame un reporte de cartera'
        ];

        if (esAdmin) {
            sugerencias.push('¿Cuántos clientes hay en Caracas?');
            sugerencias.push('¿Cuál es la deuda total de Maracaibo?');
            sugerencias.push('Reporte de cartera de Maracay');
        } else if (tienda) {
            sugerencias.push(`¿Cuántos clientes hay en ${nombreTienda(tienda)}?`);
        }

        return res.json({
            exito: true,
            sugerencias,
            meta: { rol: usuario.rol, tienda: tienda || 'todas' }
        });
    } catch (error) {
        console.error('❌ Error en /sugerencias:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudieron cargar las sugerencias.',
            codigo: 'ERROR_SUGERENCIAS'
        });
    }
});

// ============================================================
// GET /notificaciones — notificaciones no leídas del usuario
// ============================================================
router.get('/notificaciones', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notificaciones
             WHERE usuario_id = $1 AND leida = false
             ORDER BY id DESC
             LIMIT 20`,
            [req.usuario.id]
        );
        return res.json({ exito: true, notificaciones: result.rows, total: result.rows.length });
    } catch (error) {
        console.error('❌ Error en /notificaciones:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudieron cargar las notificaciones.',
            codigo: 'ERROR_NOTIFICACIONES'
        });
    }
});

// ============================================================
// POST /notificaciones/:id/leida — marcar notificación como leída
// ============================================================
router.post('/notificaciones/:id/leida', verificarToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ exito: false, error: 'Identificador de notificación inválido.', codigo: 'ID_INVALIDO' });
        }
        const result = await pool.query(
            `UPDATE notificaciones SET leida = true
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [id, req.usuario.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ exito: false, error: 'Notificación no encontrada.', codigo: 'NO_ENCONTRADA' });
        }
        return res.json({ exito: true, mensaje: 'Notificación marcada como leída. ✅' });
    } catch (error) {
        console.error('❌ Error marcando notificación:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo marcar la notificación.',
            codigo: 'ERROR_NOTIFICACION'
        });
    }
});

module.exports = router;
module.exports.NLPProcessor = NLPProcessor;
module.exports.ReportGenerator = ReportGenerator;
module.exports.formatearRespuesta = formatearRespuesta;
module.exports.RESPUESTA_FALLBACK = RESPUESTA_FALLBACK;
