import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, Button } from '../components/ui'

export default function HomePage() {
  const { autenticado, esRegente } = useAuth()

  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-white shadow-lg">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Tus medicamentos, más cerca de ti</h1>
          <p className="mt-4 text-lg text-brand-50">
            MediCerca conecta tu EPS/IPS con puntos de venta cercanos: consulta disponibilidad, carga tu orden médica
            y haz seguimiento a tu domicilio en tiempo real.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!autenticado && (
              <>
                <Link to="/registro">
                  <Button className="bg-white !text-brand-700 hover:bg-brand-50">Crear cuenta</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </>
            )}
            <Link to="/catalogo">
              <Button variant="secondary" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
                Ver catálogo de medicamentos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <Card>
          <h3 className="font-semibold text-slate-900">1. Consulta disponibilidad</h3>
          <p className="mt-2 text-sm text-slate-500">
            Busca un medicamento y encuentra el punto de venta más cercano, con inventario en tiempo real de tu IPS.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900">2. Carga tu orden médica</h3>
          <p className="mt-2 text-sm text-slate-500">
            Sube tu fórmula y espera la aprobación del regente de tu IPS para medicamentos que la requieran.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900">3. Pide tu domicilio</h3>
          <p className="mt-2 text-sm text-slate-500">
            Haz seguimiento del pedido con una línea de tiempo completa, desde la confirmación hasta la entrega.
          </p>
        </Card>
      </section>

      {autenticado && (
        <section>
          <Card className="flex flex-wrap items-center justify-between gap-4 !bg-brand-50">
            <div>
              <h3 className="font-semibold text-slate-900">
                {esRegente ? 'Panel del regente' : 'Continúa donde quedaste'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {esRegente
                  ? 'Revisa las órdenes pendientes y actualiza el estado de los domicilios activos.'
                  : 'Revisa tus órdenes médicas y el seguimiento de tus domicilios.'}
              </p>
            </div>
            <Link to={esRegente ? '/regente/ordenes' : '/ordenes'}>
              <Button>{esRegente ? 'Ir a órdenes pendientes' : 'Ver mis órdenes'}</Button>
            </Link>
          </Card>
        </section>
      )}
    </div>
  )
}
