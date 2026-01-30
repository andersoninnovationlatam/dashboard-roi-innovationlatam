/**
 * Utilitários para validação de valores em cards do Dashboard
 */

/**
 * Verifica se um valor é válido para exibição
 * @param {*} value - Valor a ser verificado
 * @param {boolean} allowZero - Se true, permite zero como valor válido (default: false)
 * @returns {boolean} - true se o valor é válido, false caso contrário
 */
export const isValidValue = (value, allowZero = false) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return false
    if (!allowZero && value === 0) return false
  }
  return true
}

/**
 * Verifica se um valor numérico é válido e diferente de zero
 * @param {*} value - Valor a ser verificado
 * @returns {boolean} - true se o valor é válido e diferente de zero
 */
export const hasValidNonZeroValue = (value) => {
  return isValidValue(value, false)
}

/**
 * Verifica se um valor numérico é válido (incluindo zero)
 * @param {*} value - Valor a ser verificado
 * @returns {boolean} - true se o valor é válido (incluindo zero)
 */
export const hasValidValue = (value) => {
  return isValidValue(value, true)
}
