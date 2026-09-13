import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [correo, setCorreo] = useState(location.state?.correo || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(correo, password)
      navigate(location.state?.from || '/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <LogIn className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy-800">Inicia sesión</h1>
        <p className="mt-1 text-base text-ink-soft">Accede con tu correo y contraseña.</p>

        <form className="mt-6 flex flex-col gap-5" onSubmit={enviar}>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" loading={enviando} className="mt-1 w-full">
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-base text-ink-soft">
          <Link to="/recuperar-clave" className="font-semibold text-brand-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <span>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-brand-700 hover:underline">
              Regístrate
            </Link>
          </span>
        </div>
      </Card>
    </div>
  )
}
