import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-28 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-extrabold text-navy-800">Página no encontrada</h1>
      <p className="text-lg text-ink-soft">No encontramos la página que buscas.</p>
      <Link to="/">
        <Button>
          <Home className="h-5 w-5" aria-hidden="true" />
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
