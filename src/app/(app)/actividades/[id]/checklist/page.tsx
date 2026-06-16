'use client'
// src/app/(app)/actividades/[id]/checklist/page.tsx
// FUNC #6 — El técnico completa el checklist de la actividad en campo

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generarPdfChecklist } from '@/lib/utils/generarPdfChecklist'
import type { TipoTrabajo } from '@/lib/types/database'

type Item = {
  id: string
  orden: number
  nombre_item: string
  tipo_respuesta: 'CHECKBOX' | 'NUMERO' | 'FOTO' | 'TEXTO' | 'DROPDOWN'
  opciones_dropdown: string[] | null
  obligatorio: boolean
  observacion?: string
  respondido: boolean
  respuesta_checkbox: boolean | null
  respuesta_numero: number | null
  respuesta_texto: string | null
  respuesta_dropdown: string | null
  foto_url: string | null
}

type ChecklistHeader = {
  id: string
  estado: string
  porcentaje_completado: number
  items_obligatorios: number
  items_obligatorios_ok: number
}

export default function ChecklistPage() {
  const { id: idObra } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [checklist, setChecklist] = useState<ChecklistHeader | null>(null)
  const [items, setItems]         = useState<Item[]>([])
  const [loading, setLoading]     = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [completando,   setCompletando]   = useState(false)
  const [generandoPdf,  setGenerandoPdf]  = useState(false)
  const [pdfUrl,        setPdfUrl]        = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      const { data: ch } = await (supabase as any)
        .from('checklists').select('*').eq('id_obra', idObra).single()

      if (!ch) {
        // Si no existe aún, crearlo
        const { error: rpcErr } = await (supabase as any).rpc('crear_checklist_desde_template', { p_id_obra: idObra })
        if (rpcErr) { setError('No se pudo crear el checklist: ' + rpcErr.message); setLoading(false); return }
        const { data: ch2 } = await (supabase as any).from('checklists').select('*').eq('id_obra', idObra).single()
        if (!ch2) { setError('No se pudo cargar el checklist tras crearlo'); setLoading(false); return }
        setChecklist(ch2)
        const { data: its } = await (supabase as any).from('items_checklist').select('*').eq('checklist_id', ch2.id).order('orden')
        setItems(its ?? [])
      } else {
        setChecklist(ch)
        const { data: its } = await (supabase as any).from('items_checklist').select('*').eq('checklist_id', ch.id).order('orden')
        setItems(its ?? [])
      }
      setLoading(false)
    }
    cargar()
  }, [idObra])

  async function guardarRespuesta(item: Item, campo: string, valor: any) {
    setGuardando(item.id)
    const update: any = { respondido: true, respondido_at: new Date().toISOString() }
    update[campo] = valor

    await (supabase as any).from('items_checklist').update(update).eq('id', item.id)

    // Actualizar estado local
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, [campo]: valor, respondido: true } : i))

    // Recalcular progreso
    const todosItems = items.map(i => i.id === item.id ? { ...i, [campo]: valor, respondido: true } : i)
    const respondidos = todosItems.filter(i => i.respondido || i.id === item.id)
    const obligOk = todosItems.filter(i => i.obligatorio && (i.respondido || i.id === item.id)).length
    const pct = Math.round(respondidos.length / todosItems.length * 100)

    if (checklist) {
      await (supabase as any).from('checklists').update({
        items_completados: respondidos.length,
        items_obligatorios_ok: obligOk,
        porcentaje_completado: pct,
      }).eq('id', checklist.id)
      setChecklist(prev => prev ? { ...prev, porcentaje_completado: pct, items_obligatorios_ok: obligOk } : prev)
    }
    setGuardando(null)
  }

  async function subirFoto(item: Item, file: File) {
    setGuardando(item.id)
    const ext = file.name.split('.').pop()
    const fileName = `${idObra}_${item.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('checklist-fotos').upload(fileName, file)
    if (upErr) { setGuardando(null); return }
    const url = supabase.storage.from('checklist-fotos').getPublicUrl(fileName).data.publicUrl
    await guardarRespuesta(item, 'foto_url', url)
  }

  async function completarChecklist() {
    if (!checklist) return
    const obligatoriosSinResponder = items.filter(i => i.obligatorio && !i.respondido)
    if (obligatoriosSinResponder.length > 0) {
      setError(`Faltan ${obligatoriosSinResponder.length} ítems obligatorios: ${obligatoriosSinResponder.map(i => `#${i.orden} ${i.nombre_item}`).join(', ')}`)
      return
    }
    setCompletando(true)
    setError(null)

    const ahora = new Date().toISOString()

    // 1. Marcar checklist como completado
    await (supabase as any).from('checklists').update({
      estado: 'COMPLETADO',
      completado_at: ahora,
      porcentaje_completado: 100,
    }).eq('id', checklist.id)

    // 2. Generar PDF
    try {
      setGenerandoPdf(true)

      // Obtener datos de la actividad para el PDF
      const { data: act } = await (supabase as any)
        .from('actividades')
        .select('*, clientes(nombre), tecnicos!actividades_tecnico_id_fkey(nombre,apellido)')
        .eq('id_obra', idObra)
        .single()

      // Obtener nombre del Técnico I si existe
      let tecnicoINombre: string | undefined
      if ((act as any)?.tecnico_i_id) {
        const { data: t1 } = await (supabase as any).from('tecnicos')
          .select('nombre, apellido').eq('id', (act as any).tecnico_i_id).single()
        if (t1) tecnicoINombre = `${t1.nombre} ${t1.apellido}`
      }

      const tII = (act as any)?.tecnicos
      const pdfBlob = await generarPdfChecklist({
        idObra,
        numeroCotizacion: (act as any)?.numero_cotizacion ?? undefined,
        tipoTrabajo:      (checklist as any).tipo_trabajo as TipoTrabajo,
        clienteNombre:    (act as any)?.clientes?.nombre ?? 'Cliente',
        tecnicoNombre:    tII ? `${tII.nombre} ${tII.apellido}` : 'N/A',
        tecnicoINombre,
        items,
        completado_at:    ahora,
      })

      // 3. Subir PDF a Supabase Storage
      const fileName = `${idObra}_checklist_${Date.now()}.pdf`
      const { error: upErr } = await supabase.storage
        .from('checklist-pdfs')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' })

      if (!upErr) {
        const url = supabase.storage.from('checklist-pdfs').getPublicUrl(fileName).data.publicUrl
        setPdfUrl(url)

        // 4. Guardar URL en checklist y en actividad
        await Promise.all([
          (supabase as any).from('checklists').update({ pdf_url: url }).eq('id', checklist.id),
          (supabase as any).from('actividades').update({ checklist_pdf_url: url }).eq('id_obra', idObra),
        ])
      }
    } catch (pdfErr) {
      console.error('Error generando PDF:', pdfErr)
      // No bloqueamos el flujo si el PDF falla
    } finally {
      setGenerandoPdf(false)
    }

    // 5. Cambiar estado actividad a EJECUTADA y guardar fecha real de fin
    await (supabase as any).from('actividades').update({
      estado: 'EJECUTADA',
      fecha_real_fin: new Date().toISOString(),
    }).eq('id_obra', idObra)
    router.push(`/actividades/${idObra}`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Cargando checklist...</div>
  if (!checklist) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">No se encontró el checklist</div>

  const obligOk  = items.filter(i => i.obligatorio && i.respondido).length
  const obligTotal = items.filter(i => i.obligatorio).length
  const pct = items.length > 0 ? Math.round(items.filter(i => i.respondido).length / items.length * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky con progreso */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <a href={`/actividades/${idObra}`} className="text-gray-400 hover:text-gray-600 text-xl">←</a>
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-900">Checklist — {idObra}</h1>
              <p className="text-xs text-gray-500">{obligOk}/{obligTotal} ítems obligatorios completados</p>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{pct}% completado</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-32">
        {items.map(item => (
          <ItemChecklist
            key={item.id}
            item={item}
            guardando={guardando === item.id}
            onCheckbox={val => guardarRespuesta(item, 'respuesta_checkbox', val)}
            onNumero={val => guardarRespuesta(item, 'respuesta_numero', val)}
            onTexto={val => guardarRespuesta(item, 'respuesta_texto', val)}
            onDropdown={val => guardarRespuesta(item, 'respuesta_dropdown', val)}
            onFoto={file => subirFoto(item, file)}
          />
        ))}
      </div>

      {/* Botón flotante al fondo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <button onClick={completarChecklist} disabled={completando || generandoPdf}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors">
            {generandoPdf ? '📄 Generando PDF...' : completando ? 'Procesando...' : '✓ Marcar como EJECUTADA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Validación de valores numéricos absurdos ─────────────────────────────────
function validarNumero(nombreItem: string, valor: number): string | null {
  const n = nombreItem.toLowerCase()
  if ((n.includes('volt') || n.includes('tensión') || n.includes('tension')) && valor > 999)
    return 'Verificar voltaje — valor mayor a 999 V es inusual'
  if ((n.includes('amper') || n.includes('corriente') || n.includes(' amp')) && valor > 500)
    return 'Verificar corriente — valor mayor a 500 A es inusual'
  if ((n.includes('temp') || n.includes('°c') || n.includes('grados')) && (valor > 200 || valor < -50))
    return 'Verificar temperatura — fuera del rango esperado'
  if ((n.includes('presión') || n.includes('presion') || n.includes('psi') || n.includes(' bar')) && valor > 10000)
    return 'Verificar presión — valor fuera de rango normal'
  if ((n.includes('rpm') || n.includes('velocidad')) && valor > 100000)
    return 'Verificar RPM — valor fuera de rango normal'
  if (valor < 0 && !n.includes('temp') && !n.includes('°'))
    return 'Verificar — valor negativo inusual para este campo'
  return null
}

// ─── Componente de ítem individual ────────────────────────────────────────────
function ItemChecklist({ item, guardando, onCheckbox, onNumero, onTexto, onDropdown, onFoto }: {
  item: Item
  guardando: boolean
  onCheckbox: (v: boolean) => void
  onNumero:   (v: number)  => void
  onTexto:    (v: string)  => void
  onDropdown: (v: string)  => void
  onFoto:     (f: File)    => void
}) {
  const [textoLocal, setTextoLocal] = useState(item.respuesta_texto ?? '')
  const [numeroLocal, setNumeroLocal] = useState(item.respuesta_numero?.toString() ?? '')

  const respondido = item.respondido
  const borderColor = !respondido && item.obligatorio ? 'border-red-200' : respondido ? 'border-green-200' : 'border-gray-200'
  const bgColor = respondido ? 'bg-green-50' : 'bg-white'

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${borderColor} ${bgColor}`}>
      <div className="flex items-start gap-3">
        {/* Número y estado */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
          respondido ? 'bg-green-500 text-white' : item.obligatorio ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {respondido ? '✓' : item.orden}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{item.nombre_item}</p>
            {item.obligatorio && !respondido && (
              <span className="text-xs text-red-500 font-medium">*obligatorio</span>
            )}
          </div>
          {item.observacion && (
            <p className="text-xs text-gray-400 mt-0.5">{item.observacion}</p>
          )}

          {/* Controles según tipo */}
          <div className="mt-2">
            {item.tipo_respuesta === 'CHECKBOX' && (
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} type="button"
                    onClick={() => onCheckbox(val)}
                    disabled={guardando}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      item.respuesta_checkbox === val
                        ? val ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {val ? 'SÍ' : 'NO'}
                  </button>
                ))}
              </div>
            )}

            {item.tipo_respuesta === 'NUMERO' && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={numeroLocal}
                    onChange={e => setNumeroLocal(e.target.value)}
                    onBlur={() => { if (numeroLocal) onNumero(parseFloat(numeroLocal)) }}
                    placeholder="Ingresa el valor..."
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      numeroLocal && validarNumero(item.nombre_item, parseFloat(numeroLocal))
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300'
                    }`} />
                  {numeroLocal && (
                    <button onClick={() => onNumero(parseFloat(numeroLocal))} disabled={guardando}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs">
                      {guardando ? '...' : '✓'}
                    </button>
                  )}
                </div>
                {numeroLocal && validarNumero(item.nombre_item, parseFloat(numeroLocal)) && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ {validarNumero(item.nombre_item, parseFloat(numeroLocal))}
                  </p>
                )}
              </div>
            )}

            {item.tipo_respuesta === 'DROPDOWN' && item.opciones_dropdown && (
              <select value={item.respuesta_dropdown ?? ''} onChange={e => onDropdown(e.target.value)}
                disabled={guardando}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Seleccionar...</option>
                {item.opciones_dropdown.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            )}

            {item.tipo_respuesta === 'TEXTO' && (
              <div className="flex gap-2">
                <textarea value={textoLocal} onChange={e => setTextoLocal(e.target.value)}
                  rows={2} placeholder="Escribe aquí..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                {textoLocal && (
                  <button onClick={() => onTexto(textoLocal)} disabled={guardando}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs self-end">
                    {guardando ? '...' : '✓'}
                  </button>
                )}
              </div>
            )}

            {item.tipo_respuesta === 'FOTO' && (
              <div className="flex items-center gap-3">
                {item.foto_url ? (
                  <div className="flex items-center gap-2">
                    <img src={item.foto_url} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    <label className="text-xs text-blue-600 cursor-pointer hover:underline">
                      Cambiar
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) onFoto(f) }} />
                    </label>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg text-sm cursor-pointer transition-colors ${
                    guardando ? 'border-gray-200 text-gray-400' : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                  }`}>
                    📷 {guardando ? 'Subiendo...' : 'Tomar/subir foto'}
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) onFoto(f) }} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
