from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

PrioridadTipo = Literal["BAJA", "MEDIA", "ALTA", "CRITICA"]
EstatusTipo = Literal["ABIERTO", "EN INVESTIGACION", "EN PAUSA", "CERRADO"]
RolCasoTipo = Literal["INVESTIGADOR", "CAPTURISTA"]


class CasoCreate(BaseModel):
    titulo: str = Field(..., min_length=5, max_length=150)
    descripcion: str = Field(..., min_length=10)
    entidad_afectada: Optional[str] = Field(None, max_length=100)
    categoria_delito: str = Field(..., min_length=3, max_length=50)
    prioridad: PrioridadTipo


class CasoUpdateEstatus(BaseModel):
    estatus_nuevo: EstatusTipo
    motivo_cambio: str = Field(..., min_length=5)


class AsignacionCreate(BaseModel):
    id_usuario: int = Field(..., gt=0)
    rol_en_caso: RolCasoTipo


class AsignacionResponse(BaseModel):
    id_asignacion: int
    id_caso: int
    id_usuario: int
    rol_en_caso: str
    fecha_asignacion: datetime
    id_usuario_asigno: int
    activo: bool

    model_config = {"from_attributes": True}


class HistorialEstatusResponse(BaseModel):
    id_historial: int
    estatus_anterior: Optional[str]
    estatus_nuevo: str
    motivo_cambio: str
    fecha_cambio: datetime
    id_usuario_modifico: int

    model_config = {"from_attributes": True}


class CasoResumen(BaseModel):
    id_caso: int
    numero_caso: str
    titulo: str
    entidad_afectada: Optional[str]
    categoria_delito: str
    prioridad: str
    estatus: str
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]
    id_usuario_creador: int
    fecha_ultima_modificacion: datetime

    model_config = {"from_attributes": True}


class CasoDetalle(CasoResumen):
    descripcion: str
    asignaciones: List[AsignacionResponse] = []
    historial_estatus: List[HistorialEstatusResponse] = []


class PaginacionCasos(BaseModel):
    total: int
    page: int
    limit: int
    data: List[CasoResumen]



class EventoTimelineResponse(BaseModel):
    id_auditoria: int
    id_usuario: int
    tipo_evento: str
    tabla_afectada: str
    id_registro: Optional[int]
    direccion_ip: Optional[str]
    fecha_evento: datetime
    descripcion: str

    model_config = {"from_attributes": True}


class PaginacionTimeline(BaseModel):
    total: int
    page: int
    limit: int
    data: List[EventoTimelineResponse]


class IndicadoresPanelResponse(BaseModel):
    total_casos: int
    por_estatus: dict[str, int]
    casos_sin_asignar: int