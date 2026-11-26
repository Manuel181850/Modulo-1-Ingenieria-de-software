from app.config import Config
from app.fuente_ejemplo import FuenteEjemplo
from app.fuente_plataforma import FuentePlataforma
from app.modelos import FuenteDatos


def crear_fuente(config: Config) -> FuenteDatos:
    if config.modo_datos == "plataforma":
        return FuentePlataforma(config)
    return FuenteEjemplo()
