from app.frases import REPROMPT


def hablar(
    texto: str,
    sesion: dict,
    *,
    terminar: bool = False,
    reprompt: str | None = None,
    vincular: bool = False,
) -> dict:
    atributos = dict(sesion)
    atributos["ultima_frase"] = texto
    respuesta: dict = {
        "outputSpeech": {"type": "PlainText", "text": texto},
        "shouldEndSession": terminar,
    }
    if not terminar:
        respuesta["reprompt"] = {
            "outputSpeech": {"type": "PlainText", "text": reprompt or REPROMPT}
        }
    if vincular:
        respuesta["card"] = {"type": "LinkAccount"}
    return {"version": "1.0", "sessionAttributes": atributos, "response": respuesta}


def vacia(sesion: dict) -> dict:
    return {"version": "1.0", "sessionAttributes": dict(sesion), "response": {}}


def texto_dicho(respuesta: dict) -> str:
    return respuesta["response"]["outputSpeech"]["text"]
