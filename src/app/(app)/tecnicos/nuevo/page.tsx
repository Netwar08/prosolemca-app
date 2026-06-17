'use client'
// src/app/(app)/tecnicos/nuevo/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevoTecnicoPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre:   '',
    apellido: '',
    telefono: '',
    email:    '',
    rol:      'TECNICO_II' as 'TECNICO_I' | 'TECNICO_II',
  })

  // Credenciales de acceso
  const [crearAcceso,  setCrearAcceso]  = useState(true)
  const [emailAcceso,  setEmailAcceso]  = useState('')
  const [password,     setPassword]     = useState('')
  const [verPassword,  setVerPassword]  = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (crearAcceso && (!emailAcceso || password.length < 6)) {
      setError('El email y la contraseña (mín. 6 caracteres) son obligatorios para crear acceso.')
      setLoading(false)
      return
    }

    // 1. Crear técnico
    const { data: tecnico, error: errTec } = await (supabase as any)
      .from('tecnicos')
      .insert({
        nombre:   form.nombre,
        apellido: form.apellido,
        telefono: form.telefono || null,
        email:    emailAcceso || form.email || null,
        rol:      form.rol,
        activo:   true,
      })
      .select('id')
      .single()

    if (errTec || !tecnico) {
      setError(errTec?.message ?? 'Error al crear técnico')
      setLoading(false)
      return
    }

    // 2. Crear credenciales si se solicitó
    if (crearAcceso) {
      const res = await fetch('/api/tecnicos/credenciales', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnico_id: tecnico.id,
          email:      emailAcceso,
          password,
          nombre:     form.nombre,
          apellido:   form.apellido,
          rol:        form.rol,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(`Técnico creado pero error en credenciales: ${json.error}`)
        setLoading(false)
        return
      }
    }

    router.push('/tecnicos')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <a href="/tecnicos" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <h1 className="text-lg font-bold text-gray-900">Nuevo técnico</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Datos del técnico */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos personales</p>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rol *</p>
              <div className="grid grid-cols-2 gap-3">
                {(['TECNICO_I', 'TECNICO_II'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, rol: r }))}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.rol === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <p>{r === 'TECNICO_II' ? 'Técnico II' : 'Técnico I'}</p>
                    <p className="text-xs font-normal mt-0.5 text-gray-400">
                      {r === 'TECNICO_II' ? 'Senior / responsable' : 'Asistente'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <F label="Nombre *">
              <input name="nombre" value={form.nombre} onChange={handleChange} required
                placeholder="Ej: Ana Isabel" className={inp} />
            </F>
            <F label="Apellido *">
              <input name="apellido" value={form.apellido} onChange={handleChange} required
                placeholder="Ej: Bermúdez" className={inp} />
            </F>
            <F label="Teléfono">
              <input name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="0414-000-0000" className={inp} />
            </F>
          </div>

          {/* Acceso al sistema */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Acceso al sistema</p>
                <p className="text-xs text-gray-400">El técnico podrá iniciar sesión en la app</p>
              </div>
              <button type="button" onClick={() => setCrearAcceso(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${crearAcceso ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${crearAcceso ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {crearAcceso && (
              <div className="space-y-3 pt-1">
                <F label="Email de acceso *">
                  <input type="email" value={emailAcceso} onChange={e => setEmailAcceso(e.target.value)}
                    placeholder="tecnico@prosolemca.com" className={inp} required={crearAcceso} />
                </F>
                <F label="Contraseña *">
                  <div className="relative">
                    <input type={verPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres" className={inp} required={crearAcceso} />
                    <button type="button" onClick={() => setVerPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600">
                      {verPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </F>
                <p className="text-xs text-gray-400">
                  El técnico usará estas credenciales para iniciar sesión.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
            {loading ? 'Guardando...' : crearAcceso ? 'Crear técnico y acceso' : 'Crear técnico'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>
}
