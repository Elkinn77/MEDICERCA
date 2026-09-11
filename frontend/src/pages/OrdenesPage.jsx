import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { medicamentosApi, ordenesApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ESTADO_ORDEN_COLOR, ESTADO_ORDEN_LABEL, formatearFecha } from '../lib/format'
import { Alert, Badge, Button, Card, CenteredLoader, EmptyState, Input, PageHeader, Select } from '../components/ui'

function FormularioNuevaOrden({ usuario, medicamentos, medicamentoIdInicial, onCreada }) {
  const [medicamentoId, setMedicamentoId] = useState(medicamentoIdInicial ? String(medicamentoIdInicial) : '')
  const [archivoUrl, setArchivoUrl] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    if (!usuario.ips_id) {
      setError('Tu cuenta no tiene una IPS afiliada, así que no puedes cargar órdenes médicas.')
      return
    }
    setEnviando(true)
    try {
      const orden = await ordenesApi.crear({
        ips_id: usuario.ips_id,
        archivo_url: archivoUrl,
        medicamento_id: Number(medicamentoId),
      })
      onCreada(orden)
      setArchivoUrl('')
      setMedicamentoId('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la orden médica.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="mb-6 !bg-brand-50">
      <h2 className="font-semibold text-slate-900">Cargar nueva orden médica</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sube el enlace a tu fórmula médica escaneada. Un regente de tu IPS la revisará.
      </p>
      <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap" onSubmit={enviar}>
        <div className="min-w-[14rem] flex-1">
          <Select label="Medicamento" required value={medicamentoId} onChange={(e) => setMedicamentoId(e.target.value)}>
            <option value="">Selecciona un medicamento…</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre_comercial} ({m.condicion_venta})
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[14rem] flex-1">
          <Input
            label="Enlace a la fórmula (URL)"
            type="url"
            required
            placeholder="https://…"
            value={archivoUrl}
            onChange={(e) => setArchivoUrl(e.target.value)}
          />
        </div>
        <Button type="submit" loading={enviando}>
          Cargar orden
        </Button>
      </form>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </Card>
  )
}

export default function OrdenesPage() {
  const { usuario } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [medicamentos, setMedicamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(Boolean(location.state?.medicamentoId))

  const medicamentosPorId = useMemo(() => new Map(medicamentos.map((m) => [m.id, m])), [medicamentos])

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [misOrdenes, pagina] = await Promise.all([ordenesApi.misOrdenes(), medicamentosApi.listar({ limit: 200 })])
      setOrdenes(misOrdenes)
      setMedicamentos(pagina.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar tus órdenes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <div>
      <PageHeader
        title="Mis órdenes médicas"
        description="Fórmulas que has cargado y su estado de revisión."
        action={
          <Button onClick={() => setMostrarFormulario((v) => !v)}>
            {mostrarFormulario ? 'Cerrar formulario' : 'Cargar orden'}
          </Button>
        }
      />

      {mostrarFormulario && (
        <FormularioNuevaOrden
          usuario={usuario}
          medicamentos={medicamentos}
          medicamentoIdInicial={location.state?.medicamentoId}
          onCreada={(nueva) => {
            setOrdenes((prev) => [nueva, ...prev])
            setMostrarFormulario(false)
          }}
        />
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {cargando ? (
        <CenteredLoader label="Cargando tus órdenes…" />
      ) : ordenes.length === 0 ? (
        <EmptyState
          title="Todavía no has cargado ninguna orden"
          description="Cuando tengas una fórmula médica, cárgala aquí para poder pedir tu medicamento a domicilio."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ordenes.map((orden) => {
            const medicamento = medicamentosPorId.get(orden.medicamento_id)
            return (
              <Card key={orden.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {medicamento ? medicamento.nombre_comercial : `Medicamento #${orden.medicamento_id}`}
                  </p>
                  <p className="text-sm text-slate-500">Cargada el {formatearFecha(orden.creado_en)}</p>
                  {orden.revisado_por && <p className="text-xs text-slate-400">Revisada por {orden.revisado_por}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={ESTADO_ORDEN_COLOR[orden.estado]}>{ESTADO_ORDEN_LABEL[orden.estado]}</Badge>
                  {orden.estado === 'aprobada' && !medicamento?.control_especial && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate('/domicilios/nuevo', {
                          state: { orden, medicamento },
                        })
                      }
                    >
                      Pedir a domicilio
                    </Button>
                  )}
                  <Link
                    to={`/ordenes/${usuario.ips_id}/${orden.id}`}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    Ver detalle
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
