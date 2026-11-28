export const PAGE_SIZE = 4;

export const NAVIGATION_TABS = [
  { id: 'panel-casos', label: '1. Panel de Casos' },
  { id: 'alta-edicion', label: '2. Alta / Edición & Estados' },
  { id: 'gestion-personal', label: '3. Gestión de Personal' },
  { id: 'consulta-auditoria', label: '4. Consulta Full-Text & Auditoría' },
  { id: 'alta-usuarios', label: '5. Alta de Usuarios' },
];

export const PRIORIDADES = [
  { value: 'CRITICA', label: 'CRÍTICA' },
  { value: 'ALTA', label: 'ALTA' },
  { value: 'MEDIA', label: 'MEDIA' },
  { value: 'BAJA', label: 'BAJA' },
];

export const ESTATUS_LIST = [
  { value: 'ABIERTO', label: 'ABIERTO' },
  { value: 'EN INVESTIGACION', label: 'EN INVESTIGACIÓN' },
  { value: 'EN PAUSA', label: 'EN PAUSA' },
  { value: 'CERRADO', label: 'CERRADO' },
];

export const ESTATUS_STATE_MACHINE_OPTIONS = [
  { value: 'ABIERTO', label: 'ABIERTO (Recepción y Filtro Inicial)' },
  {
    value: 'EN INVESTIGACION',
    label: 'EN INVESTIGACION (Análisis Forense Activo)',
  },
  {
    value: 'EN PAUSA',
    label: 'EN PAUSA (Espera de Autorización o Logs)',
  },
  {
    value: 'CERRADO',
    label: 'CERRADO (Conclusión y Dictamen Técnico)',
  },
];

export const PRIORITY_BADGE_STYLES = {
  BAJA: 'border bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MEDIA: 'border bg-amber-500/10 text-amber-400 border-amber-500/30',
  ALTA: 'border bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITICA: 'border bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export const PRIORITY_LABELS = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRÍTICA',
};

export const STATUS_BADGE_STYLES = {
  ABIERTO: 'bg-emerald-500/10 text-emerald-400',
  'EN INVESTIGACION': 'bg-sky-500/10 text-sky-400',
  'EN PAUSA': 'bg-amber-500/10 text-amber-400',
  CERRADO: 'bg-slate-700/40 text-slate-300',
};

export const STATUS_LABELS = {
  ABIERTO: 'ABIERTO',
  'EN INVESTIGACION': 'EN INVESTIGACIÓN',
  'EN PAUSA': 'EN PAUSA',
  CERRADO: 'CERRADO',
};

export const ROLES_OPERATIVOS_OPTIONS = [
  {
    value: 'INVESTIGADOR',
    label: 'INVESTIGADOR (Análisis Forense y Modificación)',
  },
  {
    value: 'CAPTURISTA',
    label: 'CAPTURISTA (Registro y Cadena de Custodia)',
  },
  {
    value: 'ADMINISTRADOR',
    label: 'ADMINISTRADOR (Control Central y Auditoría)',
  },
];

export const ROLE_DEFAULT_AREAS = {
  INVESTIGADOR: 'Análisis Forense y Modificación',
  CAPTURISTA: 'Registro y Cadena de Custodia',
  ADMINISTRADOR: 'Control Central y Auditoría',
};

export const INITIAL_USUARIOS = [
  {
    id_usuario: 2,
    nombre_completo: 'Dr. Roberto Mendoza',
    nombre_corto: 'Dr. Mendoza',
    correo: 'roberto.mendoza@upslp.edu.mx',
    rol: 'INVESTIGADOR',
    area: 'Carga de Investigación Forense Avanzada',
    activo: true,
  },
  {
    id_usuario: 3,
    nombre_completo: 'Mtra. Patricia Silva',
    nombre_corto: 'Mtra. Silva',
    correo: 'patricia.silva@upslp.edu.mx',
    rol: 'INVESTIGADOR',
    area: 'Auditoría de Vulnerabilidades Web',
    activo: true,
  },
  {
    id_usuario: 4,
    nombre_completo: 'Ing. Fernando Estrada',
    nombre_corto: 'Ing. Estrada',
    correo: 'fernando.estrada@upslp.edu.mx',
    rol: 'CAPTURISTA',
    area: 'Cadena de Custodia',
    activo: true,
  },
  {
    id_usuario: 5,
    nombre_completo: 'Lic. Tania Juárez',
    nombre_corto: 'Lic. Juárez',
    correo: 'tania.juarez@upslp.edu.mx',
    rol: 'CAPTURISTA',
    area: 'Documentación de Expedientes',
    activo: true,
  },
  {
    id_usuario: 1,
    nombre_completo: 'Ing. Carlos López',
    nombre_corto: 'Ing. López',
    correo: 'carlos.lopez@upslp.edu.mx',
    rol: 'ADMINISTRADOR',
    area: 'Dirección Operativa UDINT',
    activo: true,
  },
];

export const INITIAL_CASOS = [
  {
    id_caso: 1,
    numero_caso: 'UDINT-2026-0001',
    titulo: 'Fuga de reactivos de examen en servidor central',
    descripcion:
      'Filtración persistente mediante IPs externas simulando accesos legítimos de docentes.',
    entidad_afectada: 'Servidor Central de Evaluaciones',
    categoria_delito: 'Ciberespionaje',
    prioridad: 'CRITICA',
    estatus: 'EN INVESTIGACION',
    fecha_apertura: '2026-11-10T14:30:00Z',
    fecha_cierre: null,
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-14T09:15:00Z',
    evidencias_count: 14,
    direccion_ip: '192.168.45.10',
    correo_relacionado: 'auditoria.eval@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 2, rol_en_caso: 'INVESTIGADOR', activo: true },
      { id_usuario: 4, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 101,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Apertura inicial del caso por alerta SIEM',
        fecha_cambio: '2026-11-10T14:30:00Z',
        id_usuario_modifico: 1,
      },
      {
        id_historial: 102,
        estatus_anterior: 'ABIERTO',
        estatus_nuevo: 'EN INVESTIGACION',
        motivo_cambio:
          'Asignado a equipo forense para rastreo de IPs externas',
        fecha_cambio: '2026-11-11T08:45:00Z',
        id_usuario_modifico: 2,
      },
    ],
  },
  {
    id_caso: 2,
    numero_caso: 'UDINT-2026-0002',
    titulo: 'Acceso no autorizado a bitácoras de calificaciones',
    descripcion:
      'Modificación anómala detectada en el módulo de control escolar desde rangos IP sospechosos.',
    entidad_afectada: 'Módulo de Control Escolar',
    categoria_delito: 'Suplantación de Identidad',
    prioridad: 'ALTA',
    estatus: 'ABIERTO',
    fecha_apertura: '2026-11-11T10:15:00Z',
    fecha_cierre: null,
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-12T16:20:00Z',
    evidencias_count: 8,
    direccion_ip: '10.0.12.84',
    correo_relacionado: 'control.escolar@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 3, rol_en_caso: 'INVESTIGADOR', activo: true },
      { id_usuario: 5, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 103,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Reporte de anomalía en registros de calificación',
        fecha_cambio: '2026-11-11T10:15:00Z',
        id_usuario_modifico: 1,
      },
    ],
  },
  {
    id_caso: 3,
    numero_caso: 'UDINT-2026-0003',
    titulo: 'Ataque DoS intermitente a plataforma virtual',
    descripcion:
      'Peticiones masivas distribuidas dirigidas al nodo principal de autenticación estudiantil.',
    entidad_afectada: 'Plataforma Virtual Académica',
    categoria_delito: 'Sabotaje Digital',
    prioridad: 'MEDIA',
    estatus: 'EN PAUSA',
    fecha_apertura: '2026-11-12T07:50:00Z',
    fecha_cierre: null,
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-15T12:10:00Z',
    evidencias_count: 22,
    direccion_ip: '172.16.254.1',
    correo_relacionado: 'infraestructura@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 2, rol_en_caso: 'INVESTIGADOR', activo: true },
      { id_usuario: 5, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 104,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Caída intermitente reportada en portal virtual',
        fecha_cambio: '2026-11-12T07:50:00Z',
        id_usuario_modifico: 1,
      },
      {
        id_historial: 105,
        estatus_anterior: 'ABIERTO',
        estatus_nuevo: 'EN PAUSA',
        motivo_cambio: 'En espera de bitácoras completas del proveedor ISP',
        fecha_cambio: '2026-11-15T12:10:00Z',
        id_usuario_modifico: 2,
      },
    ],
  },
  {
    id_caso: 4,
    numero_caso: 'UDINT-2026-0004',
    titulo: 'Minería latente en laboratorios de cómputo B-4',
    descripcion:
      'Procesos en segundo plano ejecutándose fuera del horario de clases habitual.',
    entidad_afectada: 'Laboratorios de Cómputo B-4',
    categoria_delito: 'Uso Indebido de Recursos',
    prioridad: 'BAJA',
    estatus: 'CERRADO',
    fecha_apertura: '2026-11-08T19:00:00Z',
    fecha_cierre: '2026-11-13T17:40:00Z',
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-13T17:40:00Z',
    evidencias_count: 4,
    direccion_ip: '192.168.1.15',
    correo_relacionado: 'labs.b4@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 4, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 106,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Detección de uso sostenido de CPU en horario nocturno',
        fecha_cambio: '2026-11-08T19:00:00Z',
        id_usuario_modifico: 1,
      },
      {
        id_historial: 107,
        estatus_anterior: 'ABIERTO',
        estatus_nuevo: 'CERRADO',
        motivo_cambio: 'Equipos saneados y políticas de ejecución restringidas',
        fecha_cambio: '2026-11-13T17:40:00Z',
        id_usuario_modifico: 1,
      },
    ],
  },
  {
    id_caso: 5,
    numero_caso: 'UDINT-2026-0005',
    titulo: 'Campaña masiva de Phishing dirigida a directivos',
    descripcion:
      'Clonación exacta del portal institucional de nómina para robo de credenciales activas.',
    entidad_afectada: 'Dirección y Portal de Nómina',
    categoria_delito: 'Extorsión / Phishing',
    prioridad: 'CRITICA',
    estatus: 'ABIERTO',
    fecha_apertura: '2026-11-14T11:20:00Z',
    fecha_cierre: null,
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-16T09:05:00Z',
    evidencias_count: 19,
    direccion_ip: '185.220.101.42',
    correo_relacionado: 'soporte.portal@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 3, rol_en_caso: 'INVESTIGADOR', activo: true },
      { id_usuario: 4, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 108,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Alerta comunitaria por correo fraudulento masivo',
        fecha_cambio: '2026-11-14T11:20:00Z',
        id_usuario_modifico: 1,
      },
    ],
  },
  {
    id_caso: 6,
    numero_caso: 'UDINT-2026-0006',
    titulo: 'Exfiltración de base de datos de egresados',
    descripcion:
      'Descarga inusual de registros históricos empaquetados en un archivo comprimido sin cifrar.',
    entidad_afectada: 'Repositorio de Registros Históricos',
    categoria_delito: 'Fuga de Información',
    prioridad: 'MEDIA',
    estatus: 'EN INVESTIGACION',
    fecha_apertura: '2026-11-16T08:10:00Z',
    fecha_cierre: null,
    id_usuario_creador: 1,
    fecha_ultima_modificacion: '2026-11-16T08:10:00Z',
    evidencias_count: 11,
    direccion_ip: '45.155.205.91',
    correo_relacionado: 'redes@upslp.edu.mx',
    asignaciones: [
      { id_usuario: 2, rol_en_caso: 'INVESTIGADOR', activo: true },
      { id_usuario: 5, rol_en_caso: 'CAPTURISTA', activo: true },
    ],
    historial_estatus: [
      {
        id_historial: 109,
        estatus_anterior: null,
        estatus_nuevo: 'ABIERTO',
        motivo_cambio: 'Detección de transferencia masiva en horario nocturno',
        fecha_cambio: '2026-11-16T08:10:00Z',
        id_usuario_modifico: 1,
      },
      {
        id_historial: 110,
        estatus_anterior: 'ABIERTO',
        estatus_nuevo: 'EN INVESTIGACION',
        motivo_cambio: 'Recolección OSINT y análisis forense de logs de red',
        fecha_cambio: '2026-11-16T10:30:00Z',
        id_usuario_modifico: 2,
      },
    ],
  },
];

export const INITIAL_AUDITORIA = [
  {
    id_auditoria: 101,
    codigo_bitacora: 'BIT-101',
    id_usuario: 1,
    tipo_evento: 'CAMBIO_ESTATUS',
    tabla_afectada: 'casos',
    id_registro: 1,
    numero_caso: 'UDINT-2026-0001',
    direccion_ip: '10.14.0.5',
    fecha_evento: '2026-11-26 16:10:00',
    accion: 'Cambio de Estatus: ABIERTO -> EN INVESTIGACION',
    justificacion:
      'Se ratificó la IP de origen y se turnó formalmente al cuerpo forense institucional.',
    usuario_responsable: 'admin_central@upslp.edu.mx',
  },
  {
    id_auditoria: 102,
    codigo_bitacora: 'BIT-102',
    id_usuario: 1,
    tipo_evento: 'CAMBIO_ESTATUS',
    tabla_afectada: 'casos',
    id_registro: 3,
    numero_caso: 'UDINT-2026-0003',
    direccion_ip: '10.14.2.18',
    fecha_evento: '2026-11-26 15:32:00',
    accion: 'Cambio de Estatus: EN INVESTIGACION -> EN PAUSA',
    justificacion:
      'En espera de que el proveedor de hosting proporcione los logs completos del firewall web.',
    usuario_responsable: 'admin_central@upslp.edu.mx',
  },
  {
    id_auditoria: 103,
    codigo_bitacora: 'BIT-103',
    id_usuario: 1,
    tipo_evento: 'ASIGNACION_CASO',
    tabla_afectada: 'asignaciones_caso',
    id_registro: 1,
    numero_caso: 'UDINT-2026-0001',
    direccion_ip: '10.14.0.5',
    fecha_evento: '2026-11-25 11:40:00',
    accion: 'Asignación de Personal: Dr. Roberto Mendoza (INVESTIGADOR)',
    justificacion:
      'Asignación inicial del investigador titular y capturista auxiliar para cadena de custodia.',
    usuario_responsable: 'admin_central@upslp.edu.mx',
  },
];

export function formatEmailDomainTag(correo) {
  const atIndex = (correo || '').indexOf('@');
  return atIndex >= 0 ? correo.slice(atIndex) : '@upslp.edu.mx';
}

export function formatCurrentTimestamp() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function getShortUserName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) {
    return fullName.trim();
  }
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
