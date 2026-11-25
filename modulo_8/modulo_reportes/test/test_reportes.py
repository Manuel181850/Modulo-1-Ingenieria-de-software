from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_obtener_dashboard():
    response = client.get("/api/v1/reportes/dashboard")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert "casos" in body["data"]


def test_listar_casos_con_filtro_prioridad():
    response = client.get("/api/v1/reportes/casos?prioridad=ALTA")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    for caso in body["data"]:
        assert caso["prioridad"] == "ALTA"


def test_consultar_auditoria():
    response = client.get("/api/v1/reportes/auditoria")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_exportar_pdf():
    response = client.get("/api/v1/reportes/exportar/pdf?prioridad=CRITICA")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 100


def test_exportar_excel():
    response = client.get("/api/v1/reportes/exportar/excel")
    assert response.status_code == 200
    assert (
        "spreadsheetml.sheet" in response.headers["content-type"]
    )
    assert len(response.content) > 100


def test_estadisticas_evidencias():
    response = client.get("/api/v1/reportes/estadisticas/evidencias")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["total_evidencias"] > 0


def test_ranking_herramientas():
    response = client.get("/api/v1/reportes/herramientas")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_estadisticas_canales():
    response = client.get("/api/v1/reportes/canales")
    assert response.status_code == 200
    assert response.json()["ok"] is True