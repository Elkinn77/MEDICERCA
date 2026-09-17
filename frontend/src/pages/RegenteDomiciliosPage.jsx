import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { domiciliosApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ESTADO_DOMICILIO_COLOR, ESTADO_DOMICILIO_LABEL } from '../lib/format'
import { Alert, Badge, Button, Card, CenteredLoader, EmptyState, PageHeader, Select } from '../components/ui'

const ESTADOS = ['confirmado', 'en_alistamiento', 'en_camino', 'entregado']

function FilaDomicilio({ domicilio, ipsId, onActualizado }) {
  const [nuevoEstado, setNuevoEstado] = useState(domicilio.estado)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const actualizar = async () => {
    setError('')
    setEnviando(true)
    try {
      const payload = { estado: nuevoEstado }
      if (lat !== '') payload.lat_actual = Number(lat)
      if (lng !== '') payload.lng_actual = Number(lng)
      const actualizado = await domiciliosApi.actualizarEstado(ipsId, domicilio.id, payload)
      onActualizado(actualizado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/domicilios/${ipsId}/${domicilio.id}`} className="font-medium text-slate-900 hover:underline">
            Domicilio #{domicilio.id}
          </Link>
          <p className="text-sm text-slate-500">Orden médica #{domicilio.orden_id}</p>
        </div>
        <Badge color={ESTADO_DOMICILIO_COLOR[domicilio.estado]}>{ESTADO_DOMICILIO_LABEL[domicilio.estado]}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem]">
          <Select label="Nuevo estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_DOMICILIO_LABEL[estado]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Lat (opcional)"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div className="w-28">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Lng (opcional)"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <Button loading={enviando} onClick={actualizar}>
          Actualizar
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </Card>
  )
}

export default function RegenteDomiciliosPage() {
  const { usuario } = useAuth()
  const [domicilios, setDomicilios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    domiciliosApi
      .activos()
      .then(setDomicilios)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los domicilios activos.'))
      .finally(() => setCargando(false))
  }, [])

  const manejarActualizacion = (domicilioActualizado) => {
    setDomicilios((prev) =>
      domicilioActualizado.estado === 'entregado'
        ? prev.filter((d) => d.id !== domicilioActualizado.id)
        : prev.map((d) => (d.id === domicilioActualizado.id ? domicilioActualizado : d)),
    )
  }

  return (
    <div>
      <PageHeader title="Domicilios activos" description="Pedidos sin entregar en tu IPS. Actualiza su estado logístico aquí." />

      {error && <Alert variant="error">{error}</Alert>}

      {cargando ? (
        <CenteredLoader label="Cargando domicilios activos…" />
      ) : domicilios.length === 0 ? (
        <EmptyState title="No hay domicilios activos" description="Todos los pedidos de tu IPS ya fueron entregados." />
      ) : (
        <div className="flex flex-col gap-3">
          {domicilios.map((domicilio) => (
            <FilaDomicilio
              key={domicilio.id}
              domicilio={domicilio}
              ipsId={usuario.ips_id}
              onActualizado={manejarActualizacion}
            />
          ))}
        </div>
      )}
    </div>
  )
}
