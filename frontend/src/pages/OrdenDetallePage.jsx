import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { medicamentosApi, ordenesApi } from '../api'
import { ApiError } from '../api/client'
import { ESTADO_ORDEN_COLOR, ESTADO_ORDEN_LABEL, formatearFecha } from '../lib/format'
import { Alert, Badge, Button, Card, CenteredLoader } from '../components/ui'

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
      <Link to="/ordenes" className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver a mis órdenes
      </Link>

      <Card className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Orden médica #{orden.id}</h1>
            <p className="text-sm text-slate-500">{medicamento ? medicamento.nombre_comercial : `Medicamento #${orden.medicamento_id}`}</p>
          </div>
          <Badge color={ESTADO_ORDEN_COLOR[orden.estado]}>{ESTADO_ORDEN_LABEL[orden.estado]}</Badge>
        </div>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Cargada el</dt>
            <dd className="font-medium text-slate-800">{formatearFecha(orden.creado_en)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Revisada por</dt>
            <dd className="font-medium text-slate-800">{orden.revisado_por || 'Pendiente de revisión'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-400">Fórmula médica</dt>
            <dd>
              <a
                href={orden.archivo_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-700 hover:underline"
              >
                Ver archivo adjunto
              </a>
            </dd>
          </div>
        </dl>

        {orden.estado === 'pendiente' && (
          <Alert variant="warning">Tu orden está pendiente de revisión por un regente de tu IPS.</Alert>
        )}
        {orden.estado === 'rechazada' && <Alert variant="error">Esta orden fue rechazada.</Alert>}
        {orden.estado === 'aprobada' && medicamento?.control_especial && (
          <Alert variant="warning">
            Este medicamento es de control especial: solo se entrega por recogida presencial, no por domicilio.
          </Alert>
        )}

        {orden.estado === 'aprobada' && !medicamento?.control_especial && (
          <div className="mt-4">
            <Button onClick={() => navigate('/domicilios/nuevo', { state: { orden, medicamento } })}>
              Pedir a domicilio
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
