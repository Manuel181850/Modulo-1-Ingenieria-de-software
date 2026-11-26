from app.adaptadores import (
    adaptar_alertas,
    adaptar_caso,
    adaptar_usuario,
    candidatos_folio,
)


def test_contrato_de_casos_del_avance():
    caso = adaptar_caso(
        {
            "id": 1042,
            "descripcion": "Correo institucional comprometido",
            "estatus": "En investigación",
            "investigadores": ["Ana Ruiz", "Luis Pérez"],
        },
        1042,
    )
    assert caso is not None
    assert caso.id_caso == 1042
    assert caso.investigadores == ["Ana Ruiz", "Luis Pérez"]
    assert caso.estatus == "En investigación"


def test_detalle_real_de_la_api_de_casos():
    caso = adaptar_caso(
        {
            "ok": True,
            "data": {
                "id_caso": 7,
                "numero_caso": "UDINT-2026-1042",
                "titulo": "Correo institucional comprometido",
                "descripcion": ("detalle " * 30) + "ana@ejemplo.test",
                "estatus": "EN INVESTIGACION",
                "asignaciones": [
                    {
                        "rol_en_caso": "INVESTIGADOR",
                        "activo": True,
                        "nombre": "Ana Ruiz",
                    },
                    {
                        "rol_en_caso": "INVESTIGADOR",
                        "activo": True,
                        "nombre": "Luis Pérez",
                    },
                    {
                        "rol_en_caso": "CAPTURISTA",
                        "activo": True,
                        "nombre": "Marta Díaz",
                    },
                    {
                        "rol_en_caso": "INVESTIGADOR",
                        "activo": False,
                        "nombre": "Pedro Gómez",
                    },
                    {"rol_en_caso": "INVESTIGADOR", "activo": True, "id_usuario": 9},
                ],
            },
        },
        1042,
    )
    assert caso is not None
    assert caso.id_caso == 7
    assert caso.descripcion == "Correo institucional comprometido"
    assert "ana@" not in caso.descripcion
    assert caso.investigadores == ["Ana Ruiz", "Luis Pérez"]
    assert caso.investigadores_sin_nombre == 1


def test_alertas_y_usuario():
    assert adaptar_alertas(
        {"alertas": [{"mensaje": "Te asignaron el caso 1042."}]}
    ) == ["Te asignaron el caso 1042."]
    assert adaptar_alertas(
        {"ok": True, "data": ["Primera alerta.", "Segunda alerta."]}
    ) == ["Primera alerta.", "Segunda alerta."]
    usuario = adaptar_usuario(
        {"ok": True, "data": {"id_usuario": 1, "nombre_corto": "Ana Ruiz"}}
    )
    assert usuario.id_usuario == 1
    assert usuario.nombre == "Ana Ruiz"


def test_candidatos_de_folio_sin_repetir():
    folios = candidatos_folio(1042, anio=2026)
    assert folios == [
        "1042",
        "UDINT-2026-1042",
        "UDINT-2025-1042",
    ]


def test_cuerpo_vacio_no_inventa_un_caso():
    assert adaptar_caso({}, 1042) is None
    assert adaptar_alertas({"ok": False}) is None
