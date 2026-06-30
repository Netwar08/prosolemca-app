// src/app/(app)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ESTADOS } from '@/lib/constants/estados'
import type { EstadoActividad } from '@/lib/types/database'

const ESTADOS_FINALIZADAS: EstadoActividad[] = ['SUPERVISADA', 'ENTREGADA_CLIENTE', 'CERRADA', 'FINALIZADA']

const GRUPOS_ESTADO = [
  { label: 'Pendientes de validación', estados: ['CREADA'] as EstadoActividad[] },
  { label: 'Por asignar',              estados: ['VALIDADA'] as EstadoActividad[] },
  { label: 'En campo',                 estados: ['ASIGNADA', 'EN_EJECUCION'] as EstadoActividad[] },
  { label: 'Por supervisar',           estados: ['EJECUTADA'] as EstadoActividad[] },
  { label: 'Retrabajos activos',       estados: ['RETRABAJO'] as EstadoActividad[] },
  { label: 'Finalizadas',              estados: ESTADOS_FINALIZADAS },
]

const GRUPOS_TECNICO = [
  { label: 'Por iniciar',   icon: '📌', estados: ['ASIGNADA'] as EstadoActividad[] },
  { label: 'En ejecución',  icon: '⚙️',  estados: ['EN_EJECUCION'] as EstadoActividad[] },
  { label: 'Completadas',   icon: '✅',  estados: ['EJECUTADA'] as EstadoActividad[] },
  { label: 'Finalizadas',   icon: '🏁',  estados: ESTADOS_FINALIZADAS },
]

// Componente de tarjeta KPI reutilizable
function KpiCard({ href, label, value, color = 'text-gray-900' }: {
  href: string; label: string; value: number; color?: string
}) {
  return (
    <a href={href}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer block">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </a>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await (supabase as any)
    .from('perfiles')
    .select('nombre, apellido, rol, tecnico_id')
    .eq('id', user.id)
    .single()

  const rol: string = perfil?.rol ?? 'VENTAS'
  const isTecnico = rol === 'TECNICO_I' || rol === 'TECNICO_II'
  const tecnicoId: string | null = (perfil as any)?.tecnico_id ?? null

  const hoyStr = new Date().toISOString().slice(0, 10)

  // ── VISTA TÉCNICO ──────────────────────────────────────────────────────────
  if (isTecnico) {
    let todasMisActividades: any[] = []
    if (tecnicoId) {
      const { data } = await (supabase as any)
        .from('actividades')
        .select(`
          id_obra, estado, nombre_descripcion,
          fecha_inicio_estimada, fecha_fin_estimada,
          clientes(nombre)
        `)
        .or(`tecnico_id.eq.${tecnicoId},tecnico_i_id.eq.${tecnicoId}`)
        .neq('estado', 'RECHAZADA')
        .order('fecha_fin_estimada', { ascending: true })
      todasMisActividades = data ?? []
    }

    const finalizadas   = todasMisActividades.filter((a: any) => ESTADOS_FINALIZADAS.includes(a.estado))
    const activas       = todasMisActividades.filter((a: any) => !ESTADOS_FINALIZADAS.includes(a.estado))
    const conRetraso    = activas.filter((a: any) => (a.fecha_fin_estimada?.slice(0,10) ?? '') < hoyStr)
    const paraHoy       = todasMisActividades.filter((a: any) =>
      (a.fecha_inicio_estimada?.slice(0,10) ?? '') <= hoyStr &&
      (a.fecha_fin_estimada?.slice(0,10) ?? '') >= hoyStr &&
      !ESTADOS_FINALIZADAS.includes(a.estado)
    )
    const retrabajos    = todasMisActividades.filter((a: any) => a.estado === 'RETRABAJO')

    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Saludo */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {perfil?.nombre} 👷
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Estas son tus actividades asignadas</p>
        </div>

        {/* KPIs — 5 tarjetas clicables */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard href="/actividades?filtro=activas"   label="Mis activas"           value={activas.length}      color="text-gray-900" />
          <KpiCard href="/actividades?filtro=retraso"   label="Con retraso"           value={conRetraso.length}   color="text-red-600" />
          <KpiCard href="/actividades?filtro=hoy"       label="Asignaciones para hoy" value={paraHoy.length}      color="text-blue-600" />
          <KpiCard href="/actividades?filtro=retrabajo" label="Retrabajos"            value={retrabajos.length}   color="text-rose-600" />
          <a href="/actividades?filtro=finalizadas"
            className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer flex items-center justify-between">
            <p className="text-xs text-gray-500">Finalizadas</p>
            <p className="text-3xl font-bold text-green-600">{finalizadas.length}</p>
          </a>
        </div>

        {/* Actividades con retraso (alerta) */}
        {conRetraso.length > 0 && (
          <section>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-2">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                ⚠️ Con retraso ({conRetraso.length})
              </p>
              <div className="space-y-2 mt-2">
                {conRetraso.map((a: any) => (
                  <TarjetaActividad key={a.id_obra} actividad={a} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Grupos de actividades del técnico */}
        {GRUPOS_TECNICO.map(grupo => {
          const items = todasMisActividades.filter((a: any) =>
            grupo.estados.includes(a.estado as EstadoActividad) &&
            !conRetraso.find((r: any) => r.id_obra === a.id_obra)
          )
          if (items.length === 0) return null
          return (
            <section key={grupo.label}>
              <div className="flex items-center gap-2 mb-2">
                <span>{grupo.icon}</span>
                <h2 className="text-sm font-semibold text-gray-700">{grupo.label}</h2>
                <span className="text-xs text-gray-400 ml-auto">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a: any) => (
                  <TarjetaActividad key={a.id_obra} actividad={a} />
                ))}
              </div>
            </section>
          )
        })}

        {todasMisActividades.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-600">Sin actividades asignadas</p>
            <p className="text-sm mt-1">Tu supervisor te asignará actividades próximamente.</p>
          </div>
        )}
      </div>
    )
  }

  // ── VISTA ADMIN / SUPERVISOR ───────────────────────────────────────────────
  const { data: actividades } = await (supabase as any)
    .from('actividades_dashboard')
    .select('id_obra, estado, nombre_descripcion, cliente_nombre, tecnico_nombre, dias_retraso, tiene_retrabajo_activo, fecha_inicio_estimada, fecha_fin_estimada')
    .order('created_at', { ascending: false })

  const conteo = (actividades ?? []).reduce((acc: Record<string, number>, a: any) => {
    acc[a.estado] = (acc[a.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalActivas    = (actividades ?? []).filter((a: any) => !['FINALIZADA', 'RECHAZADA', ...ESTADOS_FINALIZADAS].includes(a.estado)).length
  const conRetrasoAdmin = (actividades ?? []).filter((a: any) => a.dias_retraso > 0 && !ESTADOS_FINALIZADAS.includes(a.estado)).length
  const paraHoy         = (actividades ?? []).filter((a: any) => {
    const ini = a.fecha_inicio_estimada?.slice(0, 10)
    const fin = a.fecha_fin_estimada?.slice(0, 10)
    return ini <= hoyStr && fin >= hoyStr && !ESTADOS_FINALIZADAS.includes(a.estado) && a.estado !== 'RECHAZADA'
  }).length
  const finalizadasAdmin = (actividades ?? []).filter((a: any) => ESTADOS_FINALIZADAS.includes(a.estado)).length

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <a href="/actividades/nueva"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nueva actividad
        </a>
      </div>

      {/* KPIs — 5 tarjetas */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard href="/actividades?filtro=activas"   label="Activas"               value={totalActivas}       color="text-gray-900" />
        <KpiCard href="/actividades?filtro=retraso"   label="Con retraso"           value={conRetrasoAdmin}    color="text-red-600" />
        <KpiCard href="/actividades?filtro=hoy"       label="Asignaciones para hoy" value={paraHoy}            color="text-blue-600" />
        <KpiCard href="/actividades?filtro=retrabajo" label="Retrabajos"            value={conteo['RETRABAJO'] ?? 0} color="text-rose-600" />
        <a href="/actividades?filtro=finalizadas"
          className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer flex items-center justify-between">
          <p className="text-xs text-gray-500">Finalizadas</p>
          <p className="text-3xl font-bold text-green-600">{finalizadasAdmin}</p>
        </a>
      </div>

      {/* Grupos de actividades */}
      {GRUPOS_ESTADO.map(grupo => {
        const items = (actividades ?? []).filter((a: any) => grupo.estados.includes(a.estado as EstadoActividad))
        if (items.length === 0) return null
        return (
          <section key={grupo.label}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">{grupo.label}</h2>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.slice(0, 5).map((a: any) => (
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

      {totalActivas === 0 && finalizadasAdmin === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600">No hay actividades activas</p>
          <p className="text-sm mt-1">Comienza registrando un <a href="/clientes" className="text-blue-600 hover:underline">cliente</a>.</p>
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta para el técnico ──────────────────────────────────────────────────
function TarjetaActividad({ actividad }: { actividad: any }) {
  const estado = ESTADOS[actividad.estado as EstadoActividad]
  const clienteNombre = actividad.clientes?.nombre ?? '—'
  const fechaFin = actividad.fecha_fin_estimada
    ? new Date(actividad.fecha_fin_estimada).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
    : null

  return (
    <a href={`/actividades/${actividad.id_obra}`}
      className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{actividad.id_obra}</p>
        <p className="text-xs text-gray-500 truncate">{clienteNombre}</p>
        {fechaFin && <p className="text-xs text-gray-400 mt-0.5">Vence: {fechaFin}</p>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ml-3 shrink-0 ${estado?.color}`}>
        {estado?.label}
      </span>
    </a>
  )
}
