import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { authApi } from '../api'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input } from '../components/ui'
import DecorativeBackdrop from '../components/DecorativeBackdrop'

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
    <div className="relative mx-auto max-w-md py-6">
      <DecorativeBackdrop variant="auth" />
      <Card className="relative">
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy-800">Recuperar contraseña</h1>
        <p className="mt-1 text-base text-ink-soft">
          {paso === 1
            ? 'Ingresa tu correo para recibir un código de verificación.'
            : 'Ingresa el código recibido y tu nueva contraseña.'}
        </p>

        {mensaje && paso === 2 && (
          <div className="mt-4">
            <Alert variant="info">{mensaje}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {paso === 1 ? (
          <form className="mt-6 flex flex-col gap-5" onSubmit={solicitarCodigo}>
            <Input label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <Button type="submit" loading={enviando} className="w-full">
              Enviar código
            </Button>
          </form>
        ) : (
          <form className="mt-6 flex flex-col gap-5" onSubmit={confirmarCambio}>
            <Input label="Código de verificación" required maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <Input
              label="Nueva contraseña"
              type="password"
              required
              minLength={8}
              hint="Mínimo 8 caracteres, con una mayúscula, una minúscula y un número."
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <Button type="submit" loading={enviando} className="w-full">
              Cambiar contraseña
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-base text-ink-soft">
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
