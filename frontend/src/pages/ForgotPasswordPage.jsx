import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input } from '../components/ui'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const solicitarCodigo = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const respuesta = await authApi.solicitarCambioPassword({ correo })
      setMensaje(respuesta.codigo_demo ? `Modo demo: tu código es ${respuesta.codigo_demo}` : respuesta.mensaje)
      setPaso(2)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  const confirmarCambio = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await authApi.confirmarCambioPassword({ correo, codigo, nueva_password: nuevaPassword })
      navigate('/login', { state: { correo } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          {paso === 1
            ? 'Ingresa tu correo para recibir un código de verificación.'
            : 'Ingresa el código recibido y tu nueva contraseña.'}
        </p>

        {mensaje && paso === 2 && <Alert variant="info">{mensaje}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        {paso === 1 ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={solicitarCodigo}>
            <Input label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <Button type="submit" loading={enviando} className="w-full">
              Enviar código
            </Button>
          </form>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={confirmarCambio}>
            <Input label="Código de verificación" required maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <Input
              label="Nueva contraseña"
              type="password"
              required
              minLength={8}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <Button type="submit" loading={enviando} className="w-full">
              Cambiar contraseña
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
