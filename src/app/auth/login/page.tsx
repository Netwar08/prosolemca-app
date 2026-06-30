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
          {/* Isotipo simplificado — cubo con P */}
          <div className="inline-flex mb-5">
            <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
              {/* Cara superior (gris) */}
              <polygon points="40,4 72,22 40,40 8,22" fill="#6b7280" />
              <polygon points="40,4 72,22 40,40 8,22" fill="url(#topGrad)" />
              {/* Cara izquierda (navy) */}
              <polygon points="8,22 40,40 40,76 8,58" fill="#103352" />
              {/* Cara derecha (roja) */}
              <polygon points="40,40 72,22 72,58 40,76" fill="#A0232A" />
              {/* Cara derecha gradiente */}
              <polygon points="40,40 72,22 72,58 40,76" fill="url(#rightGrad)" opacity="0.6"/>
              {/* Letra P en cara derecha */}
              <text x="51" y="56" fontSize="22" fontWeight="bold" fill="white" opacity="0.9"
                fontFamily="Arial, sans-serif" textAnchor="middle">P</text>
              {/* Bordes */}
              <polygon points="40,4 72,22 40,40 8,22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              <line x1="40" y1="40" x2="40" y2="76" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              <line x1="8" y1="22" x2="8" y2="58" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              <line x1="72" y1="22" x2="72" y2="58" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              <defs>
                <linearGradient id="topGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#9ca3af"/>
                  <stop offset="100%" stopColor="#374151"/>
                </linearGradient>
                <linearGradient id="rightGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c0392b"/>
                  <stop offset="100%" stopColor="#7B1D22"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

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
