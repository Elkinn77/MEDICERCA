import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, Link2, Plus, Truck } from 'lucide-react'
import { medicamentosApi, ordenesApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ESTADO_ORDEN, formatearFecha } from '../lib/format'
import { Alert, Button, Card, CenteredLoader, EmptyState, EstadoBadge, Input, PageHeader, Select } from '../components/ui'

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
    <Card className="mb-6 !border-brand-100 !bg-brand-50">
      <h2 className="text-lg font-bold text-navy-800">Cargar nueva orden médica</h2>
      <p className="mt-1 text-base text-ink-soft">
        Sube el enlace a tu fórmula médica escaneada. Un regente de tu IPS la revisará.
      </p>
      <form className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={enviar}>
        <div className="min-w-56 flex-1">
          <Select label="Medicamento" required value={medicamentoId} onChange={(e) => setMedicamentoId(e.target.value)}>
            <option value="">Selecciona un medicamento…</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre_comercial} ({m.condicion_venta})
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-56 flex-1">
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
        <div className="mt-4">
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
        icon={FileText}
        title="Mis órdenes médicas"
        description="Fórmulas que has cargado y su estado de revisión."
        action={
          <Button onClick={() => setMostrarFormulario((v) => !v)}>
            <Plus className="h-5 w-5" aria-hidden="true" />
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
          icon={FileText}
          title="Todavía no has cargado ninguna orden"
          description="Cuando tengas una fórmula médica, cárgala aquí para poder pedir tu medicamento a domicilio."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {ordenes.map((orden) => {
            const medicamento = medicamentosPorId.get(orden.medicamento_id)
            return (
              <Card key={orden.id} className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-navy-800">
                      {medicamento ? medicamento.nombre_comercial : `Medicamento #${orden.medicamento_id}`}
                    </p>
                    <p className="text-sm text-ink-soft">Cargada el {formatearFecha(orden.creado_en)}</p>
                    {orden.revisado_por && <p className="text-sm text-ink-soft">Revisada por {orden.revisado_por}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <EstadoBadge config={ESTADO_ORDEN[orden.estado]} />
                  {orden.estado === 'aprobada' && !medicamento?.control_especial && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate('/domicilios/nuevo', {
                          state: { orden, medicamento },
                        })
                      }
                    >
                      <Truck className="h-5 w-5" aria-hidden="true" />
                      Pedir a domicilio
                    </Button>
                  )}
                  <Link
                    to={`/ordenes/${usuario.ips_id}/${orden.id}`}
                    className="flex items-center gap-1.5 text-base font-semibold text-brand-700 hover:underline"
                  >
                    <Link2 className="h-4 w-4" aria-hidden="true" />
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
