'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Cliente } from '@/lib/types/database'
import { ROL_CONTACTO_LABELS } from '@/lib/types/database'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('clientes').select('*').eq('activo', true).order('nombre')
      setClientes(data ?? [])
      setLoading(false)
    }
    cargar()
  }, [])

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.persona_contacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.celular?.includes(busqueda)
  )

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <a href="/clientes/nuevo" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuevo
        </a>
      </div>

      <input type="search" placeholder="Buscar por nombre, contacto o celular..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {loading && <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>}

      {!loading && filtrados.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium text-gray-600">{busqueda ? 'Sin resultados' : 'No hay clientes registrados'}</p>
          {!busqueda && <a href="/clientes/nuevo" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Registrar primer cliente →</a>}
        </div>
      )}

      <div className="space-y-3">
        {filtrados.map(cliente => (
          <a key={cliente.id} href={`/clientes/${cliente.id}`}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
              {cliente.foto_url
                ? <img src={cliente.foto_url} alt={cliente.nombre} className="w-full h-full object-cover" />
                : <span className="text-blue-600 font-bold text-lg">{cliente.nombre.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
              {cliente.persona_contacto && (
                <p className="text-sm text-gray-500 truncate">
                  {cliente.persona_contacto}
                  {cliente.rol_contacto && <span className="text-gray-400"> · {ROL_CONTACTO_LABELS[cliente.rol_contacto]}</span>}
                </p>
              )}
              {cliente.celular && <p className="text-xs text-gray-400 mt-0.5">{cliente.celular}</p>}
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </a>
        ))}
      </div>
    </div>
  )
}
