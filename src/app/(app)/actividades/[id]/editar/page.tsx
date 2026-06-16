'use client'
// src/app/(app)/actividades/[id]/editar/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TIPOS_TRABAJO_LABELS } from '@/lib/constants/estados'
import type { Cliente, Tecnico, TipoTrabajo, RolUsuario } from '@/lib/types/database'

export default function EditarActividadPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [miRol,    setMiRol]    = useState<RolUsuario>('VENTAS')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [equiposCliente, setEquiposCliente] = useState<{id:string,nombre:string,tipo:string}[]>([])

  const [form, setForm] = useState({
    nombre_descripcion:    '',
    cliente_id:            '',
    equipo_id:             '',
    ubicacion:             '',
    tipo_trabajo:          '' as TipoTrabajo | '',
    tecnico_id:            '',
    fecha_inicio_estimada: '',
    fecha_fin_estimada:    '',
    tiempo_garantia_meses: '12',
    numero_cotizacion:     '',
    notas_internas:        '',
  })

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: act }, { data: perfil }, { data: cls }, { data: tecs }] = await Promise.all([
        (supabase as any).from('actividades').select('*').eq('id_obra', id).single(),
        (supabase as any).from('perfiles').select('rol').eq('id', user.id).single(),
        (supabase as any).from('clientes').select('id, nombre').eq('activo', true).order('nombre'),
        (supabase as any).from('tecnicos').select('*').eq('activo', true).order('nombre'),
      ])

      setMiRol(perfil?.rol ?? 'VENTAS')
      setClientes(cls ?? [])
      setTecnicos(tecs ?? [])

      if (act) {
        setForm({
          nombre_descripcion:    act.nombre_descripcion,
          cliente_id:            act.cliente_id,
          equipo_id:             (act as any).equipo_id ?? '',
          ubicacion:             act.ubicacion,
          tipo_trabajo:          act.tipo_trabajo,
          tecnico_id:            act.tecnico_id ?? '',
          fecha_inicio_estimada: act.fecha_inicio_estimada,
          fecha_fin_estimada:    act.fecha_fin_estimada,
          tiempo_garantia_meses: String(act.tiempo_garantia_meses),
          numero_cotizacion:     (act as any).numero_cotizacion ?? '',
          notas_internas:        act.notas_internas ?? '',
        })
        // Cargar equipos del cliente
        if (act.cliente_id) {
          const { data: eqs } = await (supabase as any).from('equipos')
            .select('id, nombre, tipo').eq('cliente_id', act.cliente_id).eq('activo', true)
          setEquiposCliente(eqs ?? [])
        }
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)

    // Estados que requieren técnico asignado
    const estadosConTecnico = ['ASIGNADA', 'EN_EJECUCION', 'EJECUTADA', 'SUPERVISADA', 'ENTREGADA_CLIENTE']

    // Obtener estado actual
    const { data: actActual } = await (supabase as any)
      .from('actividades').select('estado').eq('id_obra', id).single()

    // Si se quitó el técnico y el estado requiere uno → volver a VALIDADA
    const sinTecnico = !form.tecnico_id
    const estadoActual = actActual?.estado ?? ''
    const debeRetroceder = sinTecnico && estadosConTecnico.includes(estadoActual)

    const { error: err } = await (supabase as any).from('actividades').update({
      nombre_descripcion:    form.nombre_descripcion,
      cliente_id:            form.cliente_id,
      equipo_id:             form.equipo_id || null,
      ubicacion:             form.ubicacion,
      tipo_trabajo:          form.tipo_trabajo as TipoTrabajo,
      tecnico_id:            null,
      fecha_inicio_estimada: form.fecha_inicio_estimada,
      fecha_fin_estimada:    form.fecha_fin_estimada,
      tiempo_garantia_meses: parseInt(form.tiempo_garantia_meses),
      numero_cotizacion:     form.numero_cotizacion || null,
      notas_internas:        form.notas_internas || null,
      // Si se quitó el técnico en un estado avanzado → volver a VALIDADA
      ...(debeRetroceder ? { estado: 'VALIDADA' } : {}),
      // Si se asignó técnico y está en VALIDADA → avanzar a ASIGNADA
      ...(!sinTecnico && estadoActual === 'VALIDADA' ? { tecnico_id: form.tecnico_id, estado: 'ASIGNADA' } : {}),
      ...(!sinTecnico && estadoActual !== 'VALIDADA' ? { tecnico_id: form.tecnico_id } : {}),
    }).eq('id_obra', id)

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/actividades/${id}`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando...</div>

  // Solo admin puede editar
  if (miRol !== 'ADMIN' && miRol !== 'VALERIO') {
    return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Sin permisos para editar</div>
  }

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <a href={`/actividades/${id}`} className="text-gray-400 hover:text-gray-600 text-xl">←</a>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Editar actividad</h1>
          <p className="text-xs text-gray-400 font-mono">{id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <Seccion titulo="Información principal">
          <F label="Descripción *">
            <input name="nombre_descripcion" value={form.nombre_descripcion} onChange={handleChange} required className={inp} />
          </F>
          <F label="N° Cotización">
            <input name="numero_cotizacion" value={form.numero_cotizacion} onChange={handleChange}
              placeholder="COT-2026-0042" className={inp} />
          </F>
          <F label="Cliente *">
            <select name="cliente_id" value={form.cliente_id} onChange={async e => {
              handleChange(e)
              const { data } = await (supabase as any).from('equipos').select('id, nombre, tipo')
                .eq('cliente_id', e.target.value).eq('activo', true)
              setEquiposCliente(data ?? [])
              setForm(p => ({ ...p, cliente_id: e.target.value, equipo_id: '' }))
            }} className={inp}>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </F>
          {equiposCliente.length > 0 && (
            <F label="Equipo involucrado">
              <select name="equipo_id" value={form.equipo_id} onChange={handleChange} className={inp}>
                <option value="">Sin equipo específico</option>
                {equiposCliente.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.tipo})</option>)}
              </select>
            </F>
          )}
          <F label="Ubicación">
            <input name="ubicacion" value={form.ubicacion} onChange={handleChange} className={inp} />
          </F>
        </Seccion>

        <Seccion titulo="Tipo de trabajo">
          <div className="space-y-1">
            {(Object.entries(TIPOS_TRABAJO_LABELS) as [TipoTrabajo, string][]).map(([value, label]) => (
              <button key={value} type="button"
                onClick={() => setForm(p => ({ ...p, tipo_trabajo: value }))}
                className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  form.tipo_trabajo === value
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Técnico asignado">
          <div className="space-y-1">
            <button type="button" onClick={() => setForm(p => ({ ...p, tecnico_id: '' }))}
              className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                !form.tecnico_id ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
              Sin asignar
            </button>
            {tecnicos.map(t => (
              <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, tecnico_id: t.id }))}
                className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center justify-between ${
                  form.tecnico_id === t.id ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-700'}`}>
                <span>{t.nombre} {t.apellido}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.rol === 'TECNICO_II' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {t.rol === 'TECNICO_II' ? 'Téc. II' : 'Téc. I'}
                </span>
              </button>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Fechas y garantía">
          <div className="grid grid-cols-2 gap-3">
            <F label="Inicio *">
              <input name="fecha_inicio_estimada" type="date" value={form.fecha_inicio_estimada} onChange={handleChange} className={inp} />
            </F>
            <F label="Fin *">
              <input name="fecha_fin_estimada" type="date" value={form.fecha_fin_estimada} onChange={handleChange} className={inp} />
            </F>
          </div>
          <F label="Garantía (meses)">
            <input name="tiempo_garantia_meses" type="number" min="0" value={form.tiempo_garantia_meses} onChange={handleChange} className={inp} />
          </F>
        </Seccion>

        <Seccion titulo="Notas internas">
          <textarea name="notas_internas" value={form.notas_internas} onChange={handleChange} rows={3} className={inp} />
        </Seccion>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl text-sm">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{titulo}</p>
      {children}
    </div>
  )
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>
}
