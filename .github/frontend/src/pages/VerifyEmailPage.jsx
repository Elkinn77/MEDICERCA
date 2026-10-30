import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { authApi } from '../api'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input } from '../components/ui'
import DecorativeBackdrop from '../components/DecorativeBackdrop'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState(location.state?.correo || '')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await authApi.verificarRegistro({ correo, codigo })
      setExito(true)
      setTimeout(() => navigate('/login', { state: { correo } }), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo verificar el código.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-md py-6">
      <DecorativeBackdrop variant="auth" />
      <Card className="relative">
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy-800">Verifica tu correo</h1>
        <p className="mt-1 text-base text-ink-soft">
          Ingresa el código de 6 dígitos que enviamos a tu correo para activar tu cuenta.
        </p>

        {location.state?.codigoDemo && (
          <div className="mt-4">
            <Alert variant="info">
              Modo demo: tu código es <strong>{location.state.codigoDemo}</strong>
            </Alert>
          </div>
        )}

        <form className="mt-6 flex flex-col gap-5" onSubmit={enviar}>
          <Input label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <Input
            label="Código de verificación"
            required
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          {error && <Alert variant="error">{error}</Alert>}
          {exito && <Alert variant="success">¡Cuenta verificada! Redirigiendo a iniciar sesión…</Alert>}

          <Button type="submit" loading={enviando} className="w-full">
            Verificar cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-base text-ink-soft">
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
