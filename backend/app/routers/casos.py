from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AsignacionCaso, Caso, HistorialEstatusCaso
from app.schemas import (
    AsignacionCreate,
    AsignacionResponse,
    CasoCreate,
    CasoDetalle,
    CasoUpdateEstatus,
    EstatusTipo,
    PaginacionCasos,
    PrioridadTipo,
)

router = APIRouter(prefix="/api/v1/casos", tags=["Casos"])


def get_current_user_id() -> int:
    """Stub temporal mientras Equipo 2 entrega autenticación JWT."""
    return 1


def _generar_siguiente_folio(db: Session) -> str:
    anio = datetime.now(timezone.utc).year
    ultimo_caso = db.query(Caso).order_by(Caso.id_caso.desc()).first()
    siguiente_num = (ultimo_caso.id_caso + 1) if ultimo_caso else 1
    return f"UDINT-{anio}-{siguiente_num:04d}"


@router.post("", response_model=CasoDetalle, status_code=status.HTTP_201_CREATED)
def crear_caso(
    payload: CasoCreate,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(get_current_user_id),
):
    folio = _generar_siguiente_folio(db)

    nuevo_caso = Caso(
        numero_caso=folio,
        titulo=payload.titulo,
        descripcion=payload.descripcion,
        entidad_afectada=payload.entidad_afectada,
        categoria_delito=payload.categoria_delito,
        prioridad=payload.prioridad,
        estatus="ABIERTO",
        id_usuario_creador=id_usuario,
    )
    db.add(nuevo_caso)
    db.flush()

    historial_inicial = HistorialEstatusCaso(
        id_caso=nuevo_caso.id_caso,
        estatus_anterior=None,
        estatus_nuevo="ABIERTO",
        motivo_cambio="Apertura inicial del caso",
        id_usuario_modifico=id_usuario,
    )
    db.add(historial_inicial)
    db.commit()
    db.refresh(nuevo_caso)
    return nuevo_caso


@router.get("", response_model=PaginacionCasos)
def listar_casos(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    estatus: Optional[EstatusTipo] = None,
    prioridad: Optional[PrioridadTipo] = None,
    categoria_delito: Optional[str] = None,
    id_usuario: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Caso)

    if estatus:
        query = query.filter(Caso.estatus == estatus)
    if prioridad:
        query = query.filter(Caso.prioridad == prioridad)
    if categoria_delito:
        query = query.filter(Caso.categoria_delito.ilike(f"%{categoria_delito}%"))
    if id_usuario:
        query = query.join(AsignacionCaso).filter(
            AsignacionCaso.id_usuario == id_usuario,
            AsignacionCaso.activo.is_(True),
        )

    total = query.count()
    offset = (page - 1) * limit
    casos = (
        query.order_by(Caso.fecha_apertura.desc()).offset(offset).limit(limit).all()
    )

    return PaginacionCasos(total=total, page=page, limit=limit, data=casos)


@router.get("/{numero_caso}", response_model=CasoDetalle)
def obtener_caso_por_folio(numero_caso: str, db: Session = Depends(get_db)):
    caso = db.query(Caso).filter(Caso.numero_caso == numero_caso).first()
    if not caso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el caso con folio {numero_caso}",
        )
    return caso


@router.patch("/{id_caso}/estatus", response_model=CasoDetalle)
def actualizar_estatus_caso(
    id_caso: int,
    payload: CasoUpdateEstatus,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(get_current_user_id),
):
    caso = db.query(Caso).filter(Caso.id_caso == id_caso).first()
    if not caso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso no encontrado",
        )

    if caso.estatus == payload.estatus_nuevo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El caso ya se encuentra en estatus {payload.estatus_nuevo}",
        )

    estatus_anterior = caso.estatus
    caso.estatus = payload.estatus_nuevo
    if payload.estatus_nuevo == "CERRADO":
        caso.fecha_cierre = datetime.now(timezone.utc)
    else:
        caso.fecha_cierre = None

    registro_historial = HistorialEstatusCaso(
        id_caso=caso.id_caso,
        estatus_anterior=estatus_anterior,
        estatus_nuevo=payload.estatus_nuevo,
        motivo_cambio=payload.motivo_cambio,
        id_usuario_modifico=id_usuario,
    )
    db.add(registro_historial)
    db.commit()
    db.refresh(caso)
    return caso


@router.post(
    "/{id_caso}/asignaciones",
    response_model=AsignacionResponse,
    status_code=status.HTTP_201_CREATED,
)
def asignar_usuario_caso(
    id_caso: int,
    payload: AsignacionCreate,
    db: Session = Depends(get_db),
    id_usuario_asigno: int = Depends(get_current_user_id),
):
    caso = db.query(Caso).filter(Caso.id_caso == id_caso).first()
    if not caso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caso no encontrado",
        )

    existente = (
        db.query(AsignacionCaso)
        .filter(
            AsignacionCaso.id_caso == id_caso,
            AsignacionCaso.id_usuario == payload.id_usuario,
            AsignacionCaso.rol_en_caso == payload.rol_en_caso,
            AsignacionCaso.activo.is_(True),
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene una asignación activa con ese rol en este caso",
        )

    nueva_asignacion = AsignacionCaso(
        id_caso=id_caso,
        id_usuario=payload.id_usuario,
        rol_en_caso=payload.rol_en_caso,
        id_usuario_asigno=id_usuario_asigno,
        activo=True,
    )
    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)
    return nueva_asignacion


@router.delete(
    "/{id_caso}/asignaciones/{id_usuario}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def desasignar_usuario_caso(
    id_caso: int,
    id_usuario: int,
    db: Session = Depends(get_db),
):
    asignaciones = (
        db.query(AsignacionCaso)
        .filter(
            AsignacionCaso.id_caso == id_caso,
            AsignacionCaso.id_usuario == id_usuario,
            AsignacionCaso.activo.is_(True),
        )
        .all()
    )
    if not asignaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una asignación activa para ese usuario en el caso",
        )

    for asig in asignaciones:
        asig.activo = False

    db.commit()
    return None