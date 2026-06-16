// src/app/(app)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ESTADOS } from '@/lib/constants/estados'
import type { EstadoActividad } from '@/lib/types/database'

const GRUPOS_ESTADO = [
  { label: 'Pendientes de validación', estados: ['CREADA'] as EstadoActividad[] },
  { label: 'Por asignar',              estados: ['VALIDADA'] as EstadoActividad[] },
  { label: 'En campo',                 estados: ['ASIGNADA', 'EN_EJECUCION'] as EstadoActividad[] },
  { label: 'Por supervisar',           estados: ['EJECUTADA'] as EstadoActividad[] },
  { label: 'Por cerrar',               estados: ['SUPERVISADA', 'ENTREGADA_CLIENTE'] as EstadoActividad[] },
  { label: 'Retrabajos activos',       estados: ['RETRABAJO'] as EstadoActividad[] },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: actividades } = await (supabase as any)
    .from('actividades_dashboard')
    .select('id_obra, estado, nombre_descripcion, cliente_nombre, tecnico_nombre, dias_retraso, tiene_retrabajo_activo')
    .order('created_at', { ascending: false })

  const conteo = (actividades ?? []).reduce((acc, a) => {
    acc[a.estado] = (acc[a.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalActivas = (actividades ?? []).filter(a => !['FINALIZADA', 'RECHAZADA'].includes(a.estado)).length
  const conRetraso   = (actividades ?? []).filter(a => a.dias_retraso > 0 && !['CERRADA', 'FINALIZADA'].includes(a.estado)).length

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <a href="/actividades/nueva"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nueva actividad
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Activas</p>
          <p className="text-3xl font-bold text-gray-900">{totalActivas}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Con retraso</p>
          <p className="text-3xl font-bold text-red-600">{conRetraso}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Retrabajos</p>
          <p className="text-3xl font-bold text-rose-600">{conteo['RETRABAJO'] ?? 0}</p>
        </div>
      </div>

      {/* Grupos de actividades */}
      {GRUPOS_ESTADO.map(grupo => {
        const items = (actividades ?? []).filter(a => grupo.estados.includes(a.estado as EstadoActividad))
        if (items.length === 0) return null
        return (
          <section key={grupo.label}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">{grupo.label}</h2>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.slice(0, 5).map(a => (
                <a key={a.id_obra} href={`/actividades/${a.id_obra}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.id_obra}</p>
                    <p className="text-xs text-gray-500 truncate">{a.cliente_nombre} · {a.tecnico_nombre ?? 'Sin técnico'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {(a.dias_retraso ?? 0) > 0 && <span className="text-xs text-red-600 font-medium">+{a.dias_retraso}d</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADOS[a.estado as EstadoActividad]?.color}`}>
                      {ESTADOS[a.estado as EstadoActividad]?.label}
                    </span>
                  </div>
                </a>
              ))}
              {items.length > 5 && (
                <a href="/actividades" className="block text-center text-xs text-blue-600 py-2 hover:underline">
                  Ver {items.length - 5} más →
                </a>
              )}
            </div>
          </section>
        )
      })}

      {totalActivas === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600">No hay actividades activas</p>
          <p className="text-sm mt-1">Comienza registrando un <a href="/clientes" className="text-blue-600 hover:underline">cliente</a>.</p>
        </div>
      )}
    </div>
  )
}
