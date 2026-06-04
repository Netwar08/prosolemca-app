// src/app/api/webhooks/make/route.ts
// Endpoint que Make llama para obtener datos enriquecidos de una actividad
// y para recibir eventos de estado desde Supabase

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Make llama a este endpoint con POST cuando Supabase detecta un cambio de estado
export async function POST(request: Request) {
  // Verificar secret para seguridad
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.MAKE_WEBHOOK_SECRET

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  return NextResponse.json({ ok: true, received: body })
}

// Make llama a GET para obtener datos completos de una actividad
// Ejemplo: GET /api/webhooks/make?id_obra=OB-202606-001
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id_obra = searchParams.get('id_obra')

  if (!id_obra) {
    return NextResponse.json({ error: 'id_obra requerido' }, { status: 400 })
  }

  const supabase = await createClient()

  // Obtener actividad con todos los datos relacionados
  const { data: act, error } = await supabase
    .from('actividades')
    .select('*')
    .eq('id_obra', id_obra)
    .single()

  if (error || !act) {
    return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
  }

  // Obtener cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('nombre, email, celular, telefono, persona_contacto, direccion')
    .eq('id', act.cliente_id)
    .single()

  // Obtener Técnico II
  const { data: tecnicoII } = act.tecnico_id ? await supabase
    .from('tecnicos')
    .select('nombre, apellido, telefono')
    .eq('id', act.tecnico_id)
    .single() : { data: null }

  // Obtener Técnico I
  const { data: tecnicoI } = (act as any).tecnico_i_id ? await supabase
    .from('tecnicos')
    .select('nombre, apellido, telefono')
    .eq('id', (act as any).tecnico_i_id)
    .single() : { data: null }

  // Obtener última transición de estado
  const { data: ultimaTransicion } = await supabase
    .from('estado_transiciones')
    .select('estado_anterior, estado_nuevo, created_at')
    .eq('id_obra', id_obra)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Respuesta con todos los datos que Make necesita para armar los mensajes
  return NextResponse.json({
    actividad: {
      id_obra:               act.id_obra,
      nombre_descripcion:    act.nombre_descripcion,
      tipo_trabajo:          act.tipo_trabajo,
      estado:                act.estado,
      estado_anterior:       ultimaTransicion?.estado_anterior ?? null,
      fecha_inicio_estimada: act.fecha_inicio_estimada,
      fecha_fin_estimada:    act.fecha_fin_estimada,
      numero_cotizacion:     (act as any).numero_cotizacion ?? null,
      tiempo_garantia_meses: act.tiempo_garantia_meses,
      fecha_venc_garantia:   act.fecha_venc_garantia,
      checklist_pdf_url:     (act as any).checklist_pdf_url ?? null,
      notas_internas:        act.notas_internas,
    },
    cliente: {
      nombre:           cliente?.nombre ?? '',
      email:            cliente?.email ?? '',
      celular:          cliente?.celular ?? '',
      telefono:         cliente?.telefono ?? '',
      persona_contacto: cliente?.persona_contacto ?? '',
      direccion:        cliente?.direccion ?? '',
    },
    tecnico_ii: tecnicoII ? {
      nombre_completo: `${tecnicoII.nombre} ${tecnicoII.apellido}`,
      telefono:        tecnicoII.telefono ?? '',
    } : null,
    tecnico_i: tecnicoI ? {
      nombre_completo: `${(tecnicoI as any).nombre} ${(tecnicoI as any).apellido}`,
      telefono:        (tecnicoI as any).telefono ?? '',
    } : null,
    app_url: `${process.env.NEXT_PUBLIC_APP_URL}/actividades/${id_obra}`,
  })
}
