'use client'
// src/app/(app)/tecnicos/[id]/editar/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditarTecnicoPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState<string | null>(null)
  const [tieneAcceso, setTieneAcceso] = useState(false)

  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    rol: 'TECNICO_II' as 'TECNICO_I' | 'TECNICO_II',
  })

  // Sección credenciales
  const [mostrarCreds, setMostrarCreds] = useState(false)
  const [emailAcceso,  setEmailAcceso]  = useState('')
  const [password,     setPassword]     = useState('')
  const [verPassword,  setVerPassword]  = useState(false)
  const [savingCreds,  setSavingCreds]  = useState(false)

  useEffect(() => {
    setLoading(true)
    ;(supabase as any).from('tecnicos').select('*').eq('id', id).single()
      .then(({ data }: any) => {
        if (data) {
          setForm({
            nombre:   data.nombre,
            apellido: data.apellido,
            telefono: data.telefono ?? '',
            email:    data.email    ?? '',
            rol:      data.rol as 'TECNICO_I' | 'TECNICO_II',
          })
          if (data.email) setEmailAcceso(data.email)
        }
        setLoading(false)
      })

    // Verificar si ya tiene cuenta de acceso
    ;(supabase as any).from('perfiles').select('id').eq('tecnico_id', id).maybeSingle()
      .then(({ data }: any) => setTieneAcceso(!!data))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: err } = await (supabase as any).from('tecnicos').update({
      nombre:   form.nombre,
      apellido: form.apellido,
      telefono: form.telefono || null,
      email:    form.email    || null,
      rol:      form.rol,
    }).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/tecnicos')
  }

  async function guardarCredenciales() {
    if (!emailAcceso || password.length < 6) {
      setError('Email y contraseña (mín. 6 caracteres) son obligatorios.')
      return
    }
    setSavingCreds(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/tecnicos/credenciales', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tecnico_id: id,
        email:      emailAcceso,
        password,
        nombre:     form.nombre,
        apellido:   form.apellido,
        rol:        form.rol,
      }),
    })
    const json = await res.json()
    setSavingCreds(false)

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Error al guardar credenciales')
    } else {
      setTieneAcceso(true)
      setPassword('')
      setMostrarCreds(false)
      setSuccess(json.accion === 'usuario_creado'
        ? '✓ Acceso creado correctamente. El técnico ya puede iniciar sesión.'
        : '✓ Contraseña actualizada correctamente.'
      )
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <a href="/tecnicos" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <h1 className="text-lg font-bold text-gray-900">Editar técnico</h1>
        </div>

        {/* Datos personales */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos personales</p>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Rol *</p>
              <div className="grid grid-cols-2 gap-3">
                {(['TECNICO_I', 'TECNICO_II'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, rol: r }))}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.rol === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                    }`}>
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
            <F label="Teléfono">
              <input name="telefono" value={form.telefono} onChange={handleChange} className={inp} />
            </F>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {/* Acceso al sistema */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Acceso al sistema</p>
              <p className="text-xs text-gray-400">
                {tieneAcceso ? '✓ Este técnico ya tiene cuenta activa' : 'Sin acceso al sistema aún'}
              </p>
            </div>
            {tieneAcceso
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Activo</span>
              : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Sin acceso</span>
            }
          </div>

          <button type="button"
            onClick={() => { setMostrarCreds(v => !v); setError(null); setSuccess(null) }}
            className="w-full text-sm text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            {mostrarCreds ? 'Cancelar' : tieneAcceso ? '🔑 Cambiar contraseña' : '+ Crear acceso al sistema'}
          </button>

          {mostrarCreds && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              {!tieneAcceso && (
                <F label="Email de acceso *">
                  <input type="email" value={emailAcceso} onChange={e => setEmailAcceso(e.target.value)}
                    placeholder="tecnico@prosolemca.com" className={inp} />
                </F>
              )}
              {tieneAcceso && emailAcceso && (
                <p className="text-xs text-gray-500 pt-1">
                  Cuenta: <strong>{emailAcceso || form.email}</strong>
                </p>
              )}
              <F label={tieneAcceso ? 'Nueva contraseña *' : 'Contraseña *'}>
                <div className="relative">
                  <input type={verPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" className={inp} />
                  <button type="button" onClick={() => setVerPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600">
                    {verPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </F>
              <button type="button" onClick={guardarCredenciales} disabled={savingCreds}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-xl text-sm">
                {savingCreds ? 'Guardando...' : tieneAcceso ? 'Actualizar contraseña' : 'Crear acceso'}
              </button>
            </div>
          )}
        </div>

        {error   && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2">{success}</div>}
      </div>
    </div>
  )
}

const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>
}
