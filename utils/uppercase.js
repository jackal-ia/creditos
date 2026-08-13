/**
 * Helper para convertir campos de texto a mayúsculas
 * Opción A: Helper reutilizable
 * Versión: v1.0
 */

/**
 * Convierte a mayúsculas los valores string de los campos especificados
 * @param {Object} data - Objeto con los datos a procesar
 * @param {Array<String>} fields - Lista de nombres de campos a convertir
 * @returns {Object} - Objeto modificado con los campos en mayúsculas
 */
function toUpperCaseFields(data, fields) {
    const result = { ...data };
    fields.forEach(field => {
        if (result[field] !== undefined && result[field] !== null && typeof result[field] === 'string') {
            result[field] = result[field].toUpperCase().trim();
        }
    });
    return result;
}

/**
 * Convierte a mayúsculas TODOS los valores string de un objeto
 * Útil cuando se quieren convertir todos los campos de texto automáticamente
 * @param {Object} data - Objeto con los datos a procesar
 * @returns {Object} - Objeto modificado con todos los strings en mayúsculas
 */
function toUpperCaseAll(data) {
    const result = { ...data };
    Object.keys(result).forEach(key => {
        if (result[key] !== undefined && result[key] !== null && typeof result[key] === 'string') {
            result[key] = result[key].toUpperCase().trim();
        }
    });
    return result;
}

module.exports = {
    toUpperCaseFields,
    toUpperCaseAll
};
