from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Caso(Base):
    __tablename__ = "casos"

    id_caso = Column(Integer, primary_key=True, index=True)
    numero_caso = Column(String(30), unique=True, nullable=False, index=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    entidad_afectada = Column(String(100), nullable=True)
    categoria_delito = Column(String(50), nullable=False)
    prioridad = Column(String(20), nullable=False)
    estatus = Column(String(30), nullable=False, default="ABIERTO")
    fecha_apertura = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    id_usuario_creador = Column(Integer, nullable=False)
    fecha_ultima_modificacion = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    asignaciones = relationship(
        "AsignacionCaso", back_populates="caso", cascade="all, delete-orphan"
    )
    historial_estatus = relationship(
        "HistorialEstatusCaso",
        back_populates="caso",
        cascade="all, delete-orphan",
        order_by="HistorialEstatusCaso.fecha_cambio.desc()",
    )


class AsignacionCaso(Base):
    __tablename__ = "asignaciones_caso"

    id_asignacion = Column(Integer, primary_key=True, index=True)
    id_caso = Column(
        Integer, ForeignKey("casos.id_caso", ondelete="CASCADE"), nullable=False
    )
    id_usuario = Column(Integer, nullable=False)
    rol_en_caso = Column(String(30), nullable=False)
    fecha_asignacion = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    id_usuario_asigno = Column(Integer, nullable=False)
    activo = Column(Boolean, nullable=False, default=True)

    caso = relationship("Caso", back_populates="asignaciones")


class HistorialEstatusCaso(Base):
    __tablename__ = "historial_estatus_caso"

    id_historial = Column(Integer, primary_key=True, index=True)
    id_caso = Column(
        Integer, ForeignKey("casos.id_caso", ondelete="CASCADE"), nullable=False
    )
    estatus_anterior = Column(String(30), nullable=True)
    estatus_nuevo = Column(String(30), nullable=False)
    motivo_cambio = Column(Text, nullable=False)
    fecha_cambio = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    id_usuario_modifico = Column(Integer, nullable=False)

    caso = relationship("Caso", back_populates="historial_estatus")


class BitacoraAuditoria(Base):
    __tablename__ = "bitacora_auditoria"

    id_auditoria = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, nullable=False)
    tipo_evento = Column(String(50), nullable=False)
    tabla_afectada = Column(String(50), nullable=False)
    id_registro = Column(Integer, nullable=True)
    direccion_ip = Column(String(45), nullable=True)
    fecha_evento = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    descripcion = Column(Text, nullable=False)