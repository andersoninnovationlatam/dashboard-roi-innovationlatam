/**
 * Utilitário para logs de debug que evita problemas com extensões do navegador
 * e requisições interceptadas
 */

// Flag para desabilitar logs em produção ou quando necessário
const DEBUG_LOGS_ENABLED = import.meta.env.DEV || false

// Cache de AbortControllers para cancelar requisições antigas se necessário
const activeRequests = new Map()

/**
 * Envia log de debug de forma segura, evitando erros de extensões do navegador
 * @param {string} location - Localização do código (ex: 'file.js:123')
 * @param {string} message - Mensagem do log
 * @param {object} data - Dados adicionais
 */
export const debugLog = (location, message, data = {}) => {
  // Se logs estão desabilitados, retorna imediatamente
  if (!DEBUG_LOGS_ENABLED) {
    return
  }

  // Usa requestIdleCallback se disponível para não bloquear a UI
  // Caso contrário, usa setTimeout com delay mínimo
  const scheduleLog = (callback) => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(callback, { timeout: 100 })
    } else {
      setTimeout(callback, 0)
    }
  }

  scheduleLog(() => {
    try {
      const logData = {
        location,
        message,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'F'
      }

      // Cancela requisição anterior para o mesmo location se existir
      const requestKey = `${location}:${message}`
      if (activeRequests.has(requestKey)) {
        const controller = activeRequests.get(requestKey)
        controller.abort()
        activeRequests.delete(requestKey)
      }

      // Cria novo AbortController para esta requisição
      const controller = new AbortController()
      activeRequests.set(requestKey, controller)

      // Faz fetch com timeout e abort
      const timeoutId = setTimeout(() => {
        controller.abort()
        activeRequests.delete(requestKey)
      }, 1000) // Timeout de 1 segundo

      fetch('http://127.0.0.1:7242/ingest/06b48f4d-09b2-466b-ab45-b2db14eca3d1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
        signal: controller.signal,
        // Modo 'no-cors' pode ajudar com extensões, mas limita resposta
        // Usamos 'cors' por padrão e apenas ignoramos erros
        mode: 'cors',
        // Não espera resposta - fire and forget
        cache: 'no-cache'
      })
        .then(() => {
          clearTimeout(timeoutId)
          activeRequests.delete(requestKey)
        })
        .catch((error) => {
          // Ignora erros silenciosamente - não são críticos
          // Erros comuns:
          // - AbortError: requisição foi cancelada (ok)
          // - NetworkError: extensão bloqueou (ok)
          // - TypeError: CORS ou canal fechado (ok)
          if (error.name !== 'AbortError') {
            // Apenas loga erros não-abort em desenvolvimento
            if (DEBUG_LOGS_ENABLED && console && console.debug) {
              console.debug('Debug log failed (non-critical):', error.name)
            }
          }
          clearTimeout(timeoutId)
          activeRequests.delete(requestKey)
        })
    } catch (error) {
      // Erro ao criar log - ignora silenciosamente
      // Não deve nunca quebrar a aplicação
    }
  })
}

/**
 * Limpa todas as requisições pendentes (útil para cleanup)
 */
export const clearDebugLogs = () => {
  activeRequests.forEach((controller) => {
    controller.abort()
  })
  activeRequests.clear()
}
