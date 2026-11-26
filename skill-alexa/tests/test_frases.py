from app.frases import (
    ayuda,
    caso_inexistente,
    confirmacion_numero,
    descripcion_hablada,
    despedida,
    error_alertas,
    error_consulta,
    error_inesperado,
    estatus_hablado,
    frase_alerta_siguiente,
    frase_alertas,
    frase_caso,
    frase_estatus,
    frase_investigadores,
    no_entendi,
    numero_negado,
    oraciones,
    pedir_numero,
    repetir_vacio,
    saludo,
    sesion_invalida,
    sin_alertas,
    sin_permiso,
    vincular_cuenta,
)


def test_frases_del_guion():
    assert saludo("Ana") == (
        "Hola, Ana. Puedes consultar un caso o escuchar tus alertas."
    )
    assert frase_caso(
        1042,
        "Correo institucional comprometido",
        "EN INVESTIGACION",
        ["Ana Ruiz", "Luis Pérez"],
    ) == (
        "El caso 1042 trata de un correo institucional comprometido "
        "y está en investigación. Lo llevan Ana Ruiz y Luis Pérez."
    )
    assert frase_alertas(["Te asignaron el caso 1042."]) == (
        "Tienes una alerta: te asignaron el caso 1042."
    )
    assert frase_estatus(1042, "En investigación") == (
        "El caso 1042 está en investigación."
    )
    assert frase_investigadores(1042, ["Ana Ruiz", "Luis Pérez"]) == (
        "El caso 1042 lo llevan Ana Ruiz y Luis Pérez."
    )


def test_cada_respuesta_cabe_en_dos_oraciones():
    dichas = [
        saludo("Ana"),
        saludo(None),
        vincular_cuenta(),
        frase_caso(
            1042,
            "Correo institucional comprometido",
            "ABIERTO",
            ["Ana Ruiz", "Luis Pérez", "Marta Díaz", "Pedro Gómez"],
        ),
        frase_caso(1042, "Correo", "CERRADO", []),
        frase_caso(1042, "", "EN PAUSA", [], investigadores_sin_nombre=2),
        frase_estatus(1042, "EN PAUSA"),
        frase_investigadores(1042, []),
        frase_investigadores(1042, ["no-es-un-nombre-1"], 1),
        sin_permiso(1042),
        caso_inexistente(9999),
        error_consulta(),
        error_alertas(),
        error_inesperado(),
        sesion_invalida(),
        frase_alertas(["Te asignaron el caso 1042.", "Otra novedad."]),
        frase_alerta_siguiente("El caso 1042 cambió de estatus.", False),
        frase_alerta_siguiente("El caso 1042 cambió de estatus.", True),
        sin_alertas(),
        confirmacion_numero(1042),
        pedir_numero(),
        numero_negado(),
        ayuda(),
        despedida(),
        no_entendi(),
        repetir_vacio(),
    ]
    for dicha in dichas:
        assert 1 <= len(oraciones(dicha)) <= 2


def test_no_lee_correo_ni_telefono_ni_url():
    texto = descripcion_hablada(
        "Aviso a ana.ruiz@ejemplo.test y al 5512345678. Ver http://ejemplo.test/caso"
    )
    assert "ana.ruiz" not in texto
    assert "5512345678" not in texto
    assert "http" not in texto
    assert "@" not in texto


def test_estatus_de_la_plataforma():
    assert estatus_hablado("ABIERTO") == "abierto"
    assert estatus_hablado("EN INVESTIGACION") == "en investigación"
    assert estatus_hablado("EN PAUSA") == "en pausa"
    assert estatus_hablado("CERRADO") == "cerrado"


def test_la_vinculacion_no_pide_dictar_la_contrasena():
    dicha = vincular_cuenta()
    assert "página" in dicha
    assert "no me la dictes" in dicha
