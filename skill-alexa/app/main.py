import logging

from fastapi import FastAPI, HTTPException, Request

from app.config import Config, cargar_config
from app.frases import error_inesperado
from app.fuentes import crear_fuente
from app.peticion import skill_id_valido, timestamp_valido
from app.respuesta import hablar
from app.skill import manejar

logger = logging.getLogger("udint.alexa")


def construir_app(config: Config | None = None) -> FastAPI:
    configuracion = config or cargar_config()
    aplicacion = FastAPI(
        title="UDINT - Skill de Alexa (Equipo 11)",
        version="1.0.0",
        description=(
            "Canal de voz para consultar un caso ficticio y las alertas "
            "de la cuenta vinculada. No pide la contraseña."
        ),
    )
    aplicacion.state.config = configuracion
    aplicacion.state.fuente = crear_fuente(configuracion)

    @aplicacion.get("/health", tags=["Sistema"])
    def health_check():
        return {
            "status": "ok",
            "modulo": "skill-alexa-eq11",
            "modo_datos": configuracion.modo_datos,
        }

    @aplicacion.post("/api/v1/alexa", tags=["Alexa"])
    async def endpoint_alexa(request: Request):
        cuerpo = await request.json()
        if not isinstance(cuerpo, dict):
            raise HTTPException(status_code=400, detail="JSON inválido")
        if configuracion.verificar_timestamp and not timestamp_valido(cuerpo):
            raise HTTPException(status_code=400, detail="timestamp fuera de rango")
        if not skill_id_valido(cuerpo, configuracion.skill_id):
            raise HTTPException(status_code=400, detail="skill id no coincide")
        try:
            return manejar(cuerpo, aplicacion.state.fuente)
        except Exception:
            logger.exception("Error en la skill")
            return hablar(error_inesperado(), {})

    return aplicacion


app = construir_app()


def lambda_handler(event, _context):
    config = cargar_config()
    if config.verificar_timestamp and not timestamp_valido(event):
        raise ValueError("timestamp fuera de rango")
    if not skill_id_valido(event, config.skill_id):
        raise ValueError("skill id no coincide")
    fuente = crear_fuente(config)
    try:
        return manejar(event, fuente)
    finally:
        cerrar = getattr(fuente, "cerrar", None)
        if cerrar:
            cerrar()
