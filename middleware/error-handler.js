// ============================================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ARCHIVO: middleware/error-handler.js
// Asistente Virtual IPSFA - Fase 1
// Códigos de error REALES de PostgreSQL (SQLSTATE):
//   23505 → violación de unicidad (registro duplicado)
//   23503 → violación de clave foránea
//   22P02 → formato de datos inválido (invalid_text_representation)
//   42703 → columna no existe en la tabla
//   ECONNREFUSED → no se pudo conectar a la base de datos
// Uso en server.js:
//   const errorHandler = require('./middleware/error-handler');
//   app.use(errorHandler.rutaNoEncontrada);
//   app.use(errorHandler.manejarError);
//   errorHandler.manejarPromesasNoManejadas();
// ============================================================

const logger = require('../utils/logger');

class ErrorHandler {
    constructor() {
        // Códigos de error conocidos de PostgreSQL y del driver pg
        this.erroresConocidos = {
            'ECONNREFUSED': 'No se pudo conectar a la base de datos',
            '23505': 'Violación de unicidad (registro duplicado)',
            '23503': 'Violación de clave foránea (referencia a registro inexistente)',
            '22P02': 'Formato de datos inválido',
            '42703': 'Columna no existe en la tabla'
        };
    }

    /**
     * Middleware global de errores de Express (4 parámetros).
     * Registra el error con contexto y responde según su tipo.
     * Firma ligada a la instancia para poder usarlo directamente con app.use().
     */
    manejarError = (err, req, res, next) => {
        // Si la respuesta ya se envió, delegar al manejador por defecto de Express
        if (res.headersSent) {
            return next(err);
        }

        // Log del error con contexto de la petición
        logger.errorCritico('Error en la aplicación', err, {
            url: req.url,
            metodo: req.method,
            cuerpo: req.body,
            usuario: req.usuario ? req.usuario.id : undefined,
            ip: req.ip
        });

        // Determinar tipo de error
        const errorInfo = this.analizarError(err);

        // Respuesta según el tipo de error
        if (errorInfo.tipo === 'base_datos') {
            return res.status(500).json({
                error: 'Error en la base de datos',
                mensaje: errorInfo.mensaje,
                codigo: errorInfo.codigo
            });
        }

        if (errorInfo.tipo === 'validacion') {
            return res.status(400).json({
                error: 'Error de validación',
                mensaje: errorInfo.mensaje,
                detalles: errorInfo.detalles
            });
        }

        if (errorInfo.tipo === 'autenticacion') {
            return res.status(401).json({
                error: 'Error de autenticación',
                mensaje: errorInfo.mensaje
            });
        }

        // Error genérico: el detalle solo se expone en desarrollo
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Ocurrió un error inesperado'
        });
    };

    /**
     * Clasifica el error según su código/nombre.
     * @returns {object} { tipo, mensaje, codigo?, detalles? }
     */
    analizarError(err) {
        // Error de base de datos PostgreSQL (código SQLSTATE o del driver)
        if (err.code && this.erroresConocidos[err.code]) {
            return {
                tipo: 'base_datos',
                mensaje: this.erroresConocidos[err.code],
                codigo: err.code
            };
        }

        // Error de validación (Joi, express-validator, etc.)
        if (err.name === 'ValidationError') {
            return {
                tipo: 'validacion',
                mensaje: 'Datos inválidos',
                detalles: err.details
            };
        }

        // Errores de autenticación JWT
        if (err.name === 'JsonWebTokenError') {
            return {
                tipo: 'autenticacion',
                mensaje: 'Token inválido'
            };
        }

        if (err.name === 'TokenExpiredError') {
            return {
                tipo: 'autenticacion',
                mensaje: 'Token expirado'
            };
        }

        // Error genérico
        return {
            tipo: 'desconocido',
            mensaje: err.message || 'Error desconocido'
        };
    }

    /**
     * Middleware para rutas no encontradas (404).
     * Firma ligada a la instancia para usarlo con app.use().
     */
    rutaNoEncontrada = (req, res) => {
        logger.warn(`Ruta no encontrada: ${req.method} ${req.url}`, {
            ip: req.ip,
            usuario: req.usuario ? req.usuario.id : undefined
        });

        res.status(404).json({
            error: 'Ruta no encontrada',
            mensaje: `No se encontró la ruta ${req.method} ${req.url}`
        });
    };

    /**
     * Registra manejadores globales de proceso:
     * - unhandledRejection: promesas rechazadas sin catch
     * - uncaughtException: excepciones no capturadas
     *   (en producción se reinicia el proceso tras registrar el error)
     */
    manejarPromesasNoManejadas() {
        process.on('unhandledRejection', (reason, promise) => {
            logger.errorCritico('Promesa no manejada', reason instanceof Error ? reason : new Error(String(reason)), {
                promesa: String(promise)
            });
        });

        process.on('uncaughtException', (error) => {
            logger.errorCritico('Excepción no capturada', error);

            // En producción, salir del proceso para que un supervisor lo reinicie
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        });
    }
}

// Exportar como singleton: una única instancia compartida por toda la app
module.exports = new ErrorHandler();
