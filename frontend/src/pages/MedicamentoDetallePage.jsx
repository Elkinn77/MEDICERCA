import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { disponibilidadApi, medicamentosApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { NIVEL_DISPONIBILIDAD_COLOR, NIVEL_DISPONIBILIDAD_LABEL } from '../lib/format'
import { Alert, Badge, Button, Card, CenteredLoader, EmptyState, Input } from '../components/ui'

function useGeolocalizacion() {
  const [ubicacion, setUbicacion] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  const solicitar = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización. Ingresa tu ubicación manualmente si es necesario.')
      return
    }
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude })
        setBuscando(false)
      },
      () => {
        setError('No pudimos acceder a tu ubicación. Puedes escribir tus coordenadas manualmente.')
        setBuscando(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return { ubicacion, setUbicacion, error, buscando, solicitar }
}

export default function MedicamentoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { autenticado } = useAuth()
  const [medicamento, setMedicamento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const { ubicacion, error: errorUbicacion, buscando, solicitar } = useGeolocalizacion()
  const [ciudad, setCiudad] = useState('Bogotá')
  const [resultados, setResultados] = useState(null)
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('')
  const [consultando, setConsultando] = useState(false)

  useEffect(() => {
    setCargando(true)
    medicamentosApi
      .obtener(id)
      .then(setMedicamento)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el medicamento.'))
      .finally(() => setCargando(false))
  }, [id])

  const consultarDisponibilidad = async (evento) => {
    evento.preventDefault()
    setErrorDisponibilidad('')
    if (!ubicacion) {
      setErrorDisponibilidad('Primero comparte tu ubicación o ingrésala manualmente.')
      return
    }
    setConsultando(true)
    try {
      const datos = await disponibilidadApi.consultar({
        medicamento_id: Number(id),
        lat_usuario: ubicacion.lat,
        lng_usuario: ubicacion.lng,
        ciudad_usuario: ciudad,
      })
      setResultados(datos)
    } catch (err) {
      setErrorDisponibilidad(err instanceof ApiError ? err.message : 'No se pudo consultar disponibilidad.')
    } finally {
      setConsultando(false)
    }
  }

  if (cargando) return <CenteredLoader label="Cargando medicamento…" />
  if (error) return <Alert variant="error">{error}</Alert>
  if (!medicamento) return null

  return (
    <div className="flex flex-col gap-6">
      <Link to="/catalogo" className="text-sm font-medium text-brand-700 hover:underline">
        ← Volver al catálogo
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{medicamento.nombre_comercial}</h1>
            <p className="text-sm text-slate-500">{medicamento.nombre_generico}</p>
          </div>
          <div className="flex gap-2">
            <Badge color={medicamento.condicion_venta === 'RX' ? 'yellow' : 'green'}>{medicamento.condicion_venta}</Badge>
            {medicamento.control_especial && <Badge color="red">Control especial</Badge>}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-400">Dosis</dt>
            <dd className="font-medium text-slate-800">{medicamento.dosis}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Presentación</dt>
            <dd className="font-medium text-slate-800">{medicamento.presentacion}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-400">Registro sanitario</dt>
            <dd className="font-medium text-slate-800">{medicamento.registro_sanitario}</dd>
          </div>
        </dl>

        {medicamento.condicion_venta === 'RX' && (
          <Alert variant="warning">
            Este medicamento requiere fórmula médica aprobada por tu IPS antes de poder pedirlo a domicilio.
            {medicamento.control_especial && ' Al ser de control especial, solo se entrega por recogida presencial.'}
          </Alert>
        )}

        {autenticado && !medicamento.control_especial && (
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/ordenes', { state: { medicamentoId: medicamento.id } })}
            >
              Cargar orden médica para este medicamento
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Consultar disponibilidad cercana</h2>
        <p className="mt-1 text-sm text-slate-500">
          Comparte tu ubicación para ver en qué puntos de venta hay inventario, ordenados por cercanía.
        </p>

        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={consultarDisponibilidad}>
          <div className="flex-1 min-w-[10rem]">
            <Input label="Tu ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
          </div>
          <Button type="button" variant="secondary" onClick={solicitar} loading={buscando}>
            {ubicacion ? 'Actualizar ubicación' : 'Usar mi ubicación'}
          </Button>
          <Button type="submit" loading={consultando}>
            Buscar disponibilidad
          </Button>
        </form>

        {ubicacion && (
          <p className="mt-2 text-xs text-slate-400">
            Ubicación: {ubicacion.lat.toFixed(4)}, {ubicacion.lng.toFixed(4)}
          </p>
        )}
        {errorUbicacion && <Alert variant="warning">{errorUbicacion}</Alert>}
        {errorDisponibilidad && <Alert variant="error">{errorDisponibilidad}</Alert>}

        {resultados && (
          <div className="mt-6">
            {resultados.length === 0 ? (
              <EmptyState title="Sin resultados" description="No encontramos inventario para este medicamento." />
            ) : (
              <ul className="flex flex-col gap-3">
                {resultados.map((resultado, indice) => (
                  <li
                    key={`${resultado.ips_id}-${resultado.punto_id}-${indice}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{resultado.punto_nombre}</p>
                      <p className="text-sm text-slate-500">
                        {resultado.ciudad} · {resultado.ips_nombre}
                      </p>
                      {resultado.fecha_reabastecimiento && (
                        <p className="text-xs text-slate-400">Reabastece: {resultado.fecha_reabastecimiento}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">Cantidad: {resultado.cantidad}</span>
                      <Badge color={NIVEL_DISPONIBILIDAD_COLOR[resultado.nivel] || 'slate'}>
                        {NIVEL_DISPONIBILIDAD_LABEL[resultado.nivel] || resultado.nivel}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
