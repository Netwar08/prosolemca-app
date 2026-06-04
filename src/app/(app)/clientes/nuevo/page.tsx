'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROL_CONTACTO_LABELS, type RolContacto } from '@/lib/types/database'

export default function NuevoClientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '', rif: '', direccion: '', email: '', telefono: '',
    celular: '', location_maps: '', persona_contacto: '',
    rol_contacto: '' as RolContacto | '', notas: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      let foto_url: string | null = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('clientes-fotos').upload(fileName, fotoFile)
        if (uploadError) throw new Error('Error al subir la foto')
        foto_url = supabase.storage.from('clientes-fotos').getPublicUrl(fileName).data.publicUrl
      }
      const { data, error: insertError } = await supabase.from('clientes').insert({
        nombre: form.nombre, rif: form.rif || null, direccion: form.direccion || null,
        email: form.email || null, telefono: form.telefono || null, celular: form.celular || null,
        location_maps: form.location_maps || null, persona_contacto: form.persona_contacto || null,
        rol_contacto: (form.rol_contacto as RolContacto) || null,
        notas: form.notas || null, foto_url, activo: true,
      }).select().single()
      if (insertError) throw insertError
      router.push(`/clientes/${data.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
      setLoading(false)
    }
  }

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <a href="/clientes" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
        <h1 className="text-lg font-bold text-gray-900">Nuevo cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
            {fotoPreview
              ? <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              : <span className="text-3xl text-gray-300">📷</span>}
          </div>
          <label className="text-sm text-blue-600 cursor-pointer hover:underline">
            {fotoPreview ? 'Cambiar foto' : 'Agregar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
          </label>
        </div>

        {/* Datos del cliente */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos del cliente</p>
          {[
            { name: 'nombre',        label: 'Nombre *',                required: true,  placeholder: 'Ej: Residencias El Parque' },
            { name: 'rif',           label: 'RIF / Cédula',            required: false, placeholder: 'Ej: J-12345678-9' },
            { name: 'direccion',     label: 'Dirección',               required: false, placeholder: 'Av. Principal, Torre X' },
            { name: 'location_maps', label: 'Ubicación (Google Maps)', required: false, placeholder: 'Pega el link de Google Maps' },
            { name: 'email',         label: 'Email',                   required: false, placeholder: 'cliente@email.com', type: 'email' },
            { name: 'telefono',      label: 'Teléfono fijo',           required: false, placeholder: '0212-000-0000' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                required={f.required} type={f.type ?? 'text'} placeholder={f.placeholder} className={inp} />
            </div>
          ))}
        </div>

        {/* Persona de contacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Persona de contacto</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto</label>
            <input name="persona_contacto" value={form.persona_contacto} onChange={handleChange}
              placeholder="Ej: Juan Pérez" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select name="rol_contacto" value={form.rol_contacto} onChange={handleChange} className={inp}>
              <option value="">Seleccionar rol...</option>
              {(Object.entries(ROL_CONTACTO_LABELS) as [RolContacto, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
            <input name="celular" value={form.celular} onChange={handleChange}
              placeholder="0414-000-0000" className={inp} />
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={3}
            placeholder="Observaciones adicionales..." className={inp} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
          {loading ? 'Guardando...' : 'Guardar cliente →'}
        </button>
      </form>
    </div>
  )
}
