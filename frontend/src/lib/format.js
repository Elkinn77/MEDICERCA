import { CheckCircle2, Clock, MapPin, MapPinOff, PackageCheck, PackageSearch, Truck, XCircle } from 'lucide-react'

/** Config de cada estado: SIEMPRE etiqueta + icono, nunca solo color (ver
 * EstadoBadge en components/ui.jsx). `color` alimenta la paleta semántica:
 * green = positivo, red = error/crítico, yellow = advertencia, blue = neutro/info. */
export const ESTADO_ORDEN = {
  pendiente: { etiqueta: 'Pendiente de revisión', color: 'yellow', icono: Clock },
  aprobada: { etiqueta: 'Aprobada', color: 'green', icono: CheckCircle2 },
  rechazada: { etiqueta: 'Rechazada', color: 'red', icono: XCircle },
}

export const ESTADO_DOMICILIO = {
  confirmado: { etiqueta: 'Confirmado', color: 'blue', icono: PackageCheck },
  en_alistamiento: { etiqueta: 'En alistamiento', color: 'yellow', icono: PackageSearch },
  en_camino: { etiqueta: 'En camino', color: 'blue', icono: Truck },
  entregado: { etiqueta: 'Entregado', color: 'green', icono: CheckCircle2 },
}

export const NIVEL_DISPONIBILIDAD = {
  punto_mas_cercano: { etiqueta: 'Punto más cercano', color: 'green', icono: MapPin },
  otro_punto_ciudad: { etiqueta: 'Otro punto en tu ciudad', color: 'blue', icono: MapPin },
  otra_ciudad: { etiqueta: 'Disponible en otra ciudad', color: 'yellow', icono: MapPin },
  no_disponible: { etiqueta: 'No disponible', color: 'red', icono: MapPinOff },
}

export function formatearFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatearFechaCorta(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' })
}
