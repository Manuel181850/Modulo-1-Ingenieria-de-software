from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AsignacionCaso, BitacoraAuditoria, Caso
from app.schemas import (
    EstatusTipo,
    IndicadoresPanelResponse,
    PaginacionCasos,
    PaginacionTimeline,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Administración y Consulta"])


@router.get("/timeline", response_model=PaginacionTimeline)
def obtener_timeline(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tipo_evento: Optional[str] = None,
    id_usuario: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(BitacoraAuditoria)

    if tipo_evento:
        query = query.filter(BitacoraAuditoria.tipo_evento == tipo_evento)
    if id_usuario:
        query = query.filter(BitacoraAuditoria.id_usuario == id_usuario)

    total = query.count()
    offset = (page - 1) * limit
    eventos = (
        query.order_by(BitacoraAuditoria.fecha_evento.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return PaginacionTimeline(total=total, page=page, limit=limit, data=eventos)


@router.get("/consulta-general", response_model=PaginacionCasos)
def consulta_general(
    q: Optional[str] = Query(None, min_length=1, description="Texto o folio a buscar"),
    estatus: Optional[EstatusTipo] = None,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Caso)

    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Caso.numero_caso.ilike(patron),
                Caso.titulo.ilike(patron),
                Caso.descripcion.ilike(patron),
                Caso.entidad_afectada.ilike(patron),
                Caso.categoria_delito.ilike(patron),
            )
        )
    if estatus:
        query = query.filter(Caso.estatus == estatus)
    if fecha_inicio:
        query = query.filter(Caso.fecha_apertura >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Caso.fecha_apertura <= fecha_fin)

    total = query.count()
    offset = (page - 1) * limit
    resultados = (
        query.order_by(Caso.fecha_apertura.desc()).offset(offset).limit(limit).all()
    )

    return PaginacionCasos(total=total, page=page, limit=limit, data=resultados)


@router.get("/indicadores", response_model=IndicadoresPanelResponse)
def obtener_indicadores(db: Session = Depends(get_db)):
    total_casos = db.query(func.count(Caso.id_caso)).scalar() or 0

    conteos = (
        db.query(Caso.estatus, func.count(Caso.id_caso))
        .group_by(Caso.estatus)
        .all()
    )
    por_estatus = {estatus: cantidad for estatus, cantidad in conteos}

    subquery_asignados = (
        db.query(AsignacionCaso.id_caso)
        .filter(AsignacionCaso.activo.is_(True))
        .distinct()
    )
    casos_sin_asignar = (
        db.query(func.count(Caso.id_caso))
        .filter(
            Caso.estatus != "CERRADO",
            ~Caso.id_caso.in_(subquery_asignados),
        )
        .scalar()
        or 0
    )

    return IndicadoresPanelResponse(
        total_casos=total_casos,
        por_estatus=por_estatus,
        casos_sin_asignar=casos_sin_asignar,
    )