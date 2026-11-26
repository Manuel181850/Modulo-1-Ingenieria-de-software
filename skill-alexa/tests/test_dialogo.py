from app.ensayo import guion_demo
from app.fuente_ejemplo import FuenteEjemplo
from app.peticion import construir_peticion, intent_caso
from app.respuesta import texto_dicho
from app.skill import ACCION_BITACORA, manejar


def _decir(fuente: FuenteEjemplo, cuerpo: dict) -> dict:
    return manejar(cuerpo, fuente)


def test_guion_del_caso_ficticio():
    assert guion_demo() == [
        "Hola, Ana. Puedes consultar un caso o escuchar tus alertas.",
        "El caso 1042 trata de un correo institucional comprometido "
        "y está en investigación. Lo llevan Ana Ruiz y Luis Pérez.",
        "Tienes una alerta: te asignaron el caso 1042.",
    ]


def test_sin_cuenta_no_consulta():
    fuente = FuenteEjemplo()
    respuesta = _decir(fuente, construir_peticion(tipo="LaunchRequest", token=None))
    dicha = texto_dicho(respuesta)
    assert "Vincula tu cuenta" in dicha
    assert "correo" not in dicha.lower()
    assert respuesta["response"]["shouldEndSession"] is True
    assert respuesta["response"]["card"]["type"] == "LinkAccount"
    assert fuente.eventos == []

    consulta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token=None,
        ),
    )
    assert "correo" not in texto_dicho(consulta).lower()
    assert fuente.eventos == []


def test_token_desconocido_no_consulta():
    fuente = FuenteEjemplo()
    respuesta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-ajeno",
        ),
    )
    assert respuesta["response"]["card"]["type"] == "LinkAccount"
    assert fuente.eventos == []


def test_sin_permiso_no_lee_el_expediente():
    fuente = FuenteEjemplo()
    respuesta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-sin-permiso",
        ),
    )
    dicha = texto_dicho(respuesta)
    assert dicha == "No tienes permiso para consultar el caso 1042."
    assert "correo" not in dicha.lower()
    assert "ruiz" not in dicha.lower()
    assert fuente.eventos[-1]["detalle"]["resultado"] == "prohibido"
    assert fuente.eventos[-1]["caso_id"] == 1042
    assert fuente.eventos[-1]["id_caso"] is None


def test_caso_inexistente_y_estatus_e_investigadores():
    fuente = FuenteEjemplo()
    inexistente = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 9999),
            token="token-ana",
        ),
    )
    assert texto_dicho(inexistente) == "No existe el caso 9999."

    estatus = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarEstatusIntent", 1042),
            token="token-ana",
        ),
    )
    assert texto_dicho(estatus) == "El caso 1042 está en investigación."

    investigadores = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarInvestigadoresIntent", 1042),
            token="token-ana",
        ),
    )
    assert texto_dicho(investigadores) == (
        "El caso 1042 lo llevan Ana Ruiz y Luis Pérez."
    )


def test_sin_alertas_y_alertas_de_una_en_una():
    fuente = FuenteEjemplo()
    vacias = _decir(
        fuente,
        construir_peticion(
            intent={"name": "MisAlertasIntent", "confirmationStatus": "NONE"},
            token="token-sin-alertas",
        ),
    )
    assert texto_dicho(vacias) == "No tienes alertas."
    assert fuente.eventos[-1]["detalle"]["resultado"] == "sin_alertas"

    sesion: dict = {}
    primera = _decir(
        fuente,
        construir_peticion(
            intent={"name": "MisAlertasIntent", "confirmationStatus": "NONE"},
            token="token-varias-alertas",
            atributos=sesion,
        ),
    )
    sesion = primera["sessionAttributes"]
    assert "Tienes tres alertas" in texto_dicho(primera)
    assert "te asignaron el caso 1042" in texto_dicho(primera)

    segunda = _decir(
        fuente,
        construir_peticion(
            intent={"name": "SiguienteAlertaIntent", "confirmationStatus": "NONE"},
            token="token-varias-alertas",
            atributos=sesion,
        ),
    )
    sesion = segunda["sessionAttributes"]
    assert "evidencia nueva" in texto_dicho(segunda)

    tercera = _decir(
        fuente,
        construir_peticion(
            intent={"name": "SiguienteAlertaIntent", "confirmationStatus": "NONE"},
            token="token-varias-alertas",
            atributos=sesion,
        ),
    )
    assert texto_dicho(tercera).startswith("La última alerta:")
    assert "alertas" not in tercera["sessionAttributes"]


def test_numero_dudoso_no_consulta_hasta_el_si():
    fuente = FuenteEjemplo()
    duda = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso(
                "ConsultarCasoIntent",
                1042,
                resolutions={
                    "resolutionsPerAuthority": [
                        {"status": {"code": "ER_SUCCESS_NO_MATCH"}}
                    ]
                },
            ),
            token="token-ana",
        ),
    )
    assert texto_dicho(duda) == "¿Dijiste caso 1042?"
    assert fuente.eventos == []

    negado = _decir(
        fuente,
        construir_peticion(
            intent={"name": "AMAZON.NoIntent", "confirmationStatus": "NONE"},
            token="token-ana",
            atributos=duda["sessionAttributes"],
        ),
    )
    assert "Dime el número" in texto_dicho(negado)
    assert fuente.eventos == []

    confirmado = _decir(
        fuente,
        construir_peticion(
            intent={"name": "AMAZON.YesIntent", "confirmationStatus": "NONE"},
            token="token-ana",
            atributos=duda["sessionAttributes"],
        ),
    )
    assert "correo institucional comprometido" in texto_dicho(confirmado)
    assert fuente.eventos[-1]["detalle"]["resultado"] == "ok"


def test_numero_confirmado_consulta_aunque_la_resolucion_falle():
    fuente = FuenteEjemplo()
    respuesta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso(
                "ConsultarCasoIntent",
                1042,
                confirmationStatus="CONFIRMED",
                resolutions={
                    "resolutionsPerAuthority": [
                        {"status": {"code": "ER_SUCCESS_NO_MATCH"}}
                    ]
                },
            ),
            token="token-ana",
        ),
    )
    assert "correo institucional comprometido" in texto_dicho(respuesta)


def test_texto_con_basura_no_llega_a_la_consulta():
    fuente = FuenteEjemplo()
    respuesta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", "1042 OR 1=1"),
            token="token-ana",
        ),
    )
    assert texto_dicho(respuesta) == "¿Cuál es el número de caso?"
    assert fuente.eventos == []


def test_repite_ayuda_y_salida():
    fuente = FuenteEjemplo()
    consulta = _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-ana",
        ),
    )
    repetida = _decir(
        fuente,
        construir_peticion(
            intent={"name": "AMAZON.RepeatIntent", "confirmationStatus": "NONE"},
            token="token-ana",
            atributos=consulta["sessionAttributes"],
        ),
    )
    assert texto_dicho(repetida) == texto_dicho(consulta)

    ayuda = _decir(
        fuente,
        construir_peticion(
            intent={"name": "AMAZON.HelpIntent", "confirmationStatus": "NONE"},
            token="token-ana",
        ),
    )
    assert "alertas" in texto_dicho(ayuda)

    salida = _decir(
        fuente,
        construir_peticion(
            intent={"name": "AMAZON.StopIntent", "confirmationStatus": "NONE"},
            token="token-ana",
        ),
    )
    assert texto_dicho(salida) == "Hasta luego."
    assert salida["response"]["shouldEndSession"] is True


def test_sesion_nueva_no_arrastra_una_confirmacion():
    fuente = FuenteEjemplo()
    cuerpo = construir_peticion(
        intent={"name": "AMAZON.YesIntent", "confirmationStatus": "NONE"},
        token="token-ana",
    )
    cuerpo["session"]["new"] = True
    cuerpo["session"]["attributes"] = {
        "numero_pendiente": 1042,
        "intent_pendiente": "ConsultarCasoIntent",
    }
    respuesta = _decir(fuente, cuerpo)
    assert "No hay nada que confirmar" in texto_dicho(respuesta)
    assert fuente.eventos == []


def test_la_bitacora_no_guarda_la_descripcion():
    fuente = FuenteEjemplo()
    _decir(
        fuente,
        construir_peticion(
            intent=intent_caso("ConsultarCasoIntent", 1042),
            token="token-ana",
        ),
    )
    evento = fuente.eventos[-1]
    assert evento["accion"] == ACCION_BITACORA
    assert evento["modulo"] == "ALEXA"
    assert evento["id_usuario"] == 1
    assert evento["id_caso"] == 1042
    assert "correo" not in str(evento["detalle"]).lower()
