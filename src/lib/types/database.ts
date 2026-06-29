// src/lib/types/database.ts

export type EstadoActividad =
  | 'CREADA' | 'VALIDADA' | 'RECHAZADA' | 'CAMBIOS_SOLICITADOS'
  | 'ASIGNADA' | 'EN_EJECUCION' | 'EJECUTADA' | 'SUPERVISADA'
  | 'ENTREGADA_CLIENTE' | 'CERRADA' | 'RETRABAJO' | 'FINALIZADA'

export type TipoTrabajo =
  | 'INSTALACION_HIDRONEUMATICO' | 'INSTALACION_PC_FLUJO_VARIABLE'
  | 'MANTENIMIENTO_PREVENTIVO_BOMBAS' | 'MANTENIMIENTO_CORRECTIVO_BOMBAS'
  | 'CORRECTIVO_TABLERO' | 'VISITA_TECNICA'
  | 'INSTALACION_FILTROS_AGUA' | 'MANTENIMIENTO_FILTROS_AGUA'
  | 'LIMPIEZA_DESINFECCION_TANQUES' | 'PLOMERIA'

export type RolUsuario = 'ADMIN' | 'VENTAS' | 'ATC' | 'VALERIO' | 'TECNICO_II' | 'TECNICO_I'

export type TipoEquipo = 'BOMBA' | 'FILTRO' | 'TANQUE' | 'PULMON'

export type RolContacto =
  | 'PRESIDENTE_CONDOMINIO' | 'TESORERO_CONDOMINIO' | 'ADMINISTRADOR_CONDOMINIO'
  | 'PROPIETARIO' | 'CONSERJE' | 'SERVICIOS_GENERALES'
  | 'INFRAESTRUCTURA' | 'CONTRATISTA' | 'OTRO'

export type MotivoRetrabajo = 'MALA_EJECUCION' | 'DESGASTE' | 'MAL_USO_CLIENTE' | 'OTRO'

export type EstadoRetrabajo =
  | 'REPORTADO' | 'VALIDADO' | 'RECHAZADO' | 'ASIGNADO'
  | 'EN_EJECUCION' | 'EJECUTADO' | 'SUPERVISADO'
  | 'ENTREGADO_CLIENTE' | 'CERRADO' | 'FINALIZADO'

// ─── Tablas ────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string
  nombre: string
  rif: string | null
  telefono: string | null
  celular: string | null
  email: string | null
  direccion: string | null
  foto_url: string | null
  location_maps: string | null
  persona_contacto: string | null
  rol_contacto: RolContacto | null
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Equipo {
  id: string
  cliente_id: string
  nombre: string
  tipo: TipoEquipo
  marca: string
  modelo: string | null
  numero_serie: string | null
  foto_url: string | null
  fecha_ultimo_mantenimiento: string | null
  notas: string | null
  activo: boolean
  // Bomba
  voltaje_trabajo: number | null
  amperaje_nominal: number | null
  amperaje_real: number | null
  // Bomba + Pulmón
  presion_trabajo: number | null
  created_at: string
  updated_at: string
}

export interface Tecnico {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
  rol: RolUsuario
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Perfil {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  rol: RolUsuario
  tecnico_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Actividad {
  id_obra: string
  nombre_descripcion: string
  cliente_id: string
  ubicacion: string
  fecha_inicio_estimada: string
  fecha_fin_estimada: string
  fecha_inicio_real: string | null
  fecha_fin_real: string | null
  tipo_trabajo: TipoTrabajo
  tecnico_id: string | null      // Técnico II (responsable principal)
  tecnico_i_id: string | null    // Técnico I (asistente, opcional)
  tiempo_garantia_meses: number
  fecha_venc_garantia: string | null
  herramientas_consumibles: string[] | null
  materiales_adicionales: string[] | null
  estado: EstadoActividad
  motivo_rechazo: string | null
  creado_por: string
  validado_por: string | null
  numero_cotizacion: string | null
  notas_internas: string | null
  dias_estimados: number | null
  horas_estimadas: number | null
  created_at: string
  updated_at: string
}

export interface EstadoTransicion {
  id: string
  id_obra: string
  estado_anterior: EstadoActividad | null
  estado_nuevo: EstadoActividad
  usuario_id: string | null
  motivo: string | null
  duracion_estado_anterior_seg: number | null
  created_at: string
}

export interface Checklist {
  id: string
  id_obra: string
  tipo_trabajo: TipoTrabajo
  tecnico_id: string | null
  estado: 'EN_PROGRESO' | 'COMPLETADO' | 'INCOMPLETO'
  porcentaje_completado: number
  total_items: number
  items_completados: number
  items_obligatorios: number
  items_obligatorios_ok: number
  iniciado_at: string
  completado_at: string | null
  created_at: string
  updated_at: string
}

export interface ItemChecklist {
  id: string
  checklist_id: string
  orden: number
  nombre_item: string
  tipo_respuesta: 'CHECKBOX' | 'NUMERO' | 'FOTO' | 'TEXTO' | 'DROPDOWN'
  opciones_dropdown: string[] | null
  obligatorio: boolean
  respuesta_checkbox: boolean | null
  respuesta_numero: number | null
  respuesta_texto: string | null
  respuesta_dropdown: string | null
  foto_url: string | null
  respondido: boolean
  respondido_at: string | null
  respondido_por: string | null
  created_at: string
}

export interface InformePostVenta {
  id: string
  id_obra: string
  estado: 'GENERADO' | 'ENVIADO' | 'RESPONDIDO' | 'PENDIENTE'
  html_url: string | null
  pdf_url: string | null
  enviado_whatsapp_at: string | null
  enviado_email_at: string | null
  link_encuesta: string | null
  encuesta_respondida: boolean
  generado_por: string | null
  regeneraciones: number
  created_at: string
  updated_at: string
}

export interface EncuestaSatisfaccion {
  id: string
  informe_id: string
  id_obra: string
  calificacion_global: number
  puntualidad: boolean
  profesionalismo: boolean
  calidad_trabajo: boolean
  comunicacion: boolean
  comentarios: string | null
  recomendaria: boolean
  ip_respondedor: string | null
  dispositivo: string | null
  respondido_at: string
}

export interface Retrabajo {
  id: string
  id_obra: string
  motivo: MotivoRetrabajo
  descripcion_problema: string
  quien_reporto: 'CLIENTE' | 'TECNICO_II' | 'SUPERVISOR' | 'ATC'
  fecha_problema: string
  impacto: 'CRITICO' | 'MODERADO' | 'MENOR'
  componente_afectado: string
  cubre_garantia: boolean | null
  estado: EstadoRetrabajo
  tecnico_id: string | null
  solucion_propuesta: string | null
  costo_estimado: number | null
  fecha_inicio_real: string | null
  fecha_fin_real: string | null
  garantia_extendida_hasta: string | null
  satisfaccion_cliente: number | null
  creado_por: string | null
  validado_por: string | null
  motivo_rechazo: string | null
  created_at: string
  updated_at: string
}

// ─── Labels para UI ────────────────────────────────────────────────────────

export const ROL_CONTACTO_LABELS: Record<RolContacto, string> = {
  PRESIDENTE_CONDOMINIO:    'Presidente del condominio',
  TESORERO_CONDOMINIO:      'Tesorero del condominio',
  ADMINISTRADOR_CONDOMINIO: 'Administrador del condominio',
  PROPIETARIO:              'Propietario',
  CONSERJE:                 'Conserje',
  SERVICIOS_GENERALES:      'Equipo de servicios generales',
  INFRAESTRUCTURA:          'Equipo de infraestructura',
  CONTRATISTA:              'Contratista',
  OTRO:                     'Otro',
}

export const TIPO_EQUIPO_LABELS: Record<TipoEquipo, string> = {
  BOMBA:   'Bomba',
  FILTRO:  'Filtro',
  TANQUE:  'Tanque',
  PULMON:  'Pulmón',
}

// ─── Database schema type ──────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      clientes:             { Row: Cliente;   Insert: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;   Update: Partial<Cliente> }
      equipos:              { Row: Equipo;    Insert: Omit<Equipo, 'id' | 'created_at' | 'updated_at'>;    Update: Partial<Equipo> }
      tecnicos:             { Row: Tecnico;   Insert: Omit<Tecnico, 'id' | 'created_at' | 'updated_at'>;   Update: Partial<Tecnico> }
      perfiles:             { Row: Perfil;    Insert: Omit<Perfil, 'created_at' | 'updated_at'>;            Update: Partial<Perfil> }
      actividades:          { Row: Actividad; Insert: Omit<Actividad, 'dias_estimados' | 'horas_estimadas' | 'created_at' | 'updated_at'>; Update: Partial<Actividad> }
      estado_transiciones:  { Row: EstadoTransicion; Insert: Omit<EstadoTransicion, 'id' | 'created_at'>; Update: never }
      checklists:           { Row: Checklist; Insert: Omit<Checklist, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Checklist> }
      items_checklist:      { Row: ItemChecklist; Insert: Omit<ItemChecklist, 'id' | 'created_at'>; Update: Partial<ItemChecklist> }
      informes_post_venta:  { Row: InformePostVenta; Insert: Omit<InformePostVenta, 'id' | 'created_at' | 'updated_at'>; Update: Partial<InformePostVenta> }
      encuestas_satisfaccion: { Row: EncuestaSatisfaccion; Insert: Omit<EncuestaSatisfaccion, 'id'>; Update: never }
      retrabajos:           { Row: Retrabajo; Insert: Omit<Retrabajo, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Retrabajo> }
    }
    Views: {
      actividades_dashboard: { Row: Actividad & { cliente_nombre: string; tecnico_nombre: string; dias_retraso: number; tiene_retrabajo_activo: boolean } }
      kpi_retrabajo_mensual: { Row: { mes: string; total_actividades_cerradas: number; retrabajos_mala_ejecucion: number; porcentaje_retrabajo: number } }
      kpi_satisfaccion_mensual: { Row: { mes: string; total_encuestas: number; promedio_calificacion: number; porcentaje_satisfaccion: number; encuestas_positivas: number; porcentaje_positivas: number } }
    }
    Functions: {
      finalizar_actividades_garantia_vencida: { Args: Record<never, never>; Returns: void }
      mi_rol: { Args: Record<never, never>; Returns: RolUsuario }
    }
  }
}
