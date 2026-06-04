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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('tecnicos').insert({
      nombre:   form.nombre,
      apellido: form.apellido,
      telefono: form.telefono || null,
      email:    form.email    || null,
      rol:      form.rol,
      activo:   true,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/tecnicos')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <a href="/tecnicos" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <h1 className="text-lg font-bold text-gray-900">Nuevo técnico</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">

            {/* Rol — selección visual primero */}
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
                    }`}
                  >
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
            <F label="Teléfono / Celular">
              <input name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="Ej: 0414-000-0000" className={inp} />
            </F>
            <F label="Email">
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="tecnico@empresa.com" className={inp} />
            </F>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
            {loading ? 'Guardando...' : 'Guardar técnico'}
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
