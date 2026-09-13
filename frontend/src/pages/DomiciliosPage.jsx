import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Truck } from 'lucide-react'
import { domiciliosApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ESTADO_DOMICILIO } from '../lib/format'
import { Alert, Card, CenteredLoader, EmptyState, EstadoBadge, PageHeader } from '../components/ui'

export default function DomiciliosPage() {
  const { usuario } = useAuth()
  const [domicilios, setDomicilios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    domiciliosApi
      .misDomicilios()
      .then(setDomicilios)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar tus domicilios.'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <PageHeader icon={Truck} title="Mis domicilios" description="Seguimiento de tus pedidos a domicilio." />

      {error && <Alert variant="error">{error}</Alert>}

      {cargando ? (
        <CenteredLoader label="Cargando tus domicilios…" />
      ) : domicilios.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Todavía no tienes domicilios"
          description="Cuando una orden médica sea aprobada, podrás pedirla a domicilio desde 'Mis órdenes'."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {domicilios.map((domicilio) => (
            <Link key={domicilio.id} to={`/domicilios/${usuario.ips_id}/${domicilio.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
                      <Truck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-bold text-navy-800">Domicilio #{domicilio.id}</p>
                  </div>
                  <EstadoBadge config={ESTADO_DOMICILIO[domicilio.estado]} />
                </div>
                <p className="mt-3 text-sm text-ink-soft">Orden médica #{domicilio.orden_id}</p>
                {domicilio.lat_actual != null && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Última posición: {domicilio.lat_actual}, {domicilio.lng_actual}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
