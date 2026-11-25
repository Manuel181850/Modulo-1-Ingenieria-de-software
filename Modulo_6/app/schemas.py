from typing import Optional
from pydantic import BaseModel


class HerramientaCreateSchema(BaseModel):
    nombre: str
    descripcion: str
    categoria: str
    url: str
    tipo_dato_entrada: str
    modelo_costo: str
    notas_uso_etico_legal: str


class HerramientaResponseSchema(HerramientaCreateSchema):
    id_herramienta: int
    activa: bool


class MaterialCreateSchema(BaseModel):
    titulo: str
    descripcion: str
    tipo: str
    url: Optional[str] = None


class MaterialResponseSchema(MaterialCreateSchema):
    id_material: int