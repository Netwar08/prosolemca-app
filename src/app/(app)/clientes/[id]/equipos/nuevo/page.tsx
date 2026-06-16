'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TIPO_EQUIPO_LABELS, type TipoEquipo } from '@/lib/types/database'

const TIPOS: TipoEquipo[] = ['BOMBA', 'FILTRO', 'TANQUE', 'PULMON']
const ICONOS: Record<TipoEquipo, string> = { BOMBA: '⚙️', FILTRO: '🔵', TANQUE: '🪣', PULMON: '🫧' }

export default function NuevoEquipoPage() {
  const { id: clienteId } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '', tipo: '' as TipoEquipo | '', marca: '', modelo: '',
    numero_serie: '', fecha_ultimo_mantenimiento: '', notas: '',
    voltaje_trabajo: '', amperaje_nominal: '', amperaje_real: '', presion_trabajo: '',
  })

  const esBomba  = form.tipo === 'BOMBA'
  const esPulmon = form.tipo === 'PULMON'

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tipo) { setError('Selecciona el tipo de equipo'); return }
    setLoading(true); setError(null)
    try {
      let foto_url: string | null = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        const fileName = `${clienteId}_${Date.now()}.${ext}`
        await supabase.storage.from('equipos-fotos').upload(fileName, fotoFile)
        foto_url = supabase.storage.from('equipos-fotos').getPublicUrl(fileName).data.publicUrl
      }
      const { error: err } = await (supabase as any).from('equipos').insert({
        cliente_id: clienteId, nombre: form.nombre, tipo: form.tipo as TipoEquipo,
        marca: form.marca, modelo: form.modelo || null, numero_serie: form.numero_serie || null,
        fecha_ultimo_mantenimiento: form.fecha_ultimo_mantenimiento || null,
        notas: form.notas || null, foto_url, activo: true,
        voltaje_trabajo:  esBomba && form.voltaje_trabajo  ? parseFloat(form.voltaje_trabajo)  : null,
        amperaje_nominal: esBomba && form.amperaje_nominal ? parseFloat(form.amperaje_nominal) : null,
        amperaje_real:    esBomba && form.amperaje_real    ? parseFloat(form.amperaje_real)    : null,
        presion_trabajo:  (esBomba || esPulmon) && form.presion_trabajo ? parseFloat(form.presion_trabajo) : null,
      })
      if (err) throw err
      router.push(`/clientes/${clienteId}`)
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <a href={`/clientes/${clienteId}`} className="text-gray-400 hover:text-gray-600 text-xl">←</a>
        <h1 className="text-lg font-bold text-gray-900">Nuevo equipo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tipo de equipo *</p>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(tipo => (
              <button key={tipo} type="button" onClick={() => setForm(p => ({ ...p, tipo }))}
                className={`py-3 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                  form.tipo === tipo ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                <span className="text-2xl">{ICONOS[tipo]}</span>
                {TIPO_EQUIPO_LABELS[tipo]}
              </button>
            ))}
          </div>
        </div>

        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Información</p>
          {[
            { name: 'nombre',  label: 'Nombre *', required: true,  placeholder: 'Ej: Bomba principal piso 1' },
            { name: 'marca',   label: 'Marca *',  required: true,  placeholder: 'Ej: Pedrollo, Grundfos' },
            { name: 'modelo',  label: 'Modelo',   required: false, placeholder: 'Ej: CPm 132' },
            { name: 'numero_serie', label: 'N° de serie', required: false, placeholder: 'Número de serie' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                required={f.required} placeholder={f.placeholder} className={inp} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha último mantenimiento</label>
            <input name="fecha_ultimo_mantenimiento" type="date"
              value={form.fecha_ultimo_mantenimiento} onChange={handleChange} className={inp} />
          </div>
        </div>

        {/* Datos técnicos BOMBA */}
        {esBomba && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Datos técnicos — Bomba</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'voltaje_trabajo',   label: 'Voltaje (V)',          placeholder: '220' },
                { name: 'amperaje_nominal',  label: 'Amperaje nominal (A)', placeholder: '8.5' },
                { name: 'amperaje_real',     label: 'Amperaje real (A)',    placeholder: '8.2' },
                { name: 'presion_trabajo',   label: 'Presión (PSI)',        placeholder: '60'  },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input name={f.name} type="number" step="0.01"
                    value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} className={inp} />
                </div>
              ))}
            </div>
          </div>
        )}

        {esPulmon && !esBomba && (
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Datos técnicos — Pulmón</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presión de trabajo (PSI)</label>
              <input name="presion_trabajo" type="number" step="0.01"
                value={form.presion_trabajo} onChange={handleChange} placeholder="60" className={inp} />
            </div>
          </div>
        )}

        {/* Foto */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Foto del equipo</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
              {fotoPreview ? <img src={fotoPreview} className="w-full h-full object-cover" /> : <span className="text-2xl">📷</span>}
            </div>
            <label className="text-sm text-blue-600 cursor-pointer hover:underline">
              {fotoPreview ? 'Cambiar' : 'Agregar foto'}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)) }}} />
            </label>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas técnicas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={3}
            placeholder="Observaciones del equipo..." className={inp} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl text-sm">
          {loading ? 'Guardando...' : 'Guardar equipo'}
        </button>
      </form>
    </div>
  )
}
