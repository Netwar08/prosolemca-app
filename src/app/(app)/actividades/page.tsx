'use client'
// src/app/(app)/actividades/page.tsx — Lista de actividades con filtros

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ESTADOS, TIPOS_TRABAJO_LABELS } from '@/lib/constants/estados'
import type { EstadoActividad } from '@/lib/types/database'

type Fila = {
  id_obra: string
  nombre_descripcion: string
  cliente_nombre: string
  tecnico_nombre: string | null
  tipo_trabajo: string
  estado: EstadoActividad
  fecha_inicio_estimada: string
  fecha_fin_estimada: string
  dias_retraso: number
}

const FILTROS_ESTADO: { label: string; estados: EstadoActividad[] | 'TODAS' }[] = [
  { label: 'Todas',        estados: 'TODAS' },
  { label: 'Pendientes',   estados: ['CREADA', 'VALIDADA', 'CAMBIOS_SOLICITADOS'] },
  { label: 'En campo',     estados: ['ASIGNADA', 'EN_EJECUCION'] },
  { label: 'Por cerrar',   estados: ['EJECUTADA', 'SUPERVISADA', 'ENTREGADA_CLIENTE'] },
  { label: 'Retrabajos',   estados: ['RETRABAJO'] },
  { label: 'Cerradas',     estados: ['CERRADA', 'FINALIZADA'] },
]

export default function ActividadesPage() {
  const [filas, setFilas]       = useState<Fila[]>([])
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState<number>(0)
  const [busqueda, setBusqueda] = useState('')
  const supabase = createClient()

  useEffect(() => {
    ;(supabase as any)
      .from('actividades_dashboard')
      .select('id_obra, nombre_descripcion, cliente_nombre, tecnico_nombre, tipo_trabajo, estado, fecha_inicio_estimada, fecha_fin_estimada, dias_retraso')
      .order('created_at', { ascending: false })
      .then(({ data }: any) => { setFilas(data ?? []); setLoading(false) })
  }, [])

  const filtradas = filas.filter(f => {
    const grupo = FILTROS_ESTADO[filtro]
    const pasaEstado = grupo.estados === 'TODAS' || grupo.estados.includes(f.estado)
    const pasaBusqueda = !busqueda ||
      f.id_obra.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    return pasaEstado && pasaBusqueda
  })

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Actividades</h1>
        <a href="/actividades/nueva"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nueva
        </a>
      </div>

      {/* Búsqueda */}
      <input type="search" placeholder="Buscar por ID o cliente..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS_ESTADO.map((f, i) => (
          <button key={i} onClick={() => setFiltro(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtro === i
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading && <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>}

      {!loading && filtradas.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No hay actividades</p>
          {filtro === 0 && !busqueda && (
            <a href="/actividades/nueva" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Crear primera actividad →
            </a>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtradas.map(f => (
          <a key={f.id_obra} href={`/actividades/${f.id_obra}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{f.id_obra}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADOS[f.estado]?.color}`}>
                    {ESTADOS[f.estado]?.label}
                  </span>
                  {f.dias_retraso > 0 && (
                    <span className="text-xs text-red-500 font-medium">+{f.dias_retraso}d retraso</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5 truncate">{f.nombre_descripcion}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">👥 {f.cliente_nombre}</span>
                  {f.tecnico_nombre && (
                    <span className="text-xs text-gray-400">🔧 {f.tecnico_nombre}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    📅 {new Date(f.fecha_inicio_estimada).toLocaleDateString('es-VE')} →{' '}
                    {new Date(f.fecha_fin_estimada).toLocaleDateString('es-VE')}
                  </span>
                </div>
              </div>
              <span className="text-gray-300 text-lg shrink-0">›</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
