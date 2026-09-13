import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, IdCard, KeyRound, Mail, ShieldCheck } from 'lucide-react'
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
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-2xl font-extrabold text-white shadow-[0_10px_20px_-10px_rgba(18,59,93,0.5)]">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-xl font-bold text-navy-800">{usuario.nombre}</p>
            <p className="flex items-center gap-1.5 text-base text-ink-soft">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {usuario.correo}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-5 text-base sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <IdCard className="h-4 w-4" aria-hidden="true" /> Cédula
            </dt>
            <dd className="mt-1 font-semibold text-navy-800">{usuario.cedula}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-soft">Rol</dt>
            <dd className="mt-1">
              <Badge color={usuario.rol === 'regente' ? 'brand' : 'slate'}>{usuario.rol}</Badge>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <Building2 className="h-4 w-4" aria-hidden="true" /> IPS afiliada
            </dt>
            <dd className="mt-1 font-semibold text-navy-800">
              {ips ? ips.nombre_ficticio : usuario.ips_id ? `IPS #${usuario.ips_id}` : 'Sin afiliación'}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Correo verificado
            </dt>
            <dd className="mt-1">
              <Badge color={usuario.verificado ? 'green' : 'yellow'}>{usuario.verificado ? 'Sí' : 'No'}</Badge>
            </dd>
          </div>
        </dl>

        <p className="mt-7 flex items-center gap-2 text-base text-ink-soft">
          <KeyRound className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          ¿Necesitas cambiar tu contraseña?{' '}
          <Link to="/recuperar-clave" className="font-semibold text-brand-700 hover:underline">
            Recupérala aquí
          </Link>
        </p>
      </Card>
    </div>
  )
}
