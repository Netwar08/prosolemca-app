'use client'
// src/components/layout/Sidebar.tsx

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS_ADMIN = [
  { href: '/dashboard',   label: 'Dashboard',    icon: '⊞', descripcion: 'Resumen de actividades' },
  { href: '/clientes',    label: 'Clientes',     icon: '◈', descripcion: 'Clientes y equipos' },
  { href: '/tecnicos',    label: 'Técnicos',     icon: '◉', descripcion: 'Equipo técnico' },
  { href: '/actividades', label: 'Actividades',  icon: '▦', descripcion: 'Gestión de obras' },
  { href: '/retrabajos',  label: 'Retrabajos',   icon: '⚑', descripcion: 'Garantías y retrabajos' },
]

const NAV_ITEMS_TECNICO = [
  { href: '/dashboard',   label: 'Mi tablero',  icon: '⊞', descripcion: 'Mis actividades' },
  { href: '/actividades', label: 'Actividades',  icon: '▦', descripcion: 'Mis obras asignadas' },
  { href: '/clientes',    label: 'Clientes',     icon: '◈', descripcion: 'Clientes' },
]

interface Props { nombreUsuario: string; rol: string }

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', VALERIO: 'Supervisor', VENTAS: 'Ventas',
  ATC: 'Atención al Cliente', TECNICO_II: 'Técnico II', TECNICO_I: 'Técnico I',
}

const ES_TECNICO = (rol: string) => rol === 'TECNICO_I' || rol === 'TECNICO_II'

// Mini isotipo
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/isotipo.svg" width={size} height={size} alt="Prosolemca" />
  )
}

export default function Sidebar({ nombreUsuario, rol }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = ES_TECNICO(rol) ? NAV_ITEMS_TECNICO : NAV_ITEMS_ADMIN

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0"
      style={{ background: '#103352' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <p
              className="text-white text-lg leading-tight tracking-widest"
              style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", sans-serif)' }}
            >
              PROSOLEMCA
            </p>
            <p className="text-xs leading-tight font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {ES_TECNICO(rol) ? 'Portal Técnico' : 'Gestión Técnica'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(item => {
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group"
              style={{
                background: activo ? 'rgba(160,35,42,0.18)' : 'transparent',
                borderLeft: activo ? '3px solid #A0232A' : '3px solid transparent',
              }}
            >
              {/* Hover state */}
              <span
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
              <span
                className="text-base leading-none"
                style={{ color: activo ? '#A0232A' : 'rgba(255,255,255,0.5)' }}
              >
                {item.icon}
              </span>
              <div className="relative">
                <p className="text-sm font-semibold leading-tight"
                  style={{ color: activo ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
                  {item.label}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {item.descripcion}
                </p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Divisor */}
      <div className="mx-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Usuario + Cerrar sesión */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ background: '#A0232A', color: 'white' }}
          >
            {nombreUsuario.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{nombreUsuario}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{ROL_LABELS[rol] ?? rol}</p>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="w-full text-left text-xs px-1 py-1 transition-colors rounded"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#A0232A')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  )
}
