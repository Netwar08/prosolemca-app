'use client'
// src/app/(app)/tecnicos/[id]/editar/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tecnico } from '@/lib/types/database'

export default function EditarTecnicoPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    rol: 'TECNICO_II' as 'TECNICO_I' | 'TECNICO_II',
  })

  useEffect(() => {
    setLoading(true)
    supabase.from('tecnicos').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) setForm({
          nombre:   data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? '',
          email:    data.email    ?? '',
          rol:      data.rol as 'TECNICO_I' | 'TECNICO_II',
        })
        setLoading(false)
      })
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('tecnicos').update({
      nombre:   form.nombre,
      apellido: form.apellido,
      telefono: form.telefono || null,
      email:    form.email    || null,
      rol:      form.rol,
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/tecnicos')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <a href="/tecnicos" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <h1 className="text-lg font-bold text-gray-900">Editar técnico</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rol *</p>
              <div className="grid grid-cols-2 gap-3">
                {(['TECNICO_I', 'TECNICO_II'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, rol: r }))}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.rol === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {r === 'TECNICO_II' ? 'Técnico II' : 'Técnico I'}
                  </button>
                ))}
              </div>
            </div>
            <F label="Nombre *">
              <input name="nombre" value={form.nombre} onChange={handleChange} required className={inp} />
            </F>
            <F label="Apellido *">
              <input name="apellido" value={form.apellido} onChange={handleChange} required className={inp} />
            </F>
            <F label="Teléfono / Celular">
              <input name="telefono" value={form.telefono} onChange={handleChange} className={inp} />
            </F>
            <F label="Email">
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inp} />
            </F>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
            {saving ? 'Guardando...' : 'Guardar cambios'}
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
