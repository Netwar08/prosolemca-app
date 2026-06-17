// src/app/api/tecnicos/credenciales/route.ts
// Crea o actualiza las credenciales de acceso (auth) de un técnico.
// Usa service role key — solo accesible desde el servidor.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient }      from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // 1. Verificar que quien llama es ADMIN o VALERIO
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await (supabase as any)
    .from('perfiles').select('rol').eq('id', user.id).single()
  if (!['ADMIN', 'VALERIO'].includes(perfil?.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // 2. Leer body
  const { tecnico_id, email, password, nombre, apellido, rol } = await req.json()
  if (!tecnico_id || !email || !password || !nombre || !apellido || !rol) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Verificar si ya existe un perfil vinculado a este técnico
  const { data: perfilExistente } = await (admin as any)
    .from('perfiles').select('id').eq('tecnico_id', tecnico_id).maybeSingle()

  if (perfilExistente) {
    // Ya tiene cuenta — solo actualizar contraseña
    const { error } = await admin.auth.admin.updateUserById(perfilExistente.id, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, accion: 'contrasena_actualizada' })
  }

  // 4. Crear usuario auth
  const { data: nuevoUser, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,    // sin necesidad de confirmar por email
    user_metadata: { nombre, apellido },
  })
  if (errAuth || !nuevoUser?.user) {
    return NextResponse.json({ error: errAuth?.message ?? 'Error al crear usuario' }, { status: 400 })
  }

  // 5. Crear perfil vinculando auth user → técnico
  const { error: errPerfil } = await (admin as any).from('perfiles').insert({
    id:         nuevoUser.user.id,
    nombre,
    apellido,
    rol,
    tecnico_id,
    activo:     true,
  })
  if (errPerfil) {
    // Revertir usuario auth si falla el perfil
    await admin.auth.admin.deleteUser(nuevoUser.user.id)
    return NextResponse.json({ error: errPerfil.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, accion: 'usuario_creado', user_id: nuevoUser.user.id })
}
