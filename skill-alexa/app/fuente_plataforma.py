import logging
from urllib.parse import quote

import httpx

from app.adaptadores import (
    adaptar_alertas,
    adaptar_caso,
    adaptar_usuario,
    candidatos_folio,
)
from app.config import Config
from app.modelos import ResultadoAlertas, ResultadoCaso, Usuario

logger = logging.getLogger("udint.alexa")


class FuentePlataforma:
    """Consume casos (equipo 3), alertas y usuario (equipo 2) y escribe bitácora."""

    def __init__(self, config: Config, cliente: httpx.Client | None = None) -> None:
        self._config = config
        self._cliente = cliente or httpx.Client(timeout=3.0, follow_redirects=False)
        self._propio = cliente is None

    def cerrar(self) -> None:
        if self._propio:
            self._cliente.close()

    def usuario(self, token: str) -> Usuario | None:
        if not self._config.usuarios_base_url:
            return Usuario(id_usuario=None, nombre=None)
        respuesta = self._get(
            f"{self._config.usuarios_base_url}/api/v1/usuarios/me", token
        )
        if respuesta is None:
            return Usuario(id_usuario=None, nombre=None)
        if respuesta.status_code in {401, 403}:
            return None
        if respuesta.status_code != 200:
            return Usuario(id_usuario=None, nombre=None)
        return adaptar_usuario(_json(respuesta))

    def caso(self, token: str, numero: int) -> ResultadoCaso:
        if not self._config.casos_base_url:
            return ResultadoCaso("error")
        for folio in candidatos_folio(numero):
            url = (
                f"{self._config.casos_base_url}/api/v1/casos/{quote(folio, safe='')}"
            )
            respuesta = self._get(url, token)
            if respuesta is None:
                return ResultadoCaso("error")
            if respuesta.status_code == 401:
                return ResultadoCaso("no_autorizado")
            if respuesta.status_code == 403:
                return ResultadoCaso("prohibido")
            if respuesta.status_code == 404:
                continue
            if respuesta.status_code != 200:
                return ResultadoCaso("error")
            caso = adaptar_caso(_json(respuesta), numero)
            if caso is None:
                return ResultadoCaso("error")
            return ResultadoCaso("ok", caso)
        return ResultadoCaso("inexistente")

    def alertas(self, token: str) -> ResultadoAlertas:
        if not self._config.alertas_base_url:
            return ResultadoAlertas("error")
        url = f"{self._config.alertas_base_url}/api/v1/notificaciones/mis-alertas"
        respuesta = self._get(url, token)
        if respuesta is None:
            return ResultadoAlertas("error")
        if respuesta.status_code == 401:
            return ResultadoAlertas("no_autorizado")
        if respuesta.status_code != 200:
            return ResultadoAlertas("error")
        mensajes = adaptar_alertas(_json(respuesta))
        if mensajes is None:
            return ResultadoAlertas("error")
        return ResultadoAlertas("ok", mensajes)

    def registrar(self, evento: dict) -> None:
        if not self._config.bitacora_base_url:
            logger.info("bitacora sin endpoint configurado")
            return
        url = f"{self._config.bitacora_base_url}/api/v1/bitacora"
        headers = {"Accept": "application/json"}
        token = getattr(self, "_token", None)
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            respuesta = self._cliente.post(url, json=evento, headers=headers)
        except httpx.HTTPError:
            logger.warning("no se pudo escribir la bitácora")
            return
        if respuesta.status_code >= 400:
            logger.warning("bitácora respondió %s", respuesta.status_code)

    def _get(self, url: str, token: str) -> httpx.Response | None:
        self._token = token
        try:
            return self._cliente.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                },
            )
        except httpx.HTTPError:
            logger.warning("falló la consulta a la plataforma")
            return None


def _json(respuesta: httpx.Response) -> object:
    try:
        return respuesta.json()
    except ValueError:
        return None
