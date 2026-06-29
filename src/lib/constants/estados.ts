// src/lib/constants/estados.ts
// Configuración visual de cada estado: color, label, ícono y transiciones permitidas.

import type { EstadoActividad, RolUsuario } from '@/lib/types/database'

export interface ConfigEstado {
  label: string
  color: string        // Clase Tailwind para el badge
  descripcion: string
  // Qué roles pueden ejecutar esta transición
  transicionesDesde: {
    estadoDestino: EstadoActividad
    label: string      // Texto del botón
    roles: RolUsuario[]
    requiereMotivo?: boolean
  }[]
}

export const ESTADOS: Record<EstadoActividad, ConfigEstado> = {
  CREADA: {
    label: 'Creada',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    descripcion: 'Actividad recién creada, pendiente de validación por Valerio.',
    transicionesDesde: [
      { estadoDestino: 'VALIDADA', label: 'Validar', roles: ['ADMIN', 'VALERIO'] },
    ],
  },
  VALIDADA: {
    label: 'Validada',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    descripcion: 'Aprobada por Valerio. Lista para asignar técnico.',
    transicionesDesde: [],  // La asignación se hace desde el modal de técnico
  },
  RECHAZADA: {
    label: 'Rechazada',
    color: 'bg-red-100 text-red-700 border-red-300',
    descripcion: 'Rechazada por Valerio.',
    transicionesDesde: [],
  },
  CAMBIOS_SOLICITADOS: {
    label: 'Cambios solicitados',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    descripcion: 'Se solicitaron cambios.',
    transicionesDesde: [],
  },
  ASIGNADA: {
    label: 'Asignada',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    descripcion: 'Técnico asignado. Esperando que inicie la ejecución.',
    transicionesDesde: [
      { estadoDestino: 'EN_EJECUCION', label: 'Iniciar ejecución', roles: ['ADMIN', 'VALERIO', 'TECNICO_I', 'TECNICO_II'] },
    ],
  },
  EN_EJECUCION: {
    label: 'En ejecución',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    descripcion: 'Técnico trabajando en sitio.',
    transicionesDesde: [
      { estadoDestino: 'EJECUTADA', label: 'Marcar ejecutada', roles: ['ADMIN', 'VALERIO', 'TECNICO_I', 'TECNICO_II'] },
    ],
  },
  EJECUTADA: {
    label: 'Ejecutada',
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    descripcion: 'Técnico completó el checklist. Pendiente de supervisión.',
    transicionesDesde: [
      { estadoDestino: 'SUPERVISADA',  label: 'Supervisar',          roles: ['ADMIN', 'VALERIO'] },
      { estadoDestino: 'RETRABAJO',    label: 'Rechazar ejecución',  roles: ['ADMIN', 'VALERIO'], requiereMotivo: true },
    ],
  },
  SUPERVISADA: {
    label: 'Supervisada',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    descripcion: 'Valerio aprobó la ejecución. Listo para enviar informe al cliente.',
    transicionesDesde: [
      { estadoDestino: 'ENTREGADA_CLIENTE', label: 'Enviar informe y encuesta', roles: ['ADMIN', 'VALERIO', 'ATC'] },
    ],
  },
  ENTREGADA_CLIENTE: {
    label: 'Entregada al cliente',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    descripcion: 'Informe enviado. Esperando respuesta de encuesta del cliente.',
    transicionesDesde: [
      // Esta transición la hace el sistema automáticamente cuando el cliente responde
      { estadoDestino: 'CERRADA', label: 'Cerrar manualmente', roles: ['ADMIN', 'VALERIO'] },
    ],
  },
  CERRADA: {
    label: 'Cerrada',
    color: 'bg-green-100 text-green-700 border-green-300',
    descripcion: 'Cliente respondió. Garantía activa.',
    transicionesDesde: [
      { estadoDestino: 'RETRABAJO', label: 'Crear retrabajo', roles: ['ADMIN', 'VALERIO', 'ATC'], requiereMotivo: true },
    ],
  },
  RETRABAJO: {
    label: 'Retrabajo',
    color: 'bg-rose-100 text-rose-700 border-rose-300',
    descripcion: 'Problema identificado. Se asignó técnico para retrabajo.',
    transicionesDesde: [
      { estadoDestino: 'ASIGNADA', label: 'Reasignar técnico', roles: ['ADMIN', 'VALERIO'] },
    ],
  },
  FINALIZADA: {
    label: 'Finalizada',
    color: 'bg-slate-100 text-slate-500 border-slate-300',
    descripcion: 'Garantía vencida. Archivo histórico.',
    transicionesDesde: [],  // Estado terminal — no hay transiciones
  },
}

// ─── Labels de tipos de trabajo ────────────────────────────────────────────

export const TIPOS_TRABAJO_LABELS: Record<string, string> = {
  INSTALACION_HIDRONEUMATICO:       'Instalación Hidroneumático',
  INSTALACION_PC_FLUJO_VARIABLE:    'Instalación PC Flujo Variable',
  MANTENIMIENTO_PREVENTIVO_BOMBAS:  'Mantenimiento Preventivo Bombas',
  MANTENIMIENTO_CORRECTIVO_BOMBAS:  'Mantenimiento Correctivo Bombas',
  CORRECTIVO_TABLERO:               'Correctivo de Tablero',
  VISITA_TECNICA:                   'Visita Técnica',
  INSTALACION_FILTROS_AGUA:         'Instalación de Filtros de Agua',
  MANTENIMIENTO_FILTROS_AGUA:       'Mantenimiento de Filtros de Agua',
  LIMPIEZA_DESINFECCION_TANQUES:    'Limpieza y Desinfección de Tanques',
  PLOMERIA:                         'Plomería',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Devuelve las transiciones disponibles para un estado y rol dados */
export function getTransicionesDisponibles(
  estado: EstadoActividad,
  rol: RolUsuario
) {
  return ESTADOS[estado].transicionesDesde.filter(t =>
    t.roles.includes(rol)
  )
}

/** Devuelve true si el estado es "activo" (no terminal, no rechazado) */
export function esEstadoActivo(estado: EstadoActividad): boolean {
  return !['FINALIZADA', 'RECHAZADA'].includes(estado)
}
