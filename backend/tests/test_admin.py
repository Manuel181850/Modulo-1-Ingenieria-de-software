from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_timeline_consulta_e_indicadores():
    # 1. Crear un caso (esto también debe registrar un evento en el timeline)
    payload = {
        "titulo": "Phishing bancario dirigido a servidores institucionales",
        "descripcion": "Análisis OSINT de correos suplantando identidad oficial.",
        "entidad_afectada": "Universidad Pública",
        "categoria_delito": "Suplantación de Identidad",
        "prioridad": "CRITICA",
    }
    resp_caso = client.post("/api/v1/casos", json=payload)
    assert resp_caso.status_code == 201
    caso = resp_caso.json()
    folio = caso["numero_caso"]
    id_caso = caso["id_caso"]

    # 2. Verificar Timeline (actividad reciente)
    resp_timeline = client.get("/api/v1/admin/timeline")
    assert resp_timeline.status_code == 200
    timeline = resp_timeline.json()
    assert timeline["total"] >= 1
    assert any(folio in ev["descripcion"] for ev in timeline["data"])

    # 3. Verificar Consulta General por texto y por folio
    resp_busqueda_texto = client.get(
        "/api/v1/admin/consulta-general", params={"q": "Phishing"}
    )
    assert resp_busqueda_texto.status_code == 200
    assert resp_busqueda_texto.json()["total"] >= 1

    resp_busqueda_folio = client.get(
        "/api/v1/admin/consulta-general", params={"q": folio}
    )
    assert resp_busqueda_folio.status_code == 200
    assert resp_busqueda_folio.json()["data"][0]["numero_caso"] == folio

    # 4. Verificar Indicadores (antes y después de asignar usuario)
    resp_ind_antes = client.get("/api/v1/admin/indicadores")
    assert resp_ind_antes.status_code == 200
    ind_antes = resp_ind_antes.json()
    assert ind_antes["total_casos"] >= 1
    assert ind_antes["casos_sin_asignar"] >= 1

    resp_asig = client.post(
        f"/api/v1/casos/{id_caso}/asignaciones",
        json={"id_usuario": 5, "rol_en_caso": "INVESTIGADOR"},
    )
    assert resp_asig.status_code == 201

    resp_ind_despues = client.get("/api/v1/admin/indicadores")
    assert resp_ind_despues.status_code == 200
    ind_despues = resp_ind_despues.json()
    assert ind_despues["casos_sin_asignar"] == ind_antes["casos_sin_asignar"] - 1