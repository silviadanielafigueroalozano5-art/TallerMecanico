export function esCorreoValido(valor) {
  if (typeof valor !== 'string' || valor.length > 254 || /\s/.test(valor)) return false
  const partes = valor.split('@')
  if (partes.length !== 2) return false
  const [local, dominio] = partes
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false
  if (!/^[A-Z0-9.!#$%&'*+/=?^_{|}~-]+$/i.test(local)) return false
  const etiquetas = dominio.split('.')
  if (etiquetas.length < 2 || etiquetas.some((etiqueta) => !etiqueta || etiqueta.length > 63 || !/^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(etiqueta))) return false
  return etiquetas[etiquetas.length - 1].length >= 2
}
