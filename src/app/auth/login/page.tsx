'use client'
// src/app/auth/login/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #103352 0%, #0c2840 60%, #0a1f30 100%)' }}
    >
      {/* Panel central */}
      <div className="w-full max-w-sm">

        {/* Logo + nombre */}
        <div className="text-center mb-8 select-none">
          {/* Isotipo — cubo con canal P */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/isotipo.svg" width={88} height={88} alt="Prosolemca" className="mb-5" />

          <h1
            className="text-white text-4xl tracking-widest mb-1"
            style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", sans-serif)', letterSpacing: '0.15em' }}
          >
            PROSOLEMCA
          </h1>
          <p className="text-sm font-semibold" style={{ color: '#A0232A' }}>
            EMPRESAS PROSOLEMCA
          </p>
          <p className="text-xs text-gray-400 mt-1">Gestión de Actividades Técnicas</p>
        </div>

        {/* Tarjeta de acceso */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Barra superior de color */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #A0232A, #103352)' }} />

          <div className="p-6">
            <p className="text-sm font-semibold text-gray-700 mb-5 text-center">Acceso al sistema</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                  placeholder="usuario@prosolemca.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#A0232A' } as any}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 2px #A0232A'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50
                             focus:outline-none transition-all"
                  onFocus={e => e.target.style.boxShadow = '0 0 0 2px #A0232A'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>

              {error && (
                <div className="text-sm text-center py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150 mt-2"
                style={{
                  background: loading ? '#c0392b88' : 'linear-gradient(135deg, #A0232A, #7B1D22)',
                  boxShadow: '0 4px 14px rgba(160,35,42,0.35)',
                }}
              >
                {loading ? 'Verificando...' : 'Ingresar al sistema'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          ¿Problemas para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  )
}
