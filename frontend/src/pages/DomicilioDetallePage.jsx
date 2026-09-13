import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { domiciliosApi } from '../api'
import { ApiError } from '../api/client'
import { ESTADO_DOMICILIO_COLOR, ESTADO_DOMICILIO_LABEL, formatearFecha } from '../lib/format'
import { Alert, Badge, Card, CenteredLoader } from '../components/ui'

export default function DomicilioDetallePage() {
  const { ipsId, domicilioId } = useParams()
  const [domicilio, setDomicilio] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setCargando(true)
    setError('')
    Promise.all([domiciliosApi.obtener(ipsId, domicilioId), domiciliosApi.historial(ipsId, domicilioId)])
      .then(([datosDomicilio, datosHistorial]) => {
        setDomicilio(datosDomicilio)
        setHistorial(datosHistorial)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el domicilio.'))
      .finally(() => setCargando(false))
  }, [ipsId, domicilioId])

  if (cargando) return <CenteredLoader label="Cargando domicilio…" />
  if (error) return <Alert variant="error">{error}</Alert>
  if (!domicilio) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/domicilios" className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver a mis domicilios
      </Link>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">Domicilio #{domicilio.id}</h1>
          <Badge color={ESTADO_DOMICILIO_COLOR[domicilio.estado]}>{ESTADO_DOMICILIO_LABEL[domicilio.estado]}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">Orden médica asociada #{domicilio.orden_id}</p>
        {domicilio.lat_actual != null && (
          <p className="mt-2 text-sm text-slate-600">
            Última posición conocida: {domicilio.lat_actual}, {domicilio.lng_actual}
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="font-semibold text-slate-900">Línea de tiempo</h2>
        <ol className="mt-4 flex flex-col gap-4 border-l-2 border-brand-200 pl-4">
          {historial.map((paso, indice) => (
            <li key={indice} className="relative">
              <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full bg-brand-500" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={ESTADO_DOMICILIO_COLOR[paso.estado]}>{ESTADO_DOMICILIO_LABEL[paso.estado]}</Badge>
                <span className="text-sm text-slate-500">{formatearFecha(paso.registrado_en)}</span>
              </div>
              {paso.lat_actual != null && (
                <p className="mt-1 text-xs text-slate-400">
                  Posición: {paso.lat_actual}, {paso.lng_actual}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
