from sqlalchemy import Boolean, Column, Integer, String, Text
from app.database import Base


class Herramienta(Base):
    __tablename__ = "herramientas"

    id_herramienta = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), unique=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    categoria = Column(String(60), nullable=False)
    url = Column(String(500), nullable=False)
    tipo_dato_entrada = Column(String(150), nullable=False)
    modelo_costo = Column(String(30), nullable=False)
    notas_uso_etico_legal = Column(Text, nullable=False)
    activa = Column(Boolean, default=True)


class MaterialReferencia(Base):
    __tablename__ = "materiales_referencia"

    id_material = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(180), nullable=False)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String(40), nullable=False)
    url = Column(String(500), nullable=True)