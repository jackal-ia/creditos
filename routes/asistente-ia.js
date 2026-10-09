// ============================================================
// ASISTENTE VIRTUAL IPSFA - Rutas IA (Fase 2) + Gráficos
// ARCHIVO: routes/asistente-ia.js
// Montaje esperado DESPUÉS de las rutas Fase 1 (mismo prefijo):
//   app.use('/api/asistente', require('./routes/asistente'));
//   app.use('/api/asistente', require('./routes/asistente-ia'));
//
// Principios (SPEC Fase 2):
// - Fallback TOTAL a Fase 1: cualquier fallo de Gemini/red/config
//   responde con las plantillas determinísticas. Nunca 500 por
//   culpa de la IA.
// - La IA NUNCA ejecuta SQL ni inventa números: solo redacta a
//   partir de datos agregados ya calculados (ReportGenerator y
//   generadores de gráficos determinísticos con whitelist).
// ============================================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');
const { TIENDAS, TABLAS_PAGOS } = require('../config/asistente-config');
const ia = require('../services/ia-service');
const asistente = require('./asistente');

const { NLPProcessor, ReportGenerator, formatearRespuesta, RESPUESTA_FALLBACK } = asistente;

const router = express.Router();

// ============================================================
// Rate limit del endpoint IA: 20 consultas por minuto por IP
// ============================================================
const limiterIA = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        exito: false,
        error: '¡Un momentico! Has hecho demasiadas consultas seguidas. Espera un minuto e intenta de nuevo. 😅',
        codigo: 'LIMITE_CONSULTAS_IA'
    }
});

// ============================================================
// Instancias (mismo NLP y reportes determinísticos de Fase 1,
// ya con los intents de gráficos agregados en asistente.js)
// ============================================================
const nlp = new NLPProcessor();
const reportes = new ReportGenerator(pool);

// ============================================================
// Intents de gráficos -> tipo de gráfico (whitelist)
// ============================================================
const INTENTS_GRAFICO = {
    grafico_cobros_tienda: 'cobros-por-tienda',
    grafico_cobros_mes: 'cobros-por-mes',
    grafico_deuda_tienda: 'deuda-por-tienda',
    grafico_top_deudores: 'top-deudores'
};

const TIPOS_GRAFICO = ['cobros-por-tienda', 'cobros-por-mes', 'deuda-por-tienda', 'top-deudores'];

// ============================================================
// Helpers de formato (mismo estilo de Fase 1)
// ============================================================
const fmtBs = (valor) => new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(valor) || 0);

const nombreTienda = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ============================================================
// GENERADORES DE GRÁFICOS (consultas SQL determinísticas)
// Contrato del objeto grafico (SPEC):
// { tipo, titulo, chart: 'bar'|'line'|'donut', series:[{name,data}],
//   categorias:[...], moneda:'Bs' }
// Nombres de tabla SOLO vía whitelist TIENDAS / TABLAS_PAGOS.
// ============================================================

// cobros-por-tienda -> SUM(monto_depositados) por tienda (bar)
async function graficoCobrosPorTienda(tiendas) {
    const categorias = [];
    const data = [];
    for (const t of tiendas) {
        const r = await pool.query(
            `SELECT COALESCE(SUM(monto_depositados), 0) AS total FROM ${TIENDAS[t]}`
        );
        categorias.push(nombreTienda(t));
        data.push(Number(r.rows[0].total) || 0);
    }
    return {
        tipo: 'cobros-por-tienda',
        titulo: 'Cobros por tienda (Bs)',
        chart: 'bar',
        series: [{ name: 'Cobrado', data }],
        categorias,
        moneda: 'Bs'
    };
}

// deuda-por-tienda -> SUM(deuda) por tienda (bar)
async function graficoDeudaPorTienda(tiendas) {
    const categorias = [];
    const data = [];
    for (const t of tiendas) {
        const r = await pool.query(
            `SELECT COALESCE(SUM(deuda), 0) AS total FROM ${TIENDAS[t]}`
        );
        categorias.push(nombreTienda(t));
        data.push(Number(r.rows[0].total) || 0);
    }
    return {
        tipo: 'deuda-por-tienda',
        titulo: 'Deuda por tienda (Bs)',
        chart: 'bar',
        series: [{ name: 'Deuda pendiente', data }],
        categorias,
        moneda: 'Bs'
    };
}

// cobros-por-mes -> últimos 6 meses desde TABLAS_PAGOS (line,
// una serie por tienda o solo la tienda del operador)
async function graficoCobrosPorMes(tiendas) {
    const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Categorías: últimos 6 meses calendario (incluye el mes en curso)
    const ahora = new Date();
    const clavesMes = [];
    const categorias = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        clavesMes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        categorias.push(`${MESES_CORTOS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
    }

    const series = [];
    for (const t of tiendas) {
        const r = await pool.query(
            `SELECT TO_CHAR(date_trunc('month', fecha), 'YYYY-MM') AS mes,
                    COALESCE(SUM(monto_bs), 0) AS total
             FROM ${TABLAS_PAGOS[t]}
             WHERE fecha >= date_trunc('month', NOW()) - INTERVAL '5 months'
             GROUP BY 1`
        );
        const porMes = {};
        for (const row of r.rows) porMes[row.mes] = Number(row.total) || 0;
        series.push({
            name: tiendas.length > 1 ? nombreTienda(t) : 'Cobrado',
            data: clavesMes.map(m => porMes[m] || 0)
        });
    }

    return {
        tipo: 'cobros-por-mes',
        titulo: 'Cobros por mes, últimos 6 meses (Bs)',
        chart: 'line',
        series,
        categorias,
        moneda: 'Bs'
    };
}

// top-deudores -> top 10 deuda (bar horizontal; categorias=nombres)
async function graficoTopDeudores(tiendas) {
    const deudores = [];
    for (const t of tiendas) {
        const r = await pool.query(
            `SELECT nombre_apellido, COALESCE(deuda, 0) AS deuda
             FROM ${TIENDAS[t]}
             WHERE deuda > 0
             ORDER BY deuda DESC
             LIMIT 10`
        );
        for (const row of r.rows) {
            deudores.push({
                nombre: row.nombre_apellido,
                tienda: t,
                deuda: Number(row.deuda) || 0
            });
        }
    }
    deudores.sort((a, b) => b.deuda - a.deuda);
    const top = deudores.slice(0, 10);

    const variasTiendas = tiendas.length > 1;
    return {
        tipo: 'top-deudores',
        titulo: 'Top 10 mayores deudores (Bs)',
        chart: 'bar',
        horizontal: true,
        series: [{ name: 'Deuda', data: top.map(d => d.deuda) }],
        categorias: top.map(d => variasTiendas ? `${d.nombre} (${nombreTienda(d.tienda)})` : d.nombre),
        moneda: 'Bs'
    };
}

// Dispatcher de gráficos (tipo ya validado contra whitelist)
async function generarGrafico(tipo, tiendas) {
    switch (tipo) {
        case 'cobros-por-tienda': return graficoCobrosPorTienda(tiendas);
        case 'deuda-por-tienda': return graficoDeudaPorTienda(tiendas);
        case 'cobros-por-mes': return graficoCobrosPorMes(tiendas);
        case 'top-deudores': return graficoTopDeudores(tiendas);
        default: return null;
    }
}

// Datos agregados del gráfico para que la IA redacte (sin cédulas
// ni teléfonos: solo nombres y montos cuando aplique). Se incluye el
// total precalculado (suma de la serie) para que la IA no tenga que
// calcularlo y el validador anti-alucinación lo encuentre.
function resumenGrafico(grafico) {
    const total = grafico.series.reduce((s, serie) =>
        s + (Array.isArray(serie.data) ? serie.data.reduce((a, b) => a + (Number(b) || 0), 0) : 0), 0);
    return {
        tipo_grafico: grafico.tipo,
        titulo: grafico.titulo,
        moneda: grafico.moneda,
        total,
        categorias: grafico.categorias,
        series: grafico.series
    };
}

// Total de deuda del resumen de cartera (suma por tiendas), para que
// la IA lo cite sin calcularlo y el validador lo encuentre.
function totalDeudaCartera(resumen) {
    if (!resumen || !Array.isArray(resumen.porTienda)) return 0;
    return resumen.porTienda.reduce((s, t) => s + (Number(t.total_deuda) || 0), 0);
}

// Respuesta corta de plantilla para intents de gráfico (fallback Fase 1)
function textoCortoGrafico(grafico) {
    const total = grafico.series.reduce((s, serie) =>
        s + serie.data.reduce((a, b) => a + (Number(b) || 0), 0), 0);
    switch (grafico.tipo) {
        case 'cobros-por-tienda':
            return `📊 Aquí tienes el gráfico de **cobros por tienda**. Total cobrado: **Bs. ${fmtBs(total)}**.`;
        case 'deuda-por-tienda':
            return `📊 Aquí tienes el gráfico de **deuda por tienda**. Deuda total pendiente: **Bs. ${fmtBs(total)}**.`;
        case 'cobros-por-mes':
            return `📈 Aquí tienes la **evolución de cobros de los últimos 6 meses**. Total del período: **Bs. ${fmtBs(total)}**.`;
        case 'top-deudores':
            return grafico.categorias.length > 0
                ? '📊 Aquí tienes el **top 10 de mayores deudores**. 📞 Conviene contactarlos cuanto antes.'
                : '✅ ¡Excelente! No hay clientes con deuda pendiente en este momento. 🎉';
        default:
            return '📊 Aquí tienes tu gráfico.';
    }
}

// ============================================================
// Guarda la conversación (silencioso: si la tabla aún no
// existe, no rompe la respuesta). Mismo patrón de Fase 1.
// ============================================================
async function guardarConversacion(usuarioId, pregunta, respuesta, intent, tienda, confianza) {
    try {
        await pool.query(
            `INSERT INTO conversaciones_asistente (usuario_id, pregunta, respuesta, intent, tienda, confianza)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuarioId, pregunta, respuesta, intent, tienda || null, confianza ?? null]
        );
    } catch (error) {
        console.warn('⚠️ No se pudo guardar la conversación del asistente (IA):', error.message);
    }
}

// Intenta redactar con IA; cualquier error devuelve null
// (doble protección: ia.redactar ya nunca lanza).
async function intentarIA(payload) {
    try {
        return await ia.redactar(payload);
    } catch (error) {
        console.warn('⚠️ Error inesperado llamando a Gemini; usando plantillas Fase 1:', error.message);
        return null;
    }
}

// ============================================================
// POST /ia/consultar — consulta con IA (fallback total a Fase 1)
// Misma validación y mismas reglas de rol/tienda que /consultar.
// ============================================================
router.post('/ia/consultar', limiterIA, verificarToken, async (req, res) => {
    try {
        const { pregunta, tienda: tiendaBody } = req.body || {};

        // Validación básica de la pregunta (igual que /consultar)
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

        // 1. Análisis NLP (mismo NLP de Fase 1, con intents de gráficos)
        const analisis = nlp.analizarPregunta(pregunta, tienda);
        if (usuario.rol !== 'operador' && !tienda) tienda = analisis.tienda;

        const tiendas = tienda ? [tienda] : Object.keys(TIENDAS);

        let respuesta = null;
        let grafico = null;
        let usadaIA = false;
        const iaDisponible = ia.disponible();

        const tipoGrafico = Object.prototype.hasOwnProperty.call(INTENTS_GRAFICO, analisis.intent)
            ? INTENTS_GRAFICO[analisis.intent]
            : null;

        if (tipoGrafico) {
            // 2-3. Intent de gráfico: datos determinísticos + texto corto
            grafico = await generarGrafico(tipoGrafico, tiendas);
            const datos = resumenGrafico(grafico);
            if (iaDisponible) {
                const textoIA = await intentarIA({
                    pregunta: pregunta.trim(),
                    intent: analisis.intent,
                    datos,
                    tienda,
                    usuario
                });
                if (textoIA) {
                    respuesta = textoIA;
                    usadaIA = true;
                }
            }
            if (!respuesta) respuesta = textoCortoGrafico(grafico);
        } else if (analisis.intent === 'fallback') {
            // 5. Fallback: con IA se envía la pregunta + resumen agregado
            // (totales por tienda); sin IA, plantilla de Fase 1.
            if (iaDisponible) {
                const resumen = await reportes.reporteCartera(tiendas);
                const textoIA = await intentarIA({
                    pregunta: pregunta.trim(),
                    intent: 'fallback',
                    datos: { resumen_cartera: resumen, total: totalDeudaCartera(resumen) },
                    tienda,
                    usuario
                });
                if (textoIA) {
                    respuesta = textoIA;
                    usadaIA = true;
                }
            }
            if (!respuesta) respuesta = RESPUESTA_FALLBACK;
        } else {
            // 4. Intent normal: datos determinísticos Fase 1; la IA solo redacta
            const datos = await reportes.generar(analisis.intent, tiendas);
            // Reporte de cartera: agregar el total de deuda precalculado
            // (suma por tiendas) para el validador anti-alucinación.
            if (datos && analisis.intent === 'reporte_cartera') {
                datos.total = totalDeudaCartera(datos);
            }
            if (iaDisponible && datos) {
                const textoIA = await intentarIA({
                    pregunta: pregunta.trim(),
                    intent: analisis.intent,
                    datos,
                    tienda,
                    usuario
                });
                if (textoIA) {
                    respuesta = textoIA;
                    usadaIA = true;
                }
            }
            if (!respuesta) respuesta = formatearRespuesta(analisis.intent, datos, tiendas) || RESPUESTA_FALLBACK;
        }

        // Guardar conversación (silencioso)
        guardarConversacion(usuario.id, pregunta.trim(), respuesta, analisis.intent, tienda, analisis.confianza);

        // 6. Respuesta con contrato Fase 2
        return res.json({
            exito: true,
            respuesta,
            grafico,
            meta: {
                intent: analisis.intent,
                confianza: analisis.confianza,
                tienda: tienda || 'todas',
                ia: usadaIA,
                proveedor: usadaIA ? ia.estado().proveedor : null
            }
        });
    } catch (error) {
        // Solo errores de base de datos/lógica llegan aquí; los errores
        // de la IA ya hicieron fallback silencioso a Fase 1.
        console.error('❌ Error en /ia/consultar:', error);
        return res.status(500).json({
            exito: false,
            error: 'Ups, tuve un problemita procesando tu consulta. Intenta de nuevo en un momento. 😅',
            codigo: 'ERROR_CONSULTA_IA'
        });
    }
});

// ============================================================
// GET /ia/grafico?tipo=X&tienda=Y — datos de gráfico directos
// Tipos whitelist; operador forzado a su tienda.
// ============================================================
router.get('/ia/grafico', verificarToken, async (req, res) => {
    try {
        const { tipo, tienda: tiendaQuery } = req.query || {};

        if (!tipo || !TIPOS_GRAFICO.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                error: `Tipo de gráfico inválido. Tipos permitidos: ${TIPOS_GRAFICO.join(', ')}.`,
                codigo: 'TIPO_GRAFICO_INVALIDO'
            });
        }

        const usuario = req.usuario;
        let tienda = null;

        // Operador: SIEMPRE forzado a su tienda (SPEC)
        if (usuario.rol === 'operador') {
            tienda = usuario.tienda;
            if (!Object.prototype.hasOwnProperty.call(TIENDAS, tienda)) {
                return res.status(400).json({
                    exito: false,
                    error: 'Tu usuario no tiene una tienda válida asignada.',
                    codigo: 'TIENDA_INVALIDA'
                });
            }
        } else if (tiendaQuery && Object.prototype.hasOwnProperty.call(TIENDAS, tiendaQuery)) {
            tienda = tiendaQuery;
        }

        const tiendas = tienda ? [tienda] : Object.keys(TIENDAS);
        const grafico = await generarGrafico(tipo, tiendas);

        return res.json({
            exito: true,
            grafico,
            meta: { tipo, tienda: tienda || 'todas' }
        });
    } catch (error) {
        console.error('❌ Error en /ia/grafico:', error);
        return res.status(500).json({
            exito: false,
            error: 'No se pudo generar el gráfico. Intenta de nuevo en un momento. 😅',
            codigo: 'ERROR_GRAFICO'
        });
    }
});

module.exports = router;
