import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Truck, UserCheck } from 'lucide-react'
import { medicamentosApi, ordenesApi } from '../api'
import { ApiError } from '../api/client'
import { ESTADO_ORDEN, formatearFecha } from '../lib/format'
import { Alert, Button, Card, CenteredLoader, EstadoBadge } from '../components/ui'

export default function OrdenDetallePage() {
  const { ipsId, ordenId } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [medicamento, setMedicamento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setCargando(true)
    setError('')
    ordenesApi
      .obtener(ipsId, ordenId)
      .then(async (datos) => {
        setOrden(datos)
        try {
          setMedicamento(await medicamentosApi.obtener(datos.medicamento_id))
        } catch {
          setMedicamento(null)
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar la orden.'))
      .finally(() => setCargando(false))
  }, [ipsId, ordenId])

  if (cargando) return <CenteredLoader label="Cargando orden…" />
  if (error) return <Alert variant="error">{error}</Alert>
  if (!orden) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/ordenes" className="flex w-fit items-center gap-1.5 text-base font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a mis órdenes
      </Link>

      <Card className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-navy-800">Orden médica #{orden.id}</h1>
            <p className="text-base text-ink-soft">{medicamento ? medicamento.nombre_comercial : `Medicamento #${orden.medicamento_id}`}</p>
          </div>
          <EstadoBadge config={ESTADO_ORDEN[orden.estado]} />
        </div>

        <dl className="mt-6 grid gap-5 text-base sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-ink-soft">Cargada el</dt>
            <dd className="mt-1 font-semibold text-navy-800">{formatearFecha(orden.creado_en)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <UserCheck className="h-4 w-4" aria-hidden="true" /> Revisada por
            </dt>
            <dd className="mt-1 font-semibold text-navy-800">{orden.revisado_por || 'Pendiente de revisión'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-soft">Fórmula médica</dt>
            <dd>
              <a
                href={orden.archivo_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"
              >
                Ver archivo adjunto
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </dd>
          </div>
        </dl>

        {orden.estado === 'pendiente' && (
          <div className="mt-5">
            <Alert variant="warning">Tu orden está pendiente de revisión por un regente de tu IPS.</Alert>
          </div>
        )}
        {orden.estado === 'rechazada' && (
          <div className="mt-5">
            <Alert variant="error">Esta orden fue rechazada.</Alert>
          </div>
        )}
        {orden.estado === 'aprobada' && medicamento?.control_especial && (
          <div className="mt-5">
            <Alert variant="warning">
              Este medicamento es de control especial: solo se entrega por recogida presencial, no por domicilio.
            </Alert>
          </div>
        )}

        {orden.estado === 'aprobada' && !medicamento?.control_especial && (
          <div className="mt-5">
            <Button onClick={() => navigate('/domicilios/nuevo', { state: { orden, medicamento } })}>
              <Truck className="h-5 w-5" aria-hidden="true" />
              Pedir a domicilio
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
