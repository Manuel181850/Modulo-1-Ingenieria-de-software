"""Ensayo local del guion. No sustituye el simulador de Alexa."""

from app.fuente_ejemplo import FuenteEjemplo
from app.peticion import construir_peticion, intent_caso
from app.respuesta import texto_dicho
from app.skill import manejar


def guion_demo(fuente: FuenteEjemplo | None = None) -> list[str]:
    datos = fuente or FuenteEjemplo()
    sesion: dict = {}
    dichos: list[str] = []

    def turno(cuerpo: dict) -> None:
        nonlocal sesion
        respuesta = manejar(cuerpo, datos)
        sesion = respuesta["sessionAttributes"]
        dichos.append(texto_dicho(respuesta))

    turno(construir_peticion(tipo="LaunchRequest", token="token-ana"))
    turno(
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-ana",
            atributos=sesion,
        )
    )
    turno(
        construir_peticion(
            intent={"name": "MisAlertasIntent", "confirmationStatus": "NONE"},
            token="token-ana",
            atributos=sesion,
        )
    )
    return dichos


def main() -> None:
    fuente = FuenteEjemplo()
    print("Cuenta de Ana, caso ficticio 1042")
    for linea in guion_demo(fuente):
        print(f"Alexa: {linea}")
        print()

    print("Sin cuenta")
    print(
        "Alexa:",
        _decir(fuente, construir_peticion(tipo="LaunchRequest", token=None)),
    )
    print()
    print("Sin permiso")
    print(
        "Alexa:",
        _decir(
            fuente,
            construir_peticion(
                intent=intent_caso("ConsultarCasoIntent", 1042),
                token="token-sin-permiso",
            ),
        ),
    )
    print()
    print("Caso inexistente")
    print(
        "Alexa:",
        _decir(
            fuente,
            construir_peticion(
                intent=intent_caso("ConsultarCasoIntent", 9999),
                token="token-ana",
            ),
        ),
    )
    print()
    print("Sin alertas")
    print(
        "Alexa:",
        _decir(
            fuente,
            construir_peticion(
                intent={"name": "MisAlertasIntent", "confirmationStatus": "NONE"},
                token="token-sin-alertas",
            ),
        ),
    )


def _decir(fuente: FuenteEjemplo, cuerpo: dict) -> str:
    return texto_dicho(manejar(cuerpo, fuente))


if __name__ == "__main__":
    main()
