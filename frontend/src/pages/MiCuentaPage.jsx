import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ipsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { Badge, Card, PageHeader } from '../components/ui'

export default function MiCuentaPage() {
  const { usuario } = useAuth()
  const [ips, setIps] = useState(null)

  useEffect(() => {
    if (!usuario?.ips_id) return
    ipsApi
      .listar({ limit: 200 })
      .then((pagina) => setIps(pagina.items.find((i) => i.id === usuario.ips_id) || null))
      .catch(() => setIps(null))
  }, [usuario])

  if (!usuario) return null

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Mi cuenta" description="Información de tu perfil en MediCerca." />

      <Card>
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{usuario.nombre}</p>
            <p className="text-sm text-slate-500">{usuario.correo}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Cédula</dt>
            <dd className="font-medium text-slate-800">{usuario.cedula}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Rol</dt>
            <dd>
              <Badge color={usuario.rol === 'regente' ? 'blue' : 'slate'}>{usuario.rol}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">IPS afiliada</dt>
            <dd className="font-medium text-slate-800">{ips ? ips.nombre_ficticio : usuario.ips_id ? `IPS #${usuario.ips_id}` : 'Sin afiliación'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Correo verificado</dt>
            <dd>
              <Badge color={usuario.verificado ? 'green' : 'yellow'}>{usuario.verificado ? 'Sí' : 'No'}</Badge>
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-slate-500">
          ¿Necesitas cambiar tu contraseña?{' '}
          <Link to="/recuperar-clave" className="font-medium text-brand-700 hover:underline">
            Recupérala aquí
          </Link>
          .
        </p>
      </Card>
    </div>
  )
}
