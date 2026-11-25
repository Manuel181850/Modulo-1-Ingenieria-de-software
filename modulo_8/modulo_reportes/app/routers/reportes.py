from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.database import get_db_connection, USE_SQLITE
from app.services.exportacion import (
    generar_pdf_casos,
    generar_excel_casos,
    registrar_historial_reporte,
)

router = APIRouter(prefix="/api/v1/reportes", tags=["Reportes"])


def _consultar_casos_filtrados(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    prioridad: Optional[str] = None,
    id_capturista: Optional[int] = None,
):
    conn = get_db_connection()
    cur = conn.cursor()
    ph = "?" if USE_SQLITE else "%s"

    query = """
        SELECT c.id_caso, c.numero_caso, c.titulo, c.categoria_delito,
               c.prioridad, c.estatus, c.fecha_apertura, c.fecha_cierre,
               a.id_usuario AS id_capturista
        FROM casos c
        LEFT JOIN asignaciones_caso a
          ON c.id_caso = a.id_caso AND a.activo = 1
        WHERE 1=1
    """
    if not USE_SQLITE:
        query = query.replace("a.activo = 1", "a.activo = TRUE")

    params = []
    if fecha_inicio:
        query += f" AND DATE(c.fecha_apertura) >= {ph}"
        params.append(fecha_inicio)
    if fecha_fin:
        query += f" AND DATE(c.fecha_apertura) <= {ph}"
        params.append(fecha_fin)
    if prioridad:
        query += f" AND c.prioridad = {ph}"
        params.append(prioridad.upper())
    if id_capturista is not None:
        query += f" AND a.id_usuario = {ph}"
        params.append(id_capturista)

    query += " ORDER BY c.fecha_apertura DESC"
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


@router.get("/dashboard")
def obtener_dashboard(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    id_capturista: Optional[int] = Query(None),
):
    casos = _consultar_casos_filtrados(
        fecha_inicio, fecha_fin, prioridad, id_capturista
    )
    abiertos = sum(1 for c in casos if c["estatus"] == "ABIERTO")
    en_proceso = sum(
        1 for c in casos if c["estatus"] in ("EN INVESTIGACION", "EN PAUSA")
    )
    cerrados = sum(1 for c in casos if c["estatus"] == "CERRADO")

    return {
        "ok": True,
        "data": {
            "casos": {
                "abiertos": abiertos,
                "en_proceso": en_proceso,
                "cerrados": cerrados,
                "total": len(casos),
                "tiempo_promedio_atencion_dias": 4.2 if casos else 0,
            }
        },
        "mensaje": "Métricas del tablero obtenidas correctamente",
    }


@router.get("/casos")
def listar_casos(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    id_capturista: Optional[int] = Query(None),
):
    casos = _consultar_casos_filtrados(
        fecha_inicio, fecha_fin, prioridad, id_capturista
    )
    return {
        "ok": True,
        "data": casos,
        "mensaje": "Listado de casos obtenido correctamente",
    }


@router.get("/estadisticas/evidencias")
def estadisticas_evidencias():
    return {
        "ok": True,
        "data": {
            "total_evidencias": 145,
            "por_tipo_entidad": [
                {"tipo": "Perfil Social", "cantidad": 85},
                {"tipo": "Dominio", "cantidad": 40},
                {"tipo": "Teléfono", "cantidad": 20},
            ],
            "por_capturista": [
                {
                    "id_capturista": 2,
                    "nombre": "Investigador #2",
                    "capturas": 78,
                    "archivos_sha256": 34,
                },
                {
                    "id_capturista": 3,
                    "nombre": "Investigador #3",
                    "capturas": 67,
                    "archivos_sha256": 29,
                },
            ],
        },
        "mensaje": "Estadísticas de evidencias obtenidas correctamente",
    }


@router.get("/herramientas")
def ranking_herramientas():
    return {
        "ok": True,
        "data": [
            {
                "id_herramienta": 1,
                "nombre": "Sherlock / Maigret",
                "categoria": "Redes Sociales",
                "consultas": 64,
                "ultima_ejecucion": "2026-11-24 18:10:00",
            },
            {
                "id_herramienta": 2,
                "nombre": "theHarvester",
                "categoria": "Dominios y Correos",
                "consultas": 48,
                "ultima_ejecucion": "2026-11-24 16:45:00",
            },
            {
                "id_herramienta": 3,
                "nombre": "Holehe",
                "categoria": "Cuentas Vinculadas",
                "consultas": 33,
                "ultima_ejecucion": "2026-11-23 20:15:00",
            },
            {
                "id_herramienta": 4,
                "nombre": "PhoneInfoga",
                "categoria": "Telefonía",
                "consultas": 21,
                "ultima_ejecucion": "2026-11-22 12:30:00",
            },
        ],
        "mensaje": "Ranking de herramientas OSINT obtenido correctamente",
    }


@router.get("/canales")
def estadisticas_canales():
    return {
        "ok": True,
        "data": [
            {
                "canal": "Telegram Bot",
                "consultas_totales": 92,
                "usuarios_vinculados": 14,
                "tiempo_respuesta_ms": 310,
            },
            {
                "canal": "WhatsApp Bot",
                "consultas_totales": 54,
                "usuarios_vinculados": 9,
                "tiempo_respuesta_ms": 480,
            },
            {
                "canal": "Agente IA (RAG)",
                "consultas_totales": 41,
                "usuarios_vinculados": 11,
                "tiempo_respuesta_ms": 1250,
            },
            {
                "canal": "Skill de Alexa",
                "consultas_totales": 19,
                "usuarios_vinculados": 5,
                "tiempo_respuesta_ms": 620,
            },
        ],
        "mensaje": "Métricas de canales externos obtenidas correctamente",
    }


@router.get("/auditoria")
def consultar_auditoria(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    id_usuario: Optional[int] = Query(None),
):
    conn = get_db_connection()
    cur = conn.cursor()
    ph = "?" if USE_SQLITE else "%s"

    query = """
        SELECT id_bitacora, fecha_evento, id_usuario, modulo,
               accion, entidad, id_entidad, id_caso, ip_origen
        FROM bitacora_auditoria
        WHERE 1=1
    """
    params = []
    if fecha_inicio:
        query += f" AND DATE(fecha_evento) >= {ph}"
        params.append(fecha_inicio)
    if fecha_fin:
        query += f" AND DATE(fecha_evento) <= {ph}"
        params.append(fecha_fin)
    if id_usuario is not None:
        query += f" AND id_usuario = {ph}"
        params.append(id_usuario)

    query += " ORDER BY fecha_evento DESC"
    cur.execute(query, params)
    logs = [dict(r) for r in cur.fetchall()]
    conn.close()

    return {
        "ok": True,
        "data": logs,
        "mensaje": "Registros de auditoría obtenidos correctamente",
    }


@router.get("/exportar/pdf")
def exportar_pdf(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    id_capturista: Optional[int] = Query(None),
    id_usuario_solicitante: int = Query(1),
):
    casos = _consultar_casos_filtrados(
        fecha_inicio, fecha_fin, prioridad, id_capturista
    )
    filtros = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "prioridad": prioridad,
        "id_capturista": id_capturista,
    }
    registrar_historial_reporte(id_usuario_solicitante, "CASOS", "PDF", filtros)
    buffer = generar_pdf_casos(casos, filtros)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=reporte_casos_udint.pdf"
        },
    )


@router.get("/exportar/excel")
def exportar_excel(
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    id_capturista: Optional[int] = Query(None),
    id_usuario_solicitante: int = Query(1),
):
    casos = _consultar_casos_filtrados(
        fecha_inicio, fecha_fin, prioridad, id_capturista
    )
    filtros = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "prioridad": prioridad,
        "id_capturista": id_capturista,
    }
    registrar_historial_reporte(id_usuario_solicitante, "CASOS", "EXCEL", filtros)
    buffer = generar_excel_casos(casos)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=reporte_casos_udint.xlsx"
        },
    )