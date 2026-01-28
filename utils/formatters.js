/**
 * Funções de formatação de valores
 */

/**
 * Formata valor como moeda brasileira
 */
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata valor como porcentagem
 */
export const formatarPorcentagem = (valor, casasDecimais = 1) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0%'
  }
  if (valor === Infinity) {
    return '∞%'
  }
  return `${valor.toFixed(casasDecimais)}%`
}

/**
 * Formata horas (converte para horas e minutos)
 */
export const formatarHoras = (horas) => {
  if (horas === null || horas === undefined || isNaN(horas) || horas === 0) {
    return '0h'
  }
  
  if (horas < 1) {
    const minutos = Math.round(horas * 60)
    return `${minutos} min`
  }
  
  const h = Math.floor(horas)
  const m = Math.round((horas - h) * 60)
  
  if (m === 0) {
    return `${h}h`
  }
  
  return `${h}h ${m}min`
}

/**
 * Formata payback (meses)
 */
export const formatarPayback = (meses) => {
  if (meses === null || meses === undefined || isNaN(meses)) {
    return 'N/A'
  }
  
  if (meses === Infinity) {
    return 'N/A'
  }
  
  if (meses === 0) {
    return 'Imediato'
  }
  
  if (meses < 1) {
    const dias = Math.round(meses * 30)
    return `${dias} dias`
  }
  
  if (meses < 12) {
    return `${meses.toFixed(1)} meses`
  }
  
  const anos = Math.floor(meses / 12)
  const mesesRestantes = Math.round(meses % 12)
  
  if (mesesRestantes === 0) {
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  }
  
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`
}

/**
 * Formata número com separadores
 */
export const formatarNumero = (valor, casasDecimais = 0) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0'
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  }).format(valor)
}

/**
 * Formata minutos para formato legível
 */
export const formatarMinutos = (minutos) => {
  if (minutos === null || minutos === undefined || isNaN(minutos) || minutos === 0) {
    return '0 min'
  }
  
  if (minutos < 60) {
    return `${Math.round(minutos)} min`
  }
  
  const horas = Math.floor(minutos / 60)
  const mins = Math.round(minutos % 60)
  
  if (mins === 0) {
    return `${horas}h`
  }
  
  return `${horas}h ${mins}min`
}

/**
 * Formata ROI (trata Infinity)
 */
export const formatarROI = (roi) => {
  if (roi === null || roi === undefined || isNaN(roi)) {
    return '0%'
  }
  if (roi === Infinity) {
    return '∞%'
  }
  return formatarPorcentagem(roi)
}
