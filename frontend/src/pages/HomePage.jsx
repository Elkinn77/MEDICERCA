import { Link } from 'react-router-dom'
import { ClipboardCheck, FileText, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Button } from '../components/ui'

export default function HomePage() {
  const { autenticado, esRegente } = useAuth()

  return (
    <div className="flex flex-col gap-14">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-brand-700 px-6 py-16 text-white shadow-lg sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-brand-100">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Interoperabilidad en salud, sin fricción
          </span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Tus medicamentos, más cerca de ti</h1>
          <p className="mt-5 text-lg text-brand-50 sm:text-xl">
            MediCerca conecta tu EPS/IPS con puntos de venta cercanos: consulta disponibilidad, carga tu orden médica
            y haz seguimiento a tu domicilio en tiempo real.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {!autenticado && (
              <>
                <Link to="/registro">
                  <Button className="!bg-white !text-brand-700 hover:!bg-brand-50">Crear cuenta</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </>
            )}
            <Link to="/catalogo">
              <Button variant="secondary" className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                Ver catálogo de medicamentos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Card>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-navy-800">1. Consulta disponibilidad</h3>
          <p className="mt-2 text-base text-ink-soft">
            Busca un medicamento y encuentra el punto de venta más cercano, con inventario en tiempo real de tu IPS.
          </p>
        </Card>
        <Card>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-navy-800">2. Carga tu orden médica</h3>
          <p className="mt-2 text-base text-ink-soft">
            Sube tu fórmula y espera la aprobación del regente de tu IPS para medicamentos que la requieran.
          </p>
        </Card>
        <Card>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Truck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-navy-800">3. Pide tu domicilio</h3>
          <p className="mt-2 text-base text-ink-soft">
            Haz seguimiento del pedido con una línea de tiempo completa, desde la confirmación hasta la entrega.
          </p>
        </Card>
      </section>

      {autenticado && (
        <section>
          <Card className="!bg-brand-50 !border-brand-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
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
