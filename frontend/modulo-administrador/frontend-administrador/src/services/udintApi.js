const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 4000;

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, detail = '', isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetworkError = isNetworkError;
  }
}

function getAuthToken() {
  if (import.meta.env.VITE_API_TOKEN) {
    return import.meta.env.VITE_API_TOKEN;
  }
  try {
    return window.localStorage.getItem('udint_token') || '';
  } catch {
    return '';
  }
}

function unwrapResponseData(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    payload.ok === true &&
    'data' in payload &&
    !('total' in payload)
  ) {
    return payload.data;
  }
  return payload;
}

async function apiRequest(path, { method = 'GET', query, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const parsedPayload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const detail =
        parsedPayload?.detail ||
        parsedPayload?.error ||
        parsedPayload?.mensaje ||
        `Error HTTP ${response.status}`;
      throw new ApiError(detail, {
        status: response.status,
        detail,
        isNetworkError: false,
      });
    }

    return unwrapResponseData(parsedPayload);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('No se pudo conectar con el servidor backend.', {
      status: 0,
      detail: error?.message || 'Error de red',
      isNetworkError: true,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// GET /health
export function checkBackendHealth() {
  return apiRequest('/health', { timeoutMs: 2500 });
}

// GET /api/v1/casos
export function listarCasos({
  page = 1,
  limit = 100,
  estatus,
  prioridad,
  categoria_delito,
  id_usuario,
} = {}) {
  return apiRequest('/api/v1/casos', {
    query: { page, limit, estatus, prioridad, categoria_delito, id_usuario },
  });
}

// GET /api/v1/casos/{numero_caso}
export function obtenerCasoPorFolio(numeroCaso) {
  return apiRequest(`/api/v1/casos/${encodeURIComponent(numeroCaso)}`);
}

// POST /api/v1/casos
export function crearCaso(payload) {
  return apiRequest('/api/v1/casos', {
    method: 'POST',
    body: {
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      entidad_afectada: payload.entidad_afectada || null,
      categoria_delito: payload.categoria_delito,
      prioridad: payload.prioridad,
    },
  });
}

// PATCH /api/v1/casos/{id_caso}/estatus
export function actualizarEstatusCaso(idCaso, { estatus_nuevo, motivo_cambio }) {
  return apiRequest(`/api/v1/casos/${idCaso}/estatus`, {
    method: 'PATCH',
    body: { estatus_nuevo, motivo_cambio },
  });
}

// POST /api/v1/casos/{id_caso}/asignaciones
export function asignarUsuarioCaso(idCaso, { id_usuario, rol_en_caso }) {
  return apiRequest(`/api/v1/casos/${idCaso}/asignaciones`, {
    method: 'POST',
    body: { id_usuario, rol_en_caso },
  });
}

// DELETE /api/v1/casos/{id_caso}/asignaciones/{id_usuario}
export function desasignarUsuarioCaso(idCaso, idUsuario) {
  return apiRequest(`/api/v1/casos/${idCaso}/asignaciones/${idUsuario}`, {
    method: 'DELETE',
  });
}

// GET /api/v1/admin/timeline
export function obtenerTimeline({
  page = 1,
  limit = 50,
  tipo_evento,
  id_usuario,
} = {}) {
  return apiRequest('/api/v1/admin/timeline', {
    query: { page, limit, tipo_evento, id_usuario },
  });
}

// GET /api/v1/admin/consulta-general
export function consultaGeneral({
  q,
  estatus,
  fecha_inicio,
  fecha_fin,
  page = 1,
  limit = 100,
} = {}) {
  return apiRequest('/api/v1/admin/consulta-general', {
    query: { q, estatus, fecha_inicio, fecha_fin, page, limit },
  });
}

// GET /api/v1/admin/indicadores
export function obtenerIndicadores() {
  return apiRequest('/api/v1/admin/indicadores');
}

export function formatIsoToLogTimestamp(isoString) {
  if (!isoString) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(isoString)) {
    return isoString;
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  const pad = (num) => String(num).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

export function normalizeBackendCaso(casoApi, existingCaso = null) {
  const rawAsignaciones =
    casoApi.asignaciones || casoApi.asignados || existingCaso?.asignaciones || [];
  const asignaciones = rawAsignaciones.map((asig) => ({
    ...asig,
    activo: asig.activo ?? true,
  }));

  return {
    id_caso: casoApi.id_caso,
    numero_caso: casoApi.numero_caso,
    titulo: casoApi.titulo,
    descripcion:
      casoApi.descripcion ?? existingCaso?.descripcion ?? 'Sin descripción registrada.',
    entidad_afectada:
      casoApi.entidad_afectada ?? existingCaso?.entidad_afectada ?? null,
    categoria_delito: casoApi.categoria_delito,
    prioridad: casoApi.prioridad,
    estatus: casoApi.estatus,
    fecha_apertura: casoApi.fecha_apertura,
    fecha_cierre: casoApi.fecha_cierre ?? null,
    id_usuario_creador: casoApi.id_usuario_creador ?? 1,
    fecha_ultima_modificacion:
      casoApi.fecha_ultima_modificacion ?? casoApi.fecha_apertura,
    evidencias_count:
      casoApi.evidencias_count ?? existingCaso?.evidencias_count ?? 0,
    direccion_ip: casoApi.direccion_ip ?? existingCaso?.direccion_ip ?? '10.14.0.5',
    correo_relacionado:
      casoApi.correo_relacionado ??
      existingCaso?.correo_relacionado ??
      'udint@upslp.edu.mx',
    asignaciones,
    historial_estatus:
      casoApi.historial_estatus ?? existingCaso?.historial_estatus ?? [],
  };
}

export function normalizeBackendTimelineEvent(
  eventoApi,
  casosById,
  usuariosMap
) {
  const folioMatch = (eventoApi.descripcion || '').match(/UDINT-\d{4}-\d{4}/);
  const linkedCaso =
    eventoApi.tabla_afectada === 'casos' && eventoApi.id_registro
      ? casosById.get(eventoApi.id_registro)
      : null;

  const numeroCaso =
    folioMatch?.[0] ||
    linkedCaso?.numero_caso ||
    (eventoApi.tabla_afectada || 'SISTEMA').toUpperCase();

  const responsableUser = usuariosMap.get(eventoApi.id_usuario);
  const usuarioResponsable =
    responsableUser?.correo || 'admin_central@upslp.edu.mx';

  const latestHistorialMatch = linkedCaso?.historial_estatus?.find(
    (item) => item.motivo_cambio
  );

  return {
    id_auditoria: eventoApi.id_auditoria,
    codigo_bitacora: `BIT-${eventoApi.id_auditoria}`,
    id_usuario: eventoApi.id_usuario,
    tipo_evento: eventoApi.tipo_evento,
    tabla_afectada: eventoApi.tabla_afectada,
    id_registro: eventoApi.id_registro,
    numero_caso: numeroCaso,
    direccion_ip: eventoApi.direccion_ip || '10.14.0.5',
    fecha_evento: formatIsoToLogTimestamp(eventoApi.fecha_evento),
    accion: eventoApi.descripcion || eventoApi.tipo_evento,
    justificacion:
      latestHistorialMatch?.motivo_cambio ||
      eventoApi.descripcion ||
      'Evento registrado en bitácora del servidor.',
    usuario_responsable: usuarioResponsable,
  };
}
