'use client'
// src/app/(app)/tecnicos/page.tsx
// Lista de técnicos con acceso a crear y editar

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tecnico } from '@/lib/types/database'

const ROL_LABELS: Record<string, string> = {
  TECNICO_I:  'Técnico I',
  TECNICO_II: 'Técnico II',
}

const ROL_COLOR: Record<string, string> = {
  TECNICO_I:  'bg-gray-100 text-gray-600',
  TECNICO_II: 'bg-blue-100 text-blue-700',
}

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [loading, setLoading]   = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('tecnicos').select('*').order('nombre')
      .then(({ data }) => { setTecnicos(data ?? []); setLoading(false) })
  }, [])

  async function toggleActivo(tecnico: Tecnico) {
    await supabase.from('tecnicos').update({ activo: !tecnico.activo }).eq('id', tecnico.id)
    setTecnicos(prev => prev.map(t => t.id === tecnico.id ? { ...t, activo: !t.activo } : t))
  }

  const activos   = tecnicos.filter(t => t.activo)
  const inactivos = tecnicos.filter(t => !t.activo)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Técnicos</h1>
        <a href="/tecnicos/nuevo"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuevo
        </a>
      </div>

      {loading && <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>}

      {/* Activos */}
      {activos.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Activos ({activos.length})
          </p>
          {activos.map(t => (
            <TecnicoCard key={t.id} tecnico={t} onToggle={toggleActivo} />
          ))}
        </section>
      )}

      {/* Inactivos */}
      {inactivos.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Inactivos ({inactivos.length})
          </p>
          {inactivos.map(t => (
            <TecnicoCard key={t.id} tecnico={t} onToggle={toggleActivo} />
          ))}
        </section>
      )}

      {!loading && tecnicos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-medium text-gray-600">No hay técnicos registrados</p>
          <a href="/tecnicos/nuevo" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
            Registrar primer técnico →
          </a>
        </div>
      )}
    </div>
  )
}

function TecnicoCard({ tecnico, onToggle }: { tecnico: Tecnico; onToggle: (t: Tecnico) => void }) {
  return (
    <div className={`flex items-center gap-4 bg-white rounded-xl border p-4 transition-opacity ${
      tecnico.activo ? 'border-gray-200' : 'border-gray-100 opacity-60'
    }`}>
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${
        tecnico.activo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {tecnico.nombre.charAt(0)}{tecnico.apellido.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">
            {tecnico.nombre} {tecnico.apellido}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROL_COLOR[tecnico.rol] ?? 'bg-gray-100 text-gray-600'}`}>
            {ROL_LABELS[tecnico.rol] ?? tecnico.rol}
          </span>
        </div>
        {tecnico.telefono && (
          <p className="text-sm text-gray-500 mt-0.5">{tecnico.telefono}</p>
        )}
        {tecnico.email && (
          <p className="text-xs text-gray-400 truncate">{tecnico.email}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <a href={`/tecnicos/${tecnico.id}/editar`}
          className="text-xs text-blue-600 hover:underline px-2 py-1">
          Editar
        </a>
        <button
          onClick={() => onToggle(tecnico)}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
            tecnico.activo
              ? 'border-red-200 text-red-500 hover:bg-red-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
        >
          {tecnico.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
