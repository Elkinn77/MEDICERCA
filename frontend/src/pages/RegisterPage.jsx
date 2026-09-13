import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, ipsApi } from '../api'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input, Select } from '../components/ui'

const FORM_INICIAL = { nombre: '', cedula: '', correo: '', password: '', ips_id: '', eps_id: '' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(FORM_INICIAL)
  const [ipsDisponibles, setIpsDisponibles] = useState([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    ipsApi
      .listar({ limit: 200 })
      .then((pagina) => setIpsDisponibles(pagina.items))
      .catch(() => setIpsDisponibles([]))
  }, [])

  const actualizarCampo = (campo) => (evento) => setForm((prev) => ({ ...prev, [campo]: evento.target.value }))

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const payload = {
        nombre: form.nombre,
        cedula: form.cedula,
        correo: form.correo,
        password: form.password,
        ips_id: form.ips_id ? Number(form.ips_id) : null,
        eps_id: form.eps_id ? Number(form.eps_id) : null,
      }
      const respuesta = await authApi.registrar(payload)
      navigate('/verificar-correo', { state: { correo: form.correo, codigoDemo: respuesta.codigo_demo } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar el registro.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">
          El registro público solo crea cuentas de paciente. Te enviaremos un código de verificación.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <Input label="Nombre completo" required value={form.nombre} onChange={actualizarCampo('nombre')} />
          <Input label="Cédula" required value={form.cedula} onChange={actualizarCampo('cedula')} />
          <Input
            label="Correo electrónico"
            type="email"
            required
            value={form.correo}
            onChange={actualizarCampo('correo')}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={actualizarCampo('password')}
          />
          <p className="-mt-3 text-xs text-slate-400">
            Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.
          </p>

          <Select
            label="IPS a la que perteneces"
            required
            value={form.ips_id}
            onChange={actualizarCampo('ips_id')}
          >
            <option value="">Selecciona tu IPS…</option>
            {ipsDisponibles.map((ips) => (
              <option key={ips.id} value={ips.id}>
                {ips.nombre_ficticio}
              </option>
            ))}
          </Select>

          <Input
            label="EPS (opcional, id numérico)"
            type="number"
            value={form.eps_id}
            onChange={actualizarCampo('eps_id')}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" loading={enviando} className="mt-2 w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
