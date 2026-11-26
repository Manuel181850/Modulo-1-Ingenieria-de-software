from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.config import Config
from app.main import construir_app
from app.peticion import construir_peticion, intent_caso


def _cliente(skill_id: str = "") -> TestClient:
    config = Config(
        modo_datos="ejemplo",
        casos_base_url="http://casos.local",
        alertas_base_url="",
        usuarios_base_url="",
        bitacora_base_url="",
        skill_id=skill_id,
        verificar_timestamp=True,
    )
    return TestClient(construir_app(config))


def test_health():
    respuesta = _cliente().get("/health")
    assert respuesta.status_code == 200
    assert respuesta.json()["modulo"] == "skill-alexa-eq11"
    assert respuesta.json()["modo_datos"] == "ejemplo"


def test_endpoint_responde_el_caso_ficticio():
    respuesta = _cliente().post(
        "/api/v1/alexa",
        json=construir_peticion(intent=intent_caso("ConsultarCasoIntent", 1042)),
    )
    assert respuesta.status_code == 200
    dicha = respuesta.json()["response"]["outputSpeech"]["text"]
    assert "correo institucional comprometido" in dicha
    assert respuesta.json()["response"]["shouldEndSession"] is False


def test_rechaza_timestamp_viejo_y_otro_skill_id():
    cliente = _cliente()
    viejo = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    cuerpo = construir_peticion(
        intent=intent_caso("ConsultarCasoIntent", 1042),
        timestamp=viejo,
    )
    assert cliente.post("/api/v1/alexa", json=cuerpo).status_code == 400

    otro = _cliente(skill_id="amzn1.ask.skill.real")
    ajeno = construir_peticion(
        intent=intent_caso("ConsultarCasoIntent", 1042),
        skill_id="amzn1.ask.skill.otra",
    )
    assert otro.post("/api/v1/alexa", json=ajeno).status_code == 400


def test_un_fallo_interno_no_deja_muda_a_alexa():
    cliente = _cliente()

    class FuenteRota:
        def usuario(self, _token: str):
            raise RuntimeError("fallo de prueba")

        def caso(self, _token: str, _numero: int):
            raise RuntimeError("fallo de prueba")

        def alertas(self, _token: str):
            raise RuntimeError("fallo de prueba")

        def registrar(self, _evento: dict):
            return None

    cliente.app.state.fuente = FuenteRota()
    respuesta = cliente.post(
        "/api/v1/alexa",
        json=construir_peticion(tipo="LaunchRequest"),
    )
    assert respuesta.status_code == 200
    assert "No pude completar la consulta" in respuesta.json()["response"]["outputSpeech"]["text"]
