'use client'
// src/components/layout/BottomNav.tsx
// Barra de navegación inferior para móvil

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ADMIN = [
  { href: '/dashboard',   label: 'Inicio',      icon: '🏠' },
  { href: '/clientes',    label: 'Clientes',    icon: '👥' },
  { href: '/tecnicos',    label: 'Técnicos',    icon: '🔧' },
  { href: '/actividades', label: 'Actividades', icon: '📋' },
]

const NAV_TECNICO = [
  { href: '/dashboard',   label: 'Mi tablero',  icon: '🏠' },
  { href: '/actividades', label: 'Actividades', icon: '📋' },
  { href: '/clientes',    label: 'Clientes',    icon: '👥' },
]

export default function BottomNav({ rol }: { rol?: string }) {
  const pathname = usePathname()
  const isTecnico = rol === 'TECNICO_I' || rol === 'TECNICO_II'
  const items = isTecnico ? NAV_TECNICO : NAV_ADMIN

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className={isTecnico ? 'grid grid-cols-3' : 'grid grid-cols-4'}>
        {items.map(item => {
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                activo ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-xs font-medium ${activo ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {activo && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
