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

// Mini isotipo SVG
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,4 72,22 40,40 8,22" fill="#6b7280" />
      <polygon points="40,4 72,22 40,40 8,22" fill="url(#sg)" />
      <polygon points="8,22 40,40 40,76 8,58" fill="#0c2840" />
      <polygon points="40,40 72,22 72,58 40,76" fill="#A0232A" />
      <polygon points="40,40 72,22 72,58 40,76" fill="url(#sr)" opacity="0.5"/>
      <text x="51" y="56" fontSize="20" fontWeight="bold" fill="white" opacity="0.95"
        fontFamily="Arial,sans-serif" textAnchor="middle">P</text>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ca3af"/><stop offset="100%" stopColor="#4b5563"/>
        </linearGradient>
        <linearGradient id="sr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c0392b"/><stop offset="100%" stopColor="#7B1D22"/>
        </linearGradient>
      </defs>
    </svg>
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
            <p className="text-xs leading-tight" style={{ color: '#A0232A', fontWeight: 600 }}>
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
