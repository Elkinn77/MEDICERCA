import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { ApiError } from '../api/client'
import { Alert, Button, Card, Input } from '../components/ui'

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
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Verifica tu correo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa el código de 6 dígitos que enviamos a tu correo para activar tu cuenta.
        </p>

        {location.state?.codigoDemo && (
          <Alert variant="info">
            Modo demo: tu código es <strong>{location.state.codigoDemo}</strong>
          </Alert>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <Input label="Correo electrónico" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <Input
            label="Código de verificación"
            required
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

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
