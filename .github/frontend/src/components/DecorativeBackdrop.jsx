/** Fondo decorativo: manchas de color difuminadas, estáticas (sin
 * animación a propósito — nada de movimiento que distraiga o desoriente).
 * Puramente visual: aria-hidden y sin interacción, para no interferir con
 * lectores de pantalla ni con el contenido real de la página. */
export default function DecorativeBackdrop({ variant = 'hero' }) {
  if (variant === 'auth') {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-navy-800/10 blur-3xl" />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl" aria-hidden="true">
      <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
    </div>
  )
}
