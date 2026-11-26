from datetime import datetime, timezone

from app import frases
from app.modelos import FuenteDatos, ResultadoAlertas, ResultadoCaso, Usuario
from app.peticion import (
    INTENTS_CASO,
    extraer_sesion,
    extraer_token,
    interpretar_numero,
    slot_numero,
)
from app.respuesta import hablar, vacia

ACCION_BITACORA = "Consulta por voz a través de Alexa"


def manejar(cuerpo: dict, fuente: FuenteDatos) -> dict:
    request = cuerpo.get("request") or {}
    tipo = request.get("type")
    sesion = extraer_sesion(cuerpo)
    token = extraer_token(cuerpo)

    if tipo == "LaunchRequest":
        return _lanzar(token, fuente, sesion)
    if tipo == "SessionEndedRequest":
        return vacia(sesion)
    if tipo == "IntentRequest":
        return _intent(request.get("intent") or {}, token, fuente, sesion)
    return hablar(frases.no_entendi(), sesion, reprompt=frases.no_entendi())


def _lanzar(token: str | None, fuente: FuenteDatos, sesion: dict) -> dict:
    usuario, rechazo = _exigir_usuario(token, fuente, sesion)
    if rechazo is not None:
        return rechazo
    return hablar(frases.saludo(usuario.nombre), sesion, reprompt=frases.REPROMPT)


def _intent(intent: dict, token: str | None, fuente: FuenteDatos, sesion: dict) -> dict:
    nombre = intent.get("name")
    if nombre in {
        "AMAZON.StopIntent",
        "AMAZON.CancelIntent",
        "AMAZON.NavigateHomeIntent",
    }:
        _limpiar_pendiente(sesion)
        _limpiar_alertas(sesion)
        return hablar(frases.despedida(), sesion, terminar=True)
    if nombre == "AMAZON.HelpIntent":
        return hablar(frases.ayuda(), sesion, reprompt=frases.REPROMPT_AYUDA)
    if nombre == "AMAZON.RepeatIntent":
        return hablar(sesion.get("ultima_frase") or frases.repetir_vacio(), sesion)
    if nombre == "AMAZON.YesIntent":
        return _confirmar(token, fuente, sesion)
    if nombre == "AMAZON.NoIntent":
        return _negar(sesion)
    if nombre == "MisAlertasIntent":
        return _alertas(token, fuente, sesion)
    if nombre == "SiguienteAlertaIntent":
        return _siguiente(sesion)
    if nombre in INTENTS_CASO:
        return _pedido_caso(nombre, intent, token, fuente, sesion)
    return hablar(frases.no_entendi(), sesion, reprompt=frases.no_entendi())


def _pedido_caso(
    nombre: str, intent: dict, token: str | None, fuente: FuenteDatos, sesion: dict
) -> dict:
    usuario, rechazo = _exigir_usuario(token, fuente, sesion)
    if rechazo is not None:
        return rechazo
    interpretacion = interpretar_numero(slot_numero(intent))
    if interpretacion.estado == "negado":
        _limpiar_pendiente(sesion)
        return hablar(frases.numero_negado(), sesion, reprompt=frases.pedir_numero())
    if interpretacion.estado == "ausente" or interpretacion.numero is None:
        _limpiar_pendiente(sesion)
        return hablar(frases.pedir_numero(), sesion, reprompt=frases.pedir_numero())
    if interpretacion.estado == "dudoso":
        _limpiar_alertas(sesion)
        sesion["numero_pendiente"] = interpretacion.numero
        sesion["intent_pendiente"] = nombre
        pregunta = frases.confirmacion_numero(interpretacion.numero)
        return hablar(pregunta, sesion, reprompt=pregunta)
    return _consultar(
        nombre, interpretacion.numero, token or "", usuario, fuente, sesion
    )


def _confirmar(token: str | None, fuente: FuenteDatos, sesion: dict) -> dict:
    numero = _entero_sesion(sesion.get("numero_pendiente"))
    nombre = sesion.get("intent_pendiente")
    if numero is None or nombre not in INTENTS_CASO:
        return hablar(frases.nada_que_confirmar(), sesion)
    usuario, rechazo = _exigir_usuario(token, fuente, sesion)
    if rechazo is not None:
        return rechazo
    _limpiar_pendiente(sesion)
    return _consultar(nombre, numero, token or "", usuario, fuente, sesion)


def _negar(sesion: dict) -> dict:
    if "numero_pendiente" not in sesion:
        return hablar(frases.nada_que_confirmar(), sesion)
    _limpiar_pendiente(sesion)
    return hablar(frases.numero_negado(), sesion, reprompt=frases.pedir_numero())


def _consultar(
    nombre: str,
    numero: int,
    token: str,
    usuario: Usuario,
    fuente: FuenteDatos,
    sesion: dict,
) -> dict:
    _limpiar_pendiente(sesion)
    _limpiar_alertas(sesion)
    resultado = fuente.caso(token, numero)
    _auditar(
        fuente,
        usuario,
        caso_id=numero if resultado.tipo != "error" else None,
        id_caso=resultado.caso.id_caso if resultado.caso else None,
        resultado=resultado.tipo,
        intent=nombre,
    )
    if resultado.tipo == "no_autorizado":
        return _pedir_vinculo(sesion, frases.sesion_invalida())
    return hablar(_frase_de_caso(nombre, numero, resultado), sesion)


def _frase_de_caso(nombre: str, numero: int, resultado: ResultadoCaso) -> str:
    if resultado.tipo == "prohibido":
        return frases.sin_permiso(numero)
    if resultado.tipo == "inexistente":
        return frases.caso_inexistente(numero)
    if resultado.tipo != "ok" or resultado.caso is None:
        return frases.error_consulta()
    caso = resultado.caso
    if nombre == "ConsultarEstatusIntent":
        return frases.frase_estatus(numero, caso.estatus)
    if nombre == "ConsultarInvestigadoresIntent":
        return frases.frase_investigadores(
            numero, caso.investigadores, caso.investigadores_sin_nombre
        )
    return frases.frase_caso(
        numero,
        caso.descripcion,
        caso.estatus,
        caso.investigadores,
        caso.investigadores_sin_nombre,
    )


def _alertas(token: str | None, fuente: FuenteDatos, sesion: dict) -> dict:
    usuario, rechazo = _exigir_usuario(token, fuente, sesion)
    if rechazo is not None:
        return rechazo
    _limpiar_pendiente(sesion)
    resultado = fuente.alertas(token or "")
    if resultado.tipo == "ok" and resultado.mensajes:
        codigo = "alertas"
    elif resultado.tipo == "ok":
        codigo = "sin_alertas"
    else:
        codigo = resultado.tipo
    _auditar(
        fuente,
        usuario,
        caso_id=None,
        id_caso=None,
        resultado=codigo,
        intent="MisAlertasIntent",
    )
    if resultado.tipo == "no_autorizado":
        return _pedir_vinculo(sesion, frases.sesion_invalida())
    frase, reprompt = _frase_de_alertas(resultado, sesion)
    return hablar(frase, sesion, reprompt=reprompt)


def _frase_de_alertas(resultado: ResultadoAlertas, sesion: dict) -> tuple[str, str]:
    if resultado.tipo != "ok":
        _limpiar_alertas(sesion)
        return frases.error_alertas(), frases.REPROMPT
    if not resultado.mensajes:
        _limpiar_alertas(sesion)
        return frases.sin_alertas(), frases.REPROMPT
    if len(resultado.mensajes) == 1:
        _limpiar_alertas(sesion)
        return frases.frase_alertas(resultado.mensajes), frases.REPROMPT
    sesion["alertas"] = list(resultado.mensajes)
    sesion["alerta_indice"] = 1
    return frases.frase_alertas(resultado.mensajes), frases.REPROMPT_SIGUIENTE


def _siguiente(sesion: dict) -> dict:
    alertas = sesion.get("alertas")
    indice = sesion.get("alerta_indice", 0)
    if not isinstance(alertas, list) or not alertas:
        return hablar(frases.sin_lectura_de_alertas(), sesion)
    if not isinstance(indice, int) or indice >= len(alertas):
        _limpiar_alertas(sesion)
        return hablar(frases.alertas_terminadas(), sesion)
    mensaje = str(alertas[indice])
    es_ultima = indice + 1 >= len(alertas)
    sesion["alerta_indice"] = indice + 1
    if es_ultima:
        _limpiar_alertas(sesion)
        return hablar(frases.frase_alerta_siguiente(mensaje, True), sesion)
    return hablar(
        frases.frase_alerta_siguiente(mensaje, False),
        sesion,
        reprompt=frases.REPROMPT_SIGUIENTE,
    )


def _exigir_usuario(
    token: str | None, fuente: FuenteDatos, sesion: dict
) -> tuple[Usuario | None, dict | None]:
    if not token:
        return None, _pedir_vinculo(sesion)
    usuario = fuente.usuario(token)
    if usuario is None:
        return None, _pedir_vinculo(sesion)
    return usuario, None


def _entero_sesion(valor: object) -> int | None:
    if isinstance(valor, bool):
        return None
    if isinstance(valor, int):
        return valor
    if isinstance(valor, float) and valor.is_integer():
        return int(valor)
    if isinstance(valor, str) and valor.isdigit():
        return int(valor)
    return None


def _pedir_vinculo(sesion: dict, texto: str | None = None) -> dict:
    return hablar(
        texto or frases.vincular_cuenta(), sesion, terminar=True, vincular=True
    )


def _auditar(
    fuente: FuenteDatos,
    usuario: Usuario,
    *,
    caso_id: int | None,
    id_caso: int | None,
    resultado: str,
    intent: str,
) -> None:
    fuente.registrar(
        {
            "accion": ACCION_BITACORA,
            "caso_id": caso_id,
            "id_caso": id_caso,
            "id_usuario": usuario.id_usuario,
            "modulo": "ALEXA",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "detalle": {"resultado": resultado, "intent": intent},
        }
    )


def _limpiar_pendiente(sesion: dict) -> None:
    sesion.pop("numero_pendiente", None)
    sesion.pop("intent_pendiente", None)


def _limpiar_alertas(sesion: dict) -> None:
    sesion.pop("alertas", None)
    sesion.pop("alerta_indice", None)
