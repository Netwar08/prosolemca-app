'use client'
// src/components/layout/BottomNav.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ADMIN = [
  { href: '/dashboard',   label: 'Inicio',      icon: '⊞' },
  { href: '/clientes',    label: 'Clientes',    icon: '◈' },
  { href: '/tecnicos',    label: 'Técnicos',    icon: '◉' },
  { href: '/actividades', label: 'Actividades', icon: '▦' },
]

const NAV_TECNICO = [
  { href: '/dashboard',   label: 'Mi tablero',  icon: '⊞' },
  { href: '/actividades', label: 'Actividades', icon: '▦' },
  { href: '/clientes',    label: 'Clientes',    icon: '◈' },
]

export default function BottomNav({ rol }: { rol?: string }) {
  const pathname  = usePathname()
  const isTecnico = rol === 'TECNICO_I' || rol === 'TECNICO_II'
  const items     = isTecnico ? NAV_TECNICO : NAV_ADMIN

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: '#103352', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className={isTecnico ? 'grid grid-cols-3' : 'grid grid-cols-4'}>
        {items.map(item => {
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
            >
              {/* Indicador activo */}
              {activo && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#A0232A' }}
                />
              )}
              <span
                className="text-xl leading-none"
                style={{ color: activo ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
              >
                {item.icon}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: activo ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
