import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function Navbar() {
  const { usuario, autenticado, esRegente, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarSesion = async () => {
    await logout()
    setMenuAbierto(false)
    navigate('/')
  }

  const enlacesPaciente = [
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/ordenes', label: 'Mis órdenes' },
    { to: '/domicilios', label: 'Mis domicilios' },
    { to: '/historia-clinica', label: 'Historia clínica' },
  ]

  const enlacesRegente = [
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/regente/ordenes', label: 'Órdenes por aprobar' },
    { to: '/regente/domicilios', label: 'Domicilios activos' },
  ]

  const enlaces = autenticado ? (esRegente ? enlacesRegente : enlacesPaciente) : [{ to: '/catalogo', label: 'Catálogo' }]

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">M</span>
            MediCerca
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {enlaces.map((enlace) => (
              <NavLink key={enlace.to} to={enlace.to} className={linkClass}>
                {enlace.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {autenticado ? (
            <>
              <NavLink to="/mi-cuenta" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {usuario.nombre?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span>
                  {usuario.nombre}
                  {esRegente && <span className="ml-1 text-xs text-brand-600">(regente)</span>}
                </span>
              </NavLink>
              <button
                onClick={cerrarSesion}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/registro"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>

        <button
          className="rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {enlaces.map((enlace) => (
              <NavLink key={enlace.to} to={enlace.to} className={linkClass} onClick={() => setMenuAbierto(false)}>
                {enlace.label}
              </NavLink>
            ))}
            {autenticado ? (
              <>
                <NavLink to="/mi-cuenta" className={linkClass} onClick={() => setMenuAbierto(false)}>
                  Mi cuenta
                </NavLink>
                <button onClick={cerrarSesion} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600">
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setMenuAbierto(false)}>
                  Iniciar sesión
                </NavLink>
                <NavLink to="/registro" className={linkClass} onClick={() => setMenuAbierto(false)}>
                  Crear cuenta
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
