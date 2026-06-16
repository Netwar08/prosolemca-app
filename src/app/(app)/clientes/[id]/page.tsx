'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Cliente, Equipo, Actividad } from '@/lib/types/database'
import { ROL_CONTACTO_LABELS, TIPO_EQUIPO_LABELS } from '@/lib/types/database'
import { ESTADOS } from '@/lib/constants/estados'

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [tab, setTab] = useState<'equipos' | 'actividades'>('equipos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [{ data: c }, { data: e }, { data: a }] = await Promise.all([
        (supabase as any).from('clientes').select('*').eq('id', id).single(),
        (supabase as any).from('equipos').select('*').eq('cliente_id', id).eq('activo', true).order('nombre'),
        (supabase as any).from('actividades').select('*').eq('cliente_id', id).order('created_at', { ascending: false }).limit(20),
      ])
      setCliente(c); setEquipos(e ?? []); setActividades(a ?? [])
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando...</div>
  if (!cliente) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cliente no encontrado</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/clientes" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
        <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{cliente.nombre}</h1>
        <a href={`/clientes/${id}/editar`} className="text-sm text-blue-600 hover:underline">Editar</a>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
            {cliente.foto_url
              ? <img src={cliente.foto_url} alt={cliente.nombre} className="w-full h-full object-cover" />
              : <span className="text-blue-600 font-bold text-2xl">{cliente.nombre.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg">{cliente.nombre}</p>
            {cliente.rif && <p className="text-sm text-gray-500">RIF: {cliente.rif}</p>}
            {cliente.direccion && <p className="text-sm text-gray-500 mt-1">{cliente.direccion}</p>}
            {cliente.location_maps && (
              <a href={cliente.location_maps} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block">📍 Ver en Google Maps</a>
            )}
          </div>
        </div>
        {(cliente.persona_contacto || cliente.celular || cliente.email) && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {cliente.persona_contacto && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">👤</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{cliente.persona_contacto}</p>
                  {cliente.rol_contacto && <p className="text-xs text-gray-500">{ROL_CONTACTO_LABELS[cliente.rol_contacto]}</p>}
                </div>
              </div>
            )}
            {cliente.celular && (
              <a href={`tel:${cliente.celular}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                <span>📱</span>{cliente.celular}
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                <span>✉️</span>{cliente.email}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['equipos', 'actividades'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            {t === 'equipos' ? `Equipos (${equipos.length})` : `Actividades (${actividades.length})`}
          </button>
        ))}
      </div>

      {/* Tab Equipos */}
      {tab === 'equipos' && (
        <div className="space-y-3">
          <a href={`/clientes/${id}/equipos/nuevo`}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Agregar equipo
          </a>
          {equipos.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No hay equipos registrados</p>}
          {equipos.map(eq => (
            <div key={eq.id} className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                {eq.foto_url
                  ? <img src={eq.foto_url} alt={eq.nombre} className="w-full h-full object-cover" />
                  : { BOMBA: '⚙️', FILTRO: '🔵', TANQUE: '🪣', PULMON: '🫧' }[eq.tipo]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{eq.nombre}</p>
                <p className="text-sm text-gray-500">{TIPO_EQUIPO_LABELS[eq.tipo]} · {eq.marca}</p>
                {eq.fecha_ultimo_mantenimiento && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Último mant.: {new Date(eq.fecha_ultimo_mantenimiento).toLocaleDateString('es-VE')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Actividades */}
      {tab === 'actividades' && (
        <div className="space-y-3">
          <a href={`/actividades/nueva?cliente=${id}`}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Nueva actividad para este cliente
          </a>
          {actividades.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No hay actividades</p>}
          {actividades.map(act => (
            <a key={act.id_obra} href={`/actividades/${act.id_obra}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{act.id_obra}</p>
                <p className="text-xs text-gray-500 truncate max-w-xs">{act.nombre_descripcion}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADOS[act.estado]?.color}`}>
                {ESTADOS[act.estado]?.label}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
