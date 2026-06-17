// src/lib/supabase/admin.ts
// Cliente con service role key — SOLO para API routes server-side.
// Tiene permisos de administrador: crear usuarios, saltarse RLS.
// NUNCA importar desde componentes del cliente.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
