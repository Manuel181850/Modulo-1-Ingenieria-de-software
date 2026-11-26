from datetime import datetime, timedelta, timezone

import httpx

from app.config import Config
from app.fuente_plataforma import FuentePlataforma
from app.peticion import construir_peticion, intent_caso
from app.respuesta import texto_dicho
from app.skill import manejar

_CASO = {
    "id_caso": 7,
    "numero_caso": "UDINT-2026-1042",
    "titulo": "Correo institucional comprometido",
    "descripcion": "Texto interno que no debe leerse " * 8 + "ana@ejemplo.test",
    "estatus": "EN INVESTIGACION",
    "asignaciones": [
        {"rol_en_caso": "INVESTIGADOR", "activo": True, "nombre": "Ana Ruiz"},
        {"rol_en_caso": "INVESTIGADOR", "activo": True, "nombre": "Luis Pérez"},
        {"rol_en_caso": "CAPTURISTA", "activo": True, "nombre": "Marta Díaz"},
    ],
}


def _config(**cambios) -> Config:
    datos = {
        "modo_datos": "plataforma",
        "casos_base_url": "http://casos.local",
        "alertas_base_url": "http://alertas.local",
        "usuarios_base_url": "http://usuarios.local",
        "bitacora_base_url": "http://bitacora.local",
        "skill_id": "",
        "verificar_timestamp": True,
    }
    datos.update(cambios)
    return Config(**datos)


def _fuente(handler, **cambios) -> FuentePlataforma:
    cliente = httpx.Client(transport=httpx.MockTransport(handler))
    return FuentePlataforma(_config(**cambios), cliente)


def test_resuelve_el_folio_y_registra_la_bitacora():
    anio = datetime.now().year
    folio = f"UDINT-{anio}-1042"
    vistos: list[tuple[str, str, str | None]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        vistos.append(
            (request.method, request.url.path, request.headers.get("authorization"))
        )
        if request.method == "GET" and request.url.path == "/api/v1/casos/1042":
            return httpx.Response(404, json={"detail": "no está el folio corto"})
        if request.method == "GET" and request.url.path == f"/api/v1/casos/{folio}":
            cuerpo = dict(_CASO)
            cuerpo["numero_caso"] = folio
            return httpx.Response(200, json=cuerpo)
        if request.method == "GET" and request.url.path == "/api/v1/usuarios/me":
            return httpx.Response(200, json={"id_usuario": 1, "nombre_corto": "Ana"})
        if request.method == "POST" and request.url.path == "/api/v1/bitacora":
            return httpx.Response(201, json={"ok": True})
        return httpx.Response(500)

    fuente = _fuente(handler)
    respuesta = manejar(
        construir_peticion(intent=intent_caso("ConsultarCasoIntent", 1042)),
        fuente,
    )
    dicha = texto_dicho(respuesta)
    assert "Ana Ruiz" in dicha
    assert "Luis Pérez" in dicha
    assert "Marta" not in dicha
    assert "ana@" not in dicha
    assert "Texto interno" not in dicha
    posts = [item for item in vistos if item[0] == "POST"]
    assert posts[-1][1] == "/api/v1/bitacora"
    assert posts[-1][2] == "Bearer token-ana"


def test_prohibido_no_repite_el_cuerpo_del_error():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/usuarios/me":
            return httpx.Response(200, json={"nombre_corto": "Luis"})
        return httpx.Response(
            403, json={"detail": "Correo secreto de Ana Ruiz en el caso 1042"}
        )

    fuente = _fuente(handler)
    respuesta = manejar(
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-sin-permiso",
        ),
        fuente,
    )
    dicha = texto_dicho(respuesta)
    assert dicha == "No tienes permiso para consultar el caso 1042."
    assert "secreto" not in dicha.lower()
    assert "ruiz" not in dicha.lower()


def test_inexistente_sesion_vencida_y_alertas():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/usuarios/me":
            if request.headers.get("authorization") == "Bearer token-viejo":
                return httpx.Response(401)
            return httpx.Response(200, json={"nombre": "Ana"})
        if request.url.path == "/api/v1/notificaciones/mis-alertas":
            return httpx.Response(
                200,
                json={"alertas": [{"mensaje": "Te asignaron el caso 1042."}]},
            )
        return httpx.Response(404, json={"detail": "no existe"})

    fuente = _fuente(handler)
    inexistente = manejar(
        construir_peticion(intent=intent_caso("ConsultarCasoIntent", 9999)),
        fuente,
    )
    assert texto_dicho(inexistente) == "No existe el caso 9999."

    alertas = manejar(
        construir_peticion(
            intent={"name": "MisAlertasIntent", "confirmationStatus": "NONE"}
        ),
        fuente,
    )
    assert texto_dicho(alertas) == "Tienes una alerta: te asignaron el caso 1042."

    vencida = manejar(
        construir_peticion(tipo="LaunchRequest", token="token-viejo"),
        fuente,
    )
    assert vencida["response"]["card"]["type"] == "LinkAccount"


def test_sin_red_no_inventa_el_caso():
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("sin red")

    fuente = _fuente(handler, usuarios_base_url="")
    respuesta = manejar(
        construir_peticion(intent=intent_caso("ConsultarCasoIntent", 1042)),
        fuente,
    )
    assert "No pude consultar el caso" in texto_dicho(respuesta)
    assert "correo institucional" not in texto_dicho(respuesta)
