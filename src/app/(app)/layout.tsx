// src/app/(app)/layout.tsx
// Layout principal de la app — incluye navegación lateral (desktop) y barra inferior (móvil)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  const nombreUsuario = perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario'
  const rol = perfil?.rol ?? 'VENTAS'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — solo visible en desktop (md+) */}
      <Sidebar nombreUsuario={nombreUsuario} rol={rol} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — solo visible en móvil */}
      <BottomNav />
    </div>
  )
}
