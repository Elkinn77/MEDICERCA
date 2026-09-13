import { Link } from 'react-router-dom'
import { ClipboardCheck, FileText, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Button } from '../components/ui'
import DecorativeBackdrop from '../components/DecorativeBackdrop'

const PASOS = [
  {
    icono: MapPin,
    titulo: '1. Consulta disponibilidad',
    texto: 'Busca un medicamento y encuentra el punto de venta más cercano, con inventario en tiempo real de tu IPS.',
  },
  {
    icono: FileText,
    titulo: '2. Carga tu orden médica',
    texto: 'Sube tu fórmula y espera la aprobación del regente de tu IPS para medicamentos que la requieran.',
  },
  {
    icono: Truck,
    titulo: '3. Pide tu domicilio',
    texto: 'Haz seguimiento del pedido con una línea de tiempo completa, desde la confirmación hasta la entrega.',
  },
]

export default function HomePage() {
  const { autenticado, esRegente } = useAuth()

  return (
    <div className="flex flex-col gap-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700 px-6 py-20 text-white shadow-[0_30px_60px_-30px_rgba(13,44,70,0.6)] sm:px-10">
        <DecorativeBackdrop variant="hero" />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="glass-panel-dark mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Interoperabilidad en salud, sin fricción
          </span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Tus medicamentos, <span className="text-gradient-brand">más cerca de ti</span>
          </h1>
          <p className="mt-5 text-lg text-brand-50 sm:text-xl">
            MediCerca conecta tu EPS/IPS con puntos de venta cercanos: consulta disponibilidad, carga tu orden médica
            y haz seguimiento a tu domicilio en tiempo real.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {!autenticado && (
              <>
                <Link to="/registro">
                  <Button className="!bg-none !bg-white !text-brand-700 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)] hover:!bg-brand-50">
                    Crear cuenta
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="glass-panel-dark !border-white/25 !text-white hover:!bg-white/20">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </>
            )}
            <Link to="/catalogo">
              <Button variant="secondary" className="glass-panel-dark !border-white/25 !text-white hover:!bg-white/20">
                Ver catálogo de medicamentos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {PASOS.map((paso) => (
          <Card key={paso.titulo} interactive className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-400 to-navy-700" />
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
              <paso.icono className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-navy-800">{paso.titulo}</h3>
            <p className="mt-2 text-base text-ink-soft">{paso.texto}</p>
          </Card>
        ))}
      </section>

      {autenticado && (
        <section>
          <Card className="!border-brand-100 !bg-brand-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
                  <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-800">
                    {esRegente ? 'Panel del regente' : 'Continúa donde quedaste'}
                  </h3>
                  <p className="mt-1 text-base text-ink-soft">
                    {esRegente
                      ? 'Revisa las órdenes pendientes y actualiza el estado de los domicilios activos.'
                      : 'Revisa tus órdenes médicas y el seguimiento de tus domicilios.'}
                  </p>
                </div>
              </div>
              <Link to={esRegente ? '/regente/ordenes' : '/ordenes'}>
                <Button>{esRegente ? 'Ir a órdenes pendientes' : 'Ver mis órdenes'}</Button>
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
