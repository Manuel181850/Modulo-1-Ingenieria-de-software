import json
from pathlib import Path

MODELO = (
    Path(__file__).resolve().parents[1]
    / "skill-package"
    / "interactionModels"
    / "custom"
    / "es-MX.json"
)


def test_el_modelo_cubre_el_guion_y_no_pide_contrasena():
    modelo = json.loads(MODELO.read_text(encoding="utf-8"))
    idioma = modelo["interactionModel"]["languageModel"]
    assert idioma["invocationName"] == "udint"
    intents = {item["name"]: item for item in idioma["intents"]}
    assert {
        "ConsultarCasoIntent",
        "ConsultarEstatusIntent",
        "ConsultarInvestigadoresIntent",
        "MisAlertasIntent",
        "SiguienteAlertaIntent",
        "AMAZON.YesIntent",
        "AMAZON.NoIntent",
        "AMAZON.RepeatIntent",
        "AMAZON.HelpIntent",
        "AMAZON.StopIntent",
        "AMAZON.FallbackIntent",
    } <= set(intents)
    muestras = " ".join(
        sample
        for intent in idioma["intents"]
        for sample in intent.get("samples", [])
    ).lower()
    assert "consulta el caso {numerocaso}" in muestras
    assert "mis alertas" in muestras
    assert "alexa" not in muestras
    assert "contraseña" not in muestras
    assert "password" not in muestras
    for nombre in intents:
        assert not any(
            verbo in nombre.lower()
            for verbo in ("crear", "actualizar", "borrar", "asignar", "eliminar")
        )
