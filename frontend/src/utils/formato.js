/**
 * Utilidades compartidas de formato para tablas y vistas.
 */

export function formatoFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatoDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)
}

export function nombreCompleto(cliente) {
  if (!cliente) return '—'
  return (
    [cliente.nombre, cliente.apellido]
      .filter(Boolean)
      .map((parte) => parte)
      .join(' ') || '—'
  )
}
