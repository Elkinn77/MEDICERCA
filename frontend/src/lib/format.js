export const ESTADO_ORDEN_LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' }
export const ESTADO_ORDEN_COLOR = { pendiente: 'yellow', aprobada: 'green', rechazada: 'red' }

export const ESTADO_DOMICILIO_LABEL = {
  confirmado: 'Confirmado',
  en_alistamiento: 'En alistamiento',
  en_camino: 'En camino',
  entregado: 'Entregado',
}
export const ESTADO_DOMICILIO_COLOR = {
  confirmado: 'blue',
  en_alistamiento: 'yellow',
  en_camino: 'blue',
  entregado: 'green',
}

export const NIVEL_DISPONIBILIDAD_LABEL = {
  punto_mas_cercano: 'Punto más cercano',
  otro_punto_ciudad: 'Otro punto en tu ciudad',
  otra_ciudad: 'Disponible en otra ciudad',
  no_disponible: 'No disponible',
}
export const NIVEL_DISPONIBILIDAD_COLOR = {
  punto_mas_cercano: 'green',
  otro_punto_ciudad: 'blue',
  otra_ciudad: 'yellow',
  no_disponible: 'red',
}

export function formatearFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatearFechaCorta(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' })
}
