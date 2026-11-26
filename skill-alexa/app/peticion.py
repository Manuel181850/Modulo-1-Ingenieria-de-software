import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal

EstadoNumero = Literal["ausente", "seguro", "dudoso", "negado"]
INTENTS_CASO = {
    "ConsultarCasoIntent",
    "ConsultarEstatusIntent",
    "ConsultarInvestigadoresIntent",
}
SLOT_NUMERO = "numeroCaso"
_VENTANA = timedelta(seconds=150)


@dataclass(frozen=True)
class InterpretacionNumero:
    estado: EstadoNumero
    numero: int | None = None


def extraer_token(cuerpo: dict) -> str | None:
    session_user = (cuerpo.get("session") or {}).get("user") or {}
    system = ((cuerpo.get("context") or {}).get("System") or {}).get("user") or {}
    for token in (session_user.get("accessToken"), system.get("accessToken")):
        if isinstance(token, str) and token.strip():
            return token.strip()
    return None


def extraer_sesion(cuerpo: dict) -> dict:
    session = cuerpo.get("session") or {}
    if session.get("new", False):
        return {}
    atributos = session.get("attributes") or {}
    if not isinstance(atributos, dict):
        return {}
    return dict(atributos)


def application_id(cuerpo: dict) -> str | None:
    session_app = (cuerpo.get("session") or {}).get("application") or {}
    system = (cuerpo.get("context") or {}).get("System") or {}
    system_app = system.get("application") or {}
    for valor in (session_app.get("applicationId"), system_app.get("applicationId")):
        if isinstance(valor, str) and valor.strip():
            return valor.strip()
    return None


def skill_id_valido(cuerpo: dict, esperado: str) -> bool:
    if not esperado:
        return True
    return application_id(cuerpo) == esperado


def timestamp_valido(cuerpo: dict, ahora: datetime | None = None) -> bool:
    crudo = (cuerpo.get("request") or {}).get("timestamp")
    if not isinstance(crudo, str):
        return False
    try:
        momento = datetime.fromisoformat(crudo.replace("Z", "+00:00"))
    except ValueError:
        return False
    if momento.tzinfo is None:
        momento = momento.replace(tzinfo=timezone.utc)
    referencia = ahora or datetime.now(timezone.utc)
    return abs(referencia - momento) <= _VENTANA


def interpretar_numero(slot: dict | None) -> InterpretacionNumero:
    if not isinstance(slot, dict):
        return InterpretacionNumero("ausente")
    if slot.get("confirmationStatus") == "DENIED":
        return InterpretacionNumero("negado")

    valor = slot.get("value")
    if valor is None:
        return InterpretacionNumero("ausente")

    texto = str(valor).strip().replace(",", "")
    confirmado = slot.get("confirmationStatus") == "CONFIRMED"
    if re.fullmatch(r"\d{1,6}", texto):
        numero = int(texto)
        if numero < 1:
            return InterpretacionNumero("ausente")
        if not confirmado and _es_dudoso(slot):
            return InterpretacionNumero("dudoso", numero)
        return InterpretacionNumero("seguro", numero)

    grupos = re.findall(r"\d+", texto)
    if len(grupos) == 1 and 1 <= len(grupos[0]) <= 6 and int(grupos[0]) >= 1:
        return InterpretacionNumero("dudoso", int(grupos[0]))
    return InterpretacionNumero("ausente")


def slot_numero(intent: dict) -> dict | None:
    slots = intent.get("slots") or {}
    slot = slots.get(SLOT_NUMERO)
    return slot if isinstance(slot, dict) else None


def construir_peticion(
    *,
    tipo: str = "IntentRequest",
    intent: dict | None = None,
    token: str | None = "token-ana",
    atributos: dict | None = None,
    nueva: bool = False,
    timestamp: str | None = None,
    skill_id: str = "amzn1.ask.skill.prueba",
) -> dict:
    momento = timestamp or datetime.now(timezone.utc).isoformat()
    usuario: dict = {"userId": "usuario-prueba"}
    if token:
        usuario["accessToken"] = token
    cuerpo = {
        "version": "1.0",
        "session": {
            "new": nueva or tipo == "LaunchRequest",
            "sessionId": "sesion-prueba",
            "application": {"applicationId": skill_id},
            "user": dict(usuario),
            "attributes": {} if nueva or tipo == "LaunchRequest" else (atributos or {}),
        },
        "context": {
            "System": {
                "application": {"applicationId": skill_id},
                "user": dict(usuario),
            }
        },
        "request": {
            "type": tipo,
            "requestId": "req-prueba",
            "locale": "es-MX",
            "timestamp": momento,
        },
    }
    if intent is not None:
        cuerpo["request"]["intent"] = intent
    return cuerpo


def intent_caso(nombre: str, numero: int | str | None = None, **extra_slot) -> dict:
    data: dict = {"name": nombre, "confirmationStatus": "NONE", "slots": {}}
    if numero is not None or extra_slot:
        slot = {"name": SLOT_NUMERO, "confirmationStatus": "NONE", "value": None}
        if numero is not None:
            slot["value"] = str(numero)
        slot.update(extra_slot)
        data["slots"][SLOT_NUMERO] = slot
    return data


def _es_dudoso(slot: dict) -> bool:
    if _varios_valores(slot):
        return True
    resoluciones = (slot.get("resolutions") or {}).get("resolutionsPerAuthority")
    if not isinstance(resoluciones, list) or not resoluciones:
        return False
    codigos = []
    for autoridad in resoluciones:
        codigo = ((autoridad or {}).get("status") or {}).get("code")
        codigos.append(codigo)
    return "ER_SUCCESS_MATCH" not in codigos and "ER_SUCCESS_NO_MATCH" in codigos


def _varios_valores(slot: dict) -> bool:
    valor = slot.get("slotValue") or {}
    valores = valor.get("values")
    return (
        valor.get("type") == "List"
        and isinstance(valores, list)
        and len(valores) > 1
    )
