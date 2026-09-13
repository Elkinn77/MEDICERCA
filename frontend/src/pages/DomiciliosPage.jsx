import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { domiciliosApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ESTADO_DOMICILIO_COLOR, ESTADO_DOMICILIO_LABEL } from '../lib/format'
import { Alert, Badge, Card, CenteredLoader, EmptyState, PageHeader } from '../components/ui'

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
      <PageHeader title="Mis domicilios" description="Seguimiento de tus pedidos a domicilio." />

      {error && <Alert variant="error">{error}</Alert>}

      {cargando ? (
        <CenteredLoader label="Cargando tus domicilios…" />
      ) : domicilios.length === 0 ? (
        <EmptyState
          title="Todavía no tienes domicilios"
          description="Cuando una orden médica sea aprobada, podrás pedirla a domicilio desde 'Mis órdenes'."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {domicilios.map((domicilio) => (
            <Link key={domicilio.id} to={`/domicilios/${usuario.ips_id}/${domicilio.id}`}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">Domicilio #{domicilio.id}</p>
                  <Badge color={ESTADO_DOMICILIO_COLOR[domicilio.estado]}>
                    {ESTADO_DOMICILIO_LABEL[domicilio.estado]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">Orden médica #{domicilio.orden_id}</p>
                {domicilio.lat_actual != null && (
                  <p className="mt-2 text-xs text-slate-400">
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
