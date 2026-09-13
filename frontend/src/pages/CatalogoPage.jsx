import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { medicamentosApi } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert, Badge, Button, Card, CenteredLoader, EmptyState, Input, PageHeader, Select } from '../components/ui'

const CONDICIONES = ['OTC', 'RX']

function FormularioNuevoMedicamento({ onCreado }) {
  const [form, setForm] = useState({
    nombre_generico: '',
    nombre_comercial: '',
    dosis: '',
    presentacion: '',
    condicion_venta: 'OTC',
    control_especial: false,
    registro_sanitario: '',
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const actualizar = (campo) => (evento) => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const creado = await medicamentosApi.crear(form)
      onCreado(creado)
      setForm({
        nombre_generico: '',
        nombre_comercial: '',
        dosis: '',
        presentacion: '',
        condicion_venta: 'OTC',
        control_especial: false,
        registro_sanitario: '',
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el medicamento.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="mb-6 !bg-brand-50">
      <h2 className="font-semibold text-slate-900">Agregar medicamento al catálogo</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={enviar}>
        <Input label="Nombre genérico" required value={form.nombre_generico} onChange={actualizar('nombre_generico')} />
        <Input label="Nombre comercial" required value={form.nombre_comercial} onChange={actualizar('nombre_comercial')} />
        <Input label="Dosis" required value={form.dosis} onChange={actualizar('dosis')} />
        <Input label="Presentación" required value={form.presentacion} onChange={actualizar('presentacion')} />
        <Select label="Condición de venta" value={form.condicion_venta} onChange={actualizar('condicion_venta')}>
          {CONDICIONES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input label="Registro sanitario (INVIMA)" required value={form.registro_sanitario} onChange={actualizar('registro_sanitario')} />
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={form.control_especial} onChange={actualizar('control_especial')} />
          Medicamento de control especial (solo recogida presencial)
        </label>
        {error && (
          <div className="sm:col-span-2">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" loading={enviando}>
            Guardar medicamento
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function CatalogoPage() {
  const { esRegente } = useAuth()
  const [medicamentos, setMedicamentos] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const pagina = await medicamentosApi.listar({ skip: 0, limit: 200 })
      setMedicamentos(pagina.items)
      setTotal(pagina.total)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return medicamentos
    return medicamentos.filter(
      (m) => m.nombre_generico.toLowerCase().includes(termino) || m.nombre_comercial.toLowerCase().includes(termino),
    )
  }, [medicamentos, busqueda])

  return (
    <div>
      <PageHeader
        title="Catálogo de medicamentos"
        description={`${total} medicamento(s) registrados en el catálogo central.`}
        action={
          esRegente && (
            <Button onClick={() => setMostrarFormulario((v) => !v)}>
              {mostrarFormulario ? 'Cerrar formulario' : 'Agregar medicamento'}
            </Button>
          )
        }
      />

      {esRegente && mostrarFormulario && (
        <FormularioNuevoMedicamento
          onCreado={(nuevo) => {
            setMedicamentos((prev) => [...prev, nuevo])
            setTotal((t) => t + 1)
            setMostrarFormulario(false)
          }}
        />
      )}

      <div className="mb-6 max-w-sm">
        <Input placeholder="Buscar por nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {cargando ? (
        <CenteredLoader label="Cargando catálogo…" />
      ) : filtrados.length === 0 ? (
        <EmptyState title="No hay medicamentos que coincidan" description="Prueba con otro término de búsqueda." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((medicamento) => (
            <Link key={medicamento.id} to={`/catalogo/${medicamento.id}`}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{medicamento.nombre_comercial}</h3>
                  <Badge color={medicamento.condicion_venta === 'RX' ? 'yellow' : 'green'}>
                    {medicamento.condicion_venta}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{medicamento.nombre_generico}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {medicamento.dosis} · {medicamento.presentacion}
                </p>
                {medicamento.control_especial && (
                  <div className="mt-3">
                    <Badge color="red">Control especial</Badge>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
