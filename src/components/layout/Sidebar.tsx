'use client'
// src/components/layout/Sidebar.tsx
// Menú lateral para desktop (md+)

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS_ADMIN = [
  { href: '/dashboard',   label: 'Dashboard',    icon: '🏠', descripcion: 'Resumen de actividades' },
  { href: '/clientes',    label: 'Clientes',      icon: '👥', descripcion: 'Clientes y equipos' },
  { href: '/tecnicos',    label: 'Técnicos',      icon: '🔧', descripcion: 'Equipo técnico' },
  { href: '/actividades', label: 'Actividades',   icon: '📋', descripcion: 'Gestión de obras' },
  { href: '/retrabajos',  label: 'Retrabajos',    icon: '⚠️', descripcion: 'Garantías y retrabajos' },
]

const NAV_ITEMS_TECNICO = [
  { href: '/dashboard',   label: 'Mi tablero',   icon: '🏠', descripcion: 'Mis actividades' },
  { href: '/actividades', label: 'Actividades',   icon: '📋', descripcion: 'Mis obras asignadas' },
  { href: '/clientes',    label: 'Clientes',      icon: '👥', descripcion: 'Clientes' },
]

interface Props {
  nombreUsuario: string
  rol: string
}

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', VALERIO: 'Supervisor', VENTAS: 'Ventas',
  ATC: 'ATC', TECNICO_II: 'Técnico II', TECNICO_I: 'Técnico I',
}

const ES_TECNICO = (rol: string) => rol === 'TECNICO_I' || rol === 'TECNICO_II'

export default function Sidebar({ nombreUsuario, rol }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = ES_TECNICO(rol) ? NAV_ITEMS_TECNICO : NAV_ITEMS_ADMIN

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Prosolemca</p>
            <p className="text-xs text-gray-400">{ES_TECNICO(rol) ? 'Portal técnico' : 'Gestión técnica'}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activo
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <div>
                <p className={`text-sm font-medium leading-tight ${activo ? 'text-blue-700' : ''}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 leading-tight">{item.descripcion}</p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Usuario + Cerrar sesión */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-sm">
              {nombreUsuario.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{nombreUsuario}</p>
            <p className="text-xs text-gray-400">{ROL_LABELS[rol] ?? rol}</p>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  )
}
