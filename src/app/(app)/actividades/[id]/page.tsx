'use client'
// src/app/(app)/actividades/[id]/page.tsx

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ESTADOS, TIPOS_TRABAJO_LABELS, getTransicionesDisponibles } from '@/lib/constants/estados'
import type { Actividad, Cliente, Tecnico, EstadoTransicion, RolUsuario } from '@/lib/types/database'

export default function ActividadDetallePage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [actividad,      setActividad]      = useState<Actividad | null>(null)
  const [cliente,        setCliente]        = useState<Cliente | null>(null)
  const [tecnico,        setTecnico]        = useState<Tecnico | null>(null)   // Téc II
  const [tecnicoI,       setTecnicoI]       = useState<Tecnico | null>(null)   // Téc I
  const [equipo,         setEquipo]         = useState<any | null>(null)
  const [historial,      setHistorial]      = useState<EstadoTransicion[]>([])
  const [miRol,          setMiRol]          = useState<RolUsuario>('VENTAS')
  const [loading,        setLoading]        = useState(true)
  const [cambiando,      setCambiando]      = useState(false)
  const [errorAccion,    setErrorAccion]    = useState<string | null>(null)
  const [tab,            setTab]            = useState<'info' | 'historial'>('info')

  // Modal motivo (rechazar / retrabajo)
  const [modalMotivo,    setModalMotivo]    = useState<string | null>(null)
  const [motivoInput,    setMotivoInput]    = useState('')

  // Modal asignar técnico
  const [modalTecnico,   setModalTecnico]   = useState(false)
  const [tecnicosDisp,   setTecnicosDisp]   = useState<Tecnico[]>([])
  const [tecnicoIISel,   setTecnicoIISel]   = useState('')  // Técnico II
  const [tecnicoISel,    setTecnicoISel]    = useState('')  // Técnico I

  // Modal eliminar
  const [modalEliminar,  setModalEliminar]  = useState(false)
  const [eliminando,     setEliminando]     = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: act }, { data: perfil }, { data: hist }] = await Promise.all([
        (supabase as any).from('actividades').select('*').eq('id_obra', id).single(),
        (supabase as any).from('perfiles').select('rol').eq('id', user.id).single(),
        (supabase as any).from('estado_transiciones').select('*').eq('id_obra', id).order('created_at', { ascending: false }),
      ])

      setActividad(act)
      setMiRol(perfil?.rol ?? 'VENTAS')
      setHistorial(hist ?? [])

      if (act?.cliente_id) {
        const { data: c } = await (supabase as any).from('clientes').select('*').eq('id', act.cliente_id).single()
        setCliente(c)
      }
      if (act?.tecnico_id) {
        const { data: t } = await (supabase as any).from('tecnicos').select('*').eq('id', act.tecnico_id).single()
        setTecnico(t)
      }
      if ((act as any)?.tecnico_i_id) {
        const { data: t1 } = await (supabase as any).from('tecnicos').select('*').eq('id', (act as any).tecnico_i_id).single()
        setTecnicoI(t1)
      }
      if (act?.equipo_id) {
        const { data: eq } = await (supabase as any).from('equipos').select('*').eq('id', act.equipo_id).single()
        setEquipo(eq)
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  // ─── Cambiar estado ───────────────────────────────────────────────────────
  async function cambiarEstado(estadoDestino: string, motivo?: string) {
    if (!actividad) return
    setCambiando(true)
    setErrorAccion(null)

    // Al validar: si ya hay al menos un técnico asignado, saltar a ASIGNADA
    const tieneTecnico = actividad.tecnico_id || (actividad as any).tecnico_i_id
    let estadoFinal = estadoDestino
    if (estadoDestino === 'VALIDADA' && tieneTecnico) {
      estadoFinal = 'ASIGNADA'
    }

    if (estadoFinal === 'EN_EJECUCION') {
      await (supabase as any).rpc('crear_checklist_desde_template', { p_id_obra: id })
    }

    const { error } = await supabase
      .from('actividades')
      .update({ estado: estadoFinal, ...(motivo ? { motivo_rechazo: motivo } : {}) })
      .eq('id_obra', id)

    if (error) {
      setErrorAccion(`Error: ${error.message}`)
    } else {
      setActividad(prev => prev ? { ...prev, estado: estadoFinal as any } : prev)
      const { data: hist } = await supabase
        .from('estado_transiciones').select('*').eq('id_obra', id).order('created_at', { ascending: false })
      setHistorial(hist ?? [])
    }
    setCambiando(false)
    setModalMotivo(null)
    setMotivoInput('')
  }

  // ─── Asignar técnico ─────────────────────────────────────────────────────
  async function abrirModalTecnico() {
    const { data } = await (supabase as any).from('tecnicos').select('*').eq('activo', true).order('nombre')
    setTecnicosDisp(data ?? [])
    setTecnicoIISel(actividad?.tecnico_id ?? '')
    setTecnicoISel((actividad as any)?.tecnico_i_id ?? '')
    setModalTecnico(true)
  }

  async function confirmarAsignacion() {
    // Debe haber al menos uno asignado
    if (!tecnicoIISel && !tecnicoISel) {
      setErrorAccion('Asigna al menos un técnico')
      return
    }
    setCambiando(true)
    setErrorAccion(null)
    const { error } = await supabase
      .from('actividades')
      .update({
        tecnico_id:   tecnicoIISel || null,
        tecnico_i_id: tecnicoISel  || null,
        estado: 'ASIGNADA',
      })
      .eq('id_obra', id)

    if (error) {
      setErrorAccion(`Error: ${error.message}`)
    } else {
      const tII = tecnicosDisp.find(t => t.id === tecnicoIISel) ?? null
      const tI  = tecnicosDisp.find(t => t.id === tecnicoISel)  ?? null
      setTecnico(tII)
      setTecnicoI(tI)
      setActividad(prev => prev ? {
        ...prev,
        tecnico_id:   tecnicoIISel || null,
        tecnico_i_id: tecnicoISel  || null,
        estado: 'ASIGNADA' as any,
      } : prev)
      const { data: hist } = await supabase
        .from('estado_transiciones').select('*').eq('id_obra', id).order('created_at', { ascending: false })
      setHistorial(hist ?? [])
    }
    setCambiando(false)
    setModalTecnico(false)
  }

  // ─── Eliminar actividad ───────────────────────────────────────────────────
  async function eliminarActividad() {
    setEliminando(true)
    const { error } = await (supabase as any).from('actividades').delete().eq('id_obra', id)
    if (error) {
      setErrorAccion(`Error al eliminar: ${error.message}`)
      setEliminando(false)
      setModalEliminar(false)
    } else {
      router.push('/actividades')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando...</div>
  if (!actividad) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Actividad no encontrada</div>

  const configEstado = ESTADOS[actividad.estado]
  const transiciones = getTransicionesDisponibles(actividad.estado, miRol)
  const esAdmin      = miRol === 'ADMIN' || miRol === 'VALERIO'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/actividades" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900">{actividad.id_obra}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${configEstado?.color}`}>
                {configEstado?.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{actividad.nombre_descripcion}</p>
          </div>
          {/* Acciones admin */}
          {esAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <a href={`/actividades/${id}/editar`}
                className="text-xs text-blue-600 hover:underline px-2 py-1 border border-blue-200 rounded-lg">
                Editar
              </a>
              <button onClick={() => setModalEliminar(true)}
                className="text-xs text-red-500 hover:underline px-2 py-1 border border-red-200 rounded-lg">
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Error */}
        {errorAccion && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {errorAccion}
          </div>
        )}

        {/* Botones de transición */}
        {transiciones.length > 0 && (
          <div className="space-y-2">
            {transiciones.map(t => (
              <button key={t.estadoDestino}
                onClick={() => t.requiereMotivo ? setModalMotivo(t.estadoDestino) : cambiarEstado(t.estadoDestino)}
                disabled={cambiando}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  t.estadoDestino === 'RECHAZADA' || t.estadoDestino === 'RETRABAJO'
                    ? 'bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                {cambiando ? 'Procesando...' : t.label}
                {t.estadoDestino === 'VALIDADA' && (actividad.tecnico_id || (actividad as any).tecnico_i_id) && (
                  <span className="text-xs font-normal ml-1 opacity-75">(pasará directo a Asignada)</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Botón especial: Asignar técnico (estado VALIDADA sin ningún técnico) */}
        {actividad.estado === 'VALIDADA' && !actividad.tecnico_id && !(actividad as any).tecnico_i_id && esAdmin && (
          <button onClick={abrirModalTecnico} disabled={cambiando}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
            👤 Asignar técnico
          </button>
        )}

        {/* Botón checklist (EN_EJECUCION) */}
        {actividad.estado === 'EN_EJECUCION' && (
          <a href={`/actividades/${id}/checklist`}
            className="flex items-center justify-between bg-orange-50 border-2 border-orange-300 rounded-xl px-4 py-3 hover:bg-orange-100 transition-colors">
            <div>
              <p className="font-semibold text-orange-800 text-sm">📋 Completar checklist</p>
              <p className="text-xs text-orange-600">Requerido para marcar como ejecutada</p>
            </div>
            <span className="text-orange-400 text-lg">›</span>
          </a>
        )}

        {/* Descripción del estado */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">{configEstado?.descripcion}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['info', 'historial'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {t === 'info' ? 'Información' : `Historial (${historial.length})`}
            </button>
          ))}
        </div>

        {/* Tab Información */}
        {tab === 'info' && (
          <div className="space-y-4">
            <InfoCard titulo="Servicio">
              <Fila label="Tipo"        value={TIPOS_TRABAJO_LABELS[actividad.tipo_trabajo] ?? actividad.tipo_trabajo} />
              <Fila label="Descripción" value={actividad.nombre_descripcion} />
              <Fila label="Ubicación"   value={actividad.ubicacion} />
              {(actividad as any).numero_cotizacion && (
                <Fila label="N° Cotización" value={(actividad as any).numero_cotizacion} />
              )}
            </InfoCard>

            <InfoCard titulo="Cliente">
              {cliente ? (
                <>
                  <Fila label="Nombre"   value={cliente.nombre} />
                  {cliente.persona_contacto && <Fila label="Contacto" value={cliente.persona_contacto} />}
                  {cliente.celular && <Fila label="Celular" value={cliente.celular} />}
                  <a href={`/clientes/${cliente.id}`} className="text-xs text-blue-600 hover:underline mt-1 block">
                    Ver perfil del cliente →
                  </a>
                </>
              ) : <p className="text-sm text-gray-400">Sin datos</p>}
            </InfoCard>

            <InfoCard titulo="Técnicos asignados">
              <div className="space-y-2">
                {/* Técnico II */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Técnico II (responsable)</p>
                    {tecnico
                      ? <p className="text-sm text-gray-800 font-medium">{tecnico.nombre} {tecnico.apellido}</p>
                      : <p className="text-sm text-gray-400 italic">Sin asignar</p>}
                  </div>
                </div>
                {/* Técnico I */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Técnico I (asistente)</p>
                    {tecnicoI
                      ? <p className="text-sm text-gray-800 font-medium">{tecnicoI.nombre} {tecnicoI.apellido}</p>
                      : <p className="text-sm text-gray-400 italic">Sin asignar</p>}
                  </div>
                </div>
                {/* Botón cambiar si es admin */}
                {esAdmin && ['VALIDADA', 'ASIGNADA'].includes(actividad.estado) && (
                  <button onClick={abrirModalTecnico}
                    className="w-full mt-1 text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    {tecnico || tecnicoI ? 'Cambiar asignación' : 'Asignar técnico →'}
                  </button>
                )}
              </div>
            </InfoCard>

            {equipo && (
              <InfoCard titulo="Equipo involucrado">
                <Fila label="Nombre" value={equipo.nombre} />
                <Fila label="Tipo"   value={equipo.tipo} />
                <Fila label="Marca"  value={equipo.marca} />
              </InfoCard>
            )}

            <InfoCard titulo="Fechas y plazos">
              <Fila label="Inicio estimado"  value={new Date(actividad.fecha_inicio_estimada).toLocaleDateString('es-VE')} />
              <Fila label="Fin estimado"     value={new Date(actividad.fecha_fin_estimada).toLocaleDateString('es-VE')} />
              <Fila label="Días estimados"   value={`${actividad.dias_estimados} días`} />
              {actividad.fecha_inicio_real && (
                <Fila label="Inicio real" value={new Date(actividad.fecha_inicio_real).toLocaleDateString('es-VE')} />
              )}
              {actividad.fecha_venc_garantia && (
                <Fila label="Venc. garantía" value={new Date(actividad.fecha_venc_garantia).toLocaleDateString('es-VE')} />
              )}
            </InfoCard>

            {(actividad as any).checklist_pdf_url && (
              <InfoCard titulo="Documentos">
                <a href={(actividad as any).checklist_pdf_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Checklist PDF</p>
                    <p className="text-xs text-red-500">Toca para abrir o descargar</p>
                  </div>
                  <span className="ml-auto text-red-400 text-lg">↗</span>
                </a>
              </InfoCard>
            )}

            {actividad.notas_internas && (
              <InfoCard titulo="Notas internas">
                <p className="text-sm text-gray-700">{actividad.notas_internas}</p>
              </InfoCard>
            )}
          </div>
        )}

        {/* Tab Historial */}
        {tab === 'historial' && (
          <div className="space-y-2">
            {historial.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Sin cambios registrados aún</p>
            )}
            {historial.map(h => (
              <div key={h.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {h.estado_anterior && (
                        <>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${ESTADOS[h.estado_anterior]?.color}`}>
                            {ESTADOS[h.estado_anterior]?.label}
                          </span>
                          <span className="text-gray-400 text-xs">→</span>
                        </>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADOS[h.estado_nuevo]?.color}`}>
                        {ESTADOS[h.estado_nuevo]?.label}
                      </span>
                    </div>
                    {h.motivo && <p className="text-xs text-gray-500 mt-1">"{h.motivo}"</p>}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {new Date(h.created_at).toLocaleDateString('es-VE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: Motivo (rechazar / retrabajo) ─────────────────────────── */}
      {modalMotivo && (
        <Modal titulo={ESTADOS[actividad.estado]?.transicionesDesde.find(t => t.estadoDestino === modalMotivo)?.label ?? 'Confirmar'}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <textarea value={motivoInput} onChange={e => setMotivoInput(e.target.value)} rows={3}
              placeholder="Describe el motivo..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3">
            <BtnSecundario onClick={() => { setModalMotivo(null); setMotivoInput('') }}>Cancelar</BtnSecundario>
            <BtnPrimario onClick={() => motivoInput.trim() && cambiarEstado(modalMotivo, motivoInput.trim())}
              disabled={!motivoInput.trim() || cambiando}>
              Confirmar
            </BtnPrimario>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Asignar técnico (I y II) ─────────────────────────────── */}
      {modalTecnico && (
        <Modal titulo="Asignar técnicos">
          <div className="space-y-4 max-h-96 overflow-y-auto">

            {/* Técnico II */}
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Técnico II — Responsable principal
              </p>
              <div className="space-y-1.5">
                <button type="button" onClick={() => setTecnicoIISel('')}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                    !tecnicoIISel ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
                  Sin Técnico II
                </button>
                {tecnicosDisp.filter(t => t.rol === 'TECNICO_II').map(t => (
                  <button key={t.id} type="button" onClick={() => setTecnicoIISel(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center justify-between ${
                      tecnicoIISel === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <div>
                      <p className="font-medium">{t.nombre} {t.apellido}</p>
                      {t.telefono && <p className="text-xs text-gray-400">{t.telefono}</p>}
                    </div>
                    {tecnicoIISel === t.id && <span className="text-blue-600 text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Técnico I */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Técnico I — Asistente (opcional)
              </p>
              <div className="space-y-1.5">
                <button type="button" onClick={() => setTecnicoISel('')}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                    !tecnicoISel ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
                  Sin Técnico I
                </button>
                {tecnicosDisp.filter(t => t.rol === 'TECNICO_I').map(t => (
                  <button key={t.id} type="button" onClick={() => setTecnicoISel(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center justify-between ${
                      tecnicoISel === t.id
                        ? 'border-gray-600 bg-gray-50 text-gray-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <div>
                      <p className="font-medium">{t.nombre} {t.apellido}</p>
                      {t.telefono && <p className="text-xs text-gray-400">{t.telefono}</p>}
                    </div>
                    {tecnicoISel === t.id && <span className="text-gray-600 text-lg">✓</span>}
                  </button>
                ))}
                {tecnicosDisp.filter(t => t.rol === 'TECNICO_I').length === 0 && (
                  <p className="text-xs text-gray-400 px-3">No hay Técnicos I registrados</p>
                )}
              </div>
            </div>

            {!tecnicoIISel && !tecnicoISel && (
              <p className="text-xs text-amber-600 text-center">Asigna al menos un técnico para continuar</p>
            )}
          </div>

          <div className="flex gap-3">
            <BtnSecundario onClick={() => setModalTecnico(false)}>Cancelar</BtnSecundario>
            <BtnPrimario onClick={confirmarAsignacion} disabled={(!tecnicoIISel && !tecnicoISel) || cambiando}>
              {cambiando ? 'Asignando...' : 'Confirmar asignación'}
            </BtnPrimario>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Confirmar eliminación ─────────────────────────────────── */}
      {modalEliminar && (
        <Modal titulo="Eliminar actividad">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar <strong>{actividad.id_obra}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <BtnSecundario onClick={() => setModalEliminar(false)}>Cancelar</BtnSecundario>
            <button onClick={eliminarActividad} disabled={eliminando}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function Modal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">{titulo}</h3>
        {children}
      </div>
    </div>
  )
}

function BtnPrimario({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {children}
    </button>
  )
}

function BtnSecundario({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
      {children}
    </button>
  )
}

function InfoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{titulo}</p>
      {children}
    </div>
  )
}

function Fila({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}
