import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    modo_datos: str
    casos_base_url: str
    alertas_base_url: str
    usuarios_base_url: str
    bitacora_base_url: str
    skill_id: str
    verificar_timestamp: bool


def _origen(nombre: str, default: str = "") -> str:
    return os.getenv(nombre, default).strip().rstrip("/")


def cargar_config() -> Config:
    modo = os.getenv("MODO_DATOS", "ejemplo").strip().lower()
    if modo not in {"ejemplo", "plataforma"}:
        modo = "ejemplo"
    verificar = os.getenv("ALEXA_VERIFICAR_TIMESTAMP", "true").strip().lower()
    return Config(
        modo_datos=modo,
        casos_base_url=_origen("CASOS_BASE_URL", "http://localhost:8000"),
        alertas_base_url=_origen("ALERTAS_BASE_URL"),
        usuarios_base_url=_origen("USUARIOS_BASE_URL"),
        bitacora_base_url=_origen("BITACORA_BASE_URL"),
        skill_id=os.getenv("ALEXA_SKILL_ID", "").strip(),
        verificar_timestamp=verificar not in {"0", "false", "no"},
    )
