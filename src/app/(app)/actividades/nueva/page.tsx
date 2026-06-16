'use client'
// src/app/(app)/actividades/nueva/page.tsx — FUNC #1: Crear actividad

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TIPOS_TRABAJO_LABELS } from '@/lib/constants/estados'
import type { Cliente, Tecnico, TipoTrabajo } from '@/lib/types/database'

const TIPOS = Object.entries(TIPOS_TRABAJO_LABELS) as [TipoTrabajo, string][]

// Materiales pre-cargados por tipo (igual que en la DB)
const MATERIALES_PRECARGADOS: Partial<Record<TipoTrabajo, string[]>> = {
  MANTENIMIENTO_PREVENTIVO_BOMBAS: ['Lubricantes', 'Juntas de goma', 'Filtros', 'Llave de ajuste'],
  MANTENIMIENTO_CORRECTIVO_BOMBAS: ['Kit diagnóstico', 'Multímetro', 'Pinza amperimétrica'],
  CORRECTIVO_TABLERO:              ['Multímetro', 'Destornilladores', 'Pinza amperimétrica', 'Cinta aislante'],
  VISITA_TECNICA:                  ['Kit diagnóstico básico', 'Manómetro portátil'],
  MANTENIMIENTO_FILTROS_AGUA:      ['Cartuchos de repuesto', 'Químicos de limpieza'],
  LIMPIEZA_DESINFECCION_TANQUES:   ['Cloro/Peróxido', 'Cepillos', 'Bomba de succión', 'EPP'],
}

// Genera el próximo ID de obra automáticamente
function generarIdObra(existentes: string[]): string {
  const hoy   = new Date()
  const yyyymm = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const prefijo = `OB-${yyyymm}-`
  const nums  = existentes
    .filter(id => id.startsWith(prefijo))
    .map(id => parseInt(id.replace(prefijo, ''), 10))
    .filter(n => !isNaN(n))
  const siguiente = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefijo}${String(siguiente).padStart(3, '0')}`
}

export default function NuevaActividadPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [clientes,  setClientes]  = useState<Cliente[]>([])
  const [tecnicos,  setTecnicos]  = useState<Tecnico[]>([])
  const [idObra,    setIdObra]    = useState('')
  const [materialInput, setMaterialInput] = useState('')

  const [equiposCliente, setEquiposCliente] = useState<{id:string,nombre:string,tipo:string}[]>([])

  const [form, setForm] = useState({
    nombre_descripcion:   '',
    cliente_id:           searchParams.get('cliente') ?? '',
    equipo_id:            '',
    ubicacion:            '',
    tipo_trabajo:         '' as TipoTrabajo | '',
    tecnico_id:           '',   // Técnico II
    tecnico_i_id:         '',   // Técnico I
    fecha_inicio_estimada:'',
    fecha_fin_estimada:   '',
    tiempo_garantia_meses: '12',
    numero_cotizacion:     '',
    notas_internas:        '',
    materiales_adicionales: [] as string[],
  })

  // Herramientas pre-cargadas según tipo
  const herramientas = form.tipo_trabajo ? (MATERIALES_PRECARGADOS[form.tipo_trabajo as TipoTrabajo] ?? []) : []
  const necesitaMateriales = ['INSTALACION_HIDRONEUMATICO','INSTALACION_PC_FLUJO_VARIABLE',
    'INSTALACION_FILTROS_AGUA','MANTENIMIENTO_CORRECTIVO_BOMBAS','CORRECTIVO_TABLERO'].includes(form.tipo_trabajo)

  useEffect(() => {
    async function cargarDatos() {
      const [{ data: c }, { data: t }, { data: ids }] = await Promise.all([
        (supabase as any).from('clientes').select('id, nombre').eq('activo', true).order('nombre'),
        (supabase as any).from('tecnicos').select('id, nombre, apellido, rol').eq('activo', true).order('nombre'),
        (supabase as any).from('actividades').select('id_obra'),
      ])
      setClientes(c ?? [])
      setTecnicos(t ?? [])
      setIdObra(generarIdObra((ids ?? []).map((r: any) => r.id_obra)))

      // Si viene con cliente pre-seleccionado, auto-completar ubicación
      if (searchParams.get('cliente') && c) {
        const cli = c.find(x => x.id === searchParams.get('cliente'))
        // Podríamos auto-completar ubicación si el cliente tiene dirección
      }
    }
    cargarDatos()
  }, [])

  // Auto-completar ubicación y cargar equipos cuando se selecciona un cliente
  useEffect(() => {
    if (!form.cliente_id) return
    (supabase as any).from('clientes').select('direccion').eq('id', form.cliente_id).single()
      .then(({ data }) => {
        if (data?.direccion) setForm(p => ({ ...p, ubicacion: data.direccion!, equipo_id: '' }))
      })
    (supabase as any).from('equipos').select('id, nombre, tipo').eq('cliente_id', form.cliente_id).eq('activo', true).order('nombre')
      .then(({ data }) => setEquiposCliente(data ?? []))
  }, [form.cliente_id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function agregarMaterial() {
    const m = materialInput.trim()
    if (!m) return
    setForm(prev => ({ ...prev, materiales_adicionales: [...prev.materiales_adicionales, m] }))
    setMaterialInput('')
  }

  function quitarMaterial(i: number) {
    setForm(prev => ({ ...prev, materiales_adicionales: prev.materiales_adicionales.filter((_, idx) => idx !== i) }))
  }

  // Validaciones
  function validar(): string | null {
    if (!form.nombre_descripcion)  return 'Ingresa una descripción'
    if (!form.numero_cotizacion)   return 'El número de cotización es obligatorio'
    if (!form.cliente_id)          return 'Selecciona un cliente'
    if (!form.tipo_trabajo)        return 'Selecciona el tipo de trabajo'
    if (!form.fecha_inicio_estimada) return 'Ingresa la fecha de inicio'
    if (!form.fecha_fin_estimada)    return 'Ingresa la fecha de fin'
    const inicio = new Date(form.fecha_inicio_estimada)
    const fin    = new Date(form.fecha_fin_estimada)
    const hoy    = new Date(); hoy.setHours(0,0,0,0)
    if (inicio < hoy) return 'La fecha de inicio no puede ser en el pasado'
    if (fin <= inicio) return 'La fecha de fin debe ser posterior al inicio'
    if (parseInt(form.tiempo_garantia_meses) < 0) return 'La garantía no puede ser negativa'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setLoading(true); setError(null)

    const { error: insertErr } = await (supabase as any).from('actividades').insert({
      id_obra:                idObra,
      nombre_descripcion:     form.nombre_descripcion,
      cliente_id:             form.cliente_id,
      ubicacion:              form.ubicacion,
      tipo_trabajo:           form.tipo_trabajo as TipoTrabajo,
      tecnico_id:             form.tecnico_id   || null,
      tecnico_i_id:           form.tecnico_i_id || null,
      fecha_inicio_estimada:  form.fecha_inicio_estimada,
      fecha_fin_estimada:     form.fecha_fin_estimada,
      tiempo_garantia_meses:  parseInt(form.tiempo_garantia_meses),
      equipo_id:              form.equipo_id || null,
      numero_cotizacion:      form.numero_cotizacion || null,
      notas_internas:         form.notas_internas || null,
      herramientas_consumibles: herramientas.length > 0 ? herramientas : null,
      materiales_adicionales: form.materiales_adicionales.length > 0 ? form.materiales_adicionales : null,
      estado:                 'CREADA',
      creado_por:             (await supabase.auth.getUser()).data.user!.id,
    })

    if (insertErr) { setError(insertErr.message); setLoading(false); return }
    router.push(`/actividades/${idObra}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <a href="/actividades" className="text-gray-400 hover:text-gray-600 text-xl">←</a>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nueva actividad</h1>
            <p className="text-xs text-gray-400">ID: <span className="font-mono font-semibold text-blue-600">{idObra}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Sección: Información principal */}
          <Seccion titulo="Información principal">
            <F label="Descripción del servicio *">
              <input name="nombre_descripcion" value={form.nombre_descripcion} onChange={handleChange}
                placeholder="Ej: Instalación de sistema hidroneumático" className={inp} />
            </F>
            <F label="Cliente *">
              <select name="cliente_id" value={form.cliente_id} onChange={handleChange} className={inp}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <a href="/clientes/nuevo" className="text-xs text-blue-600 mt-1 inline-block hover:underline">
                + Registrar nuevo cliente
              </a>
            </F>
            <F label="Ubicación / Dirección">
              <input name="ubicacion" value={form.ubicacion} onChange={handleChange}
                placeholder="Se auto-completa con la dirección del cliente" className={inp} />
            </F>
            {equiposCliente.length > 0 && (
              <F label="Equipo involucrado">
                <select name="equipo_id" value={form.equipo_id} onChange={handleChange} className={inp}>
                  <option value="">Sin equipo específico</option>
                  {equiposCliente.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.tipo})</option>
                  ))}
                </select>
              </F>
            )}
            {form.cliente_id && equiposCliente.length === 0 && (
              <p className="text-xs text-yellow-600">
                ⚠ Este cliente no tiene equipos registrados.{' '}
                <a href={`/clientes/${form.cliente_id}/equipos/nuevo`} className="underline">Agregar equipo →</a>
              </p>
            )}
          </Seccion>

          {/* Sección: Tipo de trabajo */}
          <Seccion titulo="Tipo de trabajo *">
            <div className="grid grid-cols-1 gap-2">
              {TIPOS.map(([value, label]) => (
                <button key={value} type="button"
                  onClick={() => setForm(p => ({ ...p, tipo_trabajo: value }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    form.tipo_trabajo === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Herramientas pre-cargadas */}
            {herramientas.length > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-700 mb-2">✓ Herramientas pre-cargadas automáticamente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {herramientas.map((h, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </Seccion>

          {/* Sección: Técnicos */}
          <Seccion titulo="Técnicos asignados">
            {/* Técnico II */}
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2">Técnico II — Responsable principal</p>
              <div className="space-y-1.5">
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, tecnico_id: '' }))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                    !form.tecnico_id ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-200 text-gray-500'
                  }`}>
                  Sin Técnico II
                </button>
                {tecnicos.filter(t => t.rol === 'TECNICO_II').map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setForm(p => ({ ...p, tecnico_id: t.id }))}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center justify-between ${
                      form.tecnico_id === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <span>{t.nombre} {t.apellido}</span>
                    {form.tecnico_id === t.id && <span className="text-blue-600">✓</span>}
                  </button>
                ))}
                {tecnicos.filter(t => t.rol === 'TECNICO_II').length === 0 && (
                  <p className="text-xs text-gray-400 px-2">No hay Técnicos II registrados</p>
                )}
              </div>
            </div>

            {/* Técnico I */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Técnico I — Asistente (opcional)</p>
              <div className="space-y-1.5">
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, tecnico_i_id: '' }))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                    !form.tecnico_i_id ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-200 text-gray-500'
                  }`}>
                  Sin Técnico I
                </button>
                {tecnicos.filter(t => t.rol === 'TECNICO_I').map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setForm(p => ({ ...p, tecnico_i_id: t.id }))}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center justify-between ${
                      form.tecnico_i_id === t.id
                        ? 'border-gray-600 bg-gray-50 text-gray-700 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    <span>{t.nombre} {t.apellido}</span>
                    {form.tecnico_i_id === t.id && <span className="text-gray-600">✓</span>}
                  </button>
                ))}
                {tecnicos.filter(t => t.rol === 'TECNICO_I').length === 0 && (
                  <p className="text-xs text-gray-400 px-2">No hay Técnicos I registrados</p>
                )}
              </div>
            </div>
          </Seccion>

          {/* Sección: Fechas */}
          <Seccion titulo="Fechas estimadas">
            <div className="grid grid-cols-2 gap-3">
              <F label="Inicio *">
                <input name="fecha_inicio_estimada" type="date" value={form.fecha_inicio_estimada}
                  onChange={handleChange} className={inp} />
              </F>
              <F label="Fin *">
                <input name="fecha_fin_estimada" type="date" value={form.fecha_fin_estimada}
                  onChange={handleChange} className={inp} />
              </F>
            </div>
            {form.fecha_inicio_estimada && form.fecha_fin_estimada && (
              <p className="text-xs text-blue-600 mt-1">
                ⏱ {Math.ceil((new Date(form.fecha_fin_estimada).getTime() - new Date(form.fecha_inicio_estimada).getTime()) / 86400000)} días estimados
              </p>
            )}
          </Seccion>

          {/* Sección: Garantía */}
          <Seccion titulo="Garantía">
            <F label="Tiempo de garantía (meses)">
              <input name="tiempo_garantia_meses" type="number" min="0" max="60"
                value={form.tiempo_garantia_meses} onChange={handleChange} className={inp} />
            </F>
            {parseInt(form.tiempo_garantia_meses) === 0 && (
              <p className="text-xs text-yellow-600 mt-1">⚠ Esta actividad no tendrá garantía</p>
            )}
          </Seccion>

          {/* Sección: Materiales adicionales */}
          {necesitaMateriales && (
            <Seccion titulo="Materiales adicionales">
              <p className="text-xs text-gray-500 mb-2">
                Este tipo de trabajo requiere ingresar los materiales necesarios.
              </p>
              <div className="flex gap-2">
                <input value={materialInput} onChange={e => setMaterialInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarMaterial() }}}
                  placeholder="Ej: Tanque hidroneumático 500L" className={`${inp} flex-1`} />
                <button type="button" onClick={agregarMaterial}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  +
                </button>
              </div>
              {form.materiales_adicionales.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.materiales_adicionales.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <span className="text-sm text-gray-700">{m}</span>
                      <button type="button" onClick={() => quitarMaterial(i)}
                        className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Seccion>
          )}

          {/* Cotización y Notas */}
          <Seccion titulo="Referencia y notas">
            <F label="Número de cotización *">
              <input name="numero_cotizacion" value={form.numero_cotizacion} onChange={handleChange}
                required placeholder="Ej: COT-2026-0042" className={inp} />
            </F>
            <F label="Notas internas">
            <textarea name="notas_internas" value={form.notas_internas} onChange={handleChange}
              rows={3} placeholder="Observaciones para Valerio o el equipo..." className={inp} />
            </F>
          </Seccion>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors">
            {loading ? 'Creando actividad...' : `Crear actividad ${idObra}`}
          </button>
        </form>
      </div>
    </div>
  )
}

const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{titulo}</p>
      {children}
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
