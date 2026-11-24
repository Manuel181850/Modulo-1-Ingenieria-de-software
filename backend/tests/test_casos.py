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


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_crear_y_listar_caso():
    payload = {
        "titulo": "Análisis OSINT de infraestructura sospechosa",
        "descripcion": "Revisión de dominios y direcciones IP vinculadas a campaña fraudulenta.",
        "entidad_afectada": "Entidad Pública",
        "categoria_delito": "Fraude Informático",
        "prioridad": "ALTA",
    }
    resp_crear = client.post("/api/v1/casos", json=payload)
    assert resp_crear.status_code == 201
    data = resp_crear.json()
    assert data["numero_caso"].startswith("UDINT-")
    assert data["estatus"] == "ABIERTO"
    assert len(data["historial_estatus"]) == 1

    resp_listar = client.get("/api/v1/casos")
    assert resp_listar.status_code == 200
    assert resp_listar.json()["total"] >= 1


def test_obtener_caso_inexistente_retorna_404():
    resp = client.get("/api/v1/casos/UDINT-2026-9999")
    assert resp.status_code == 404