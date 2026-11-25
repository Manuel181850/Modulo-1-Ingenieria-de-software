import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
RUTA_PRUEBAS = "./test_modulo6_temp.db"
if os.path.exists(RUTA_PRUEBAS):
    os.remove(RUTA_PRUEBAS)

os.environ["DATABASE_URL"] = f"sqlite:///{RUTA_PRUEBAS}"

from app.cargar_csv import importar_csv
from app.database import Base, get_db
from app.main import app

engine_test = create_engine(
    f"sqlite:///{RUTA_PRUEBAS}", connect_args={"check_same_thread": False}
)
SesionTest = sessionmaker(bind=engine_test)
Base.metadata.create_all(bind=engine_test)

db_inicial = SesionTest()
importar_csv(db_inicial)
db_inicial.close()


def override_get_db():
    db = SesionTest()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_listar_catalogo():
    res = client.get("/api/v1/herramientas")
    assert res.status_code == 200
    cuerpo = res.json()
    assert cuerpo["ok"] is True
    assert len(cuerpo["data"]) >= 40


def test_filtrar_por_categoria():
    res = client.get("/api/v1/herramientas", params={"categoria": "IP"})
    assert res.status_code == 200
    cuerpo = res.json()
    assert cuerpo["ok"] is True
    for item in cuerpo["data"]:
        assert "ip" in item["categoria"].lower()


def test_ver_ficha_inexistente_da_404():
    res = client.get("/api/v1/herramientas/999999")
    assert res.status_code == 404


def test_usuario_no_puede_crear():
    res = client.post(
        "/api/v1/herramientas",
        headers={"X-Rol": "usuario"},
        json={
            "nombre": "Herramienta Prueba Usuario",
            "descripcion": "Solo prueba de permisos",
            "categoria": "IP",
            "url": "https://ejemplo.org",
            "tipo_dato_entrada": "IP",
            "modelo_costo": "Gratuita",
            "notas_uso_etico_legal": "Uso autorizado",
        },
    )
    assert res.status_code == 403


def test_admin_crea_ve_ficha_y_da_de_baja():
    alta = client.post(
        "/api/v1/herramientas",
        headers={"X-Rol": "admin"},
        json={
            "nombre": "Herramienta Prueba Admin",
            "descripcion": "Herramienta temporal para prueba",
            "categoria": "Dominios",
            "url": "https://ejemplo.org",
            "tipo_dato_entrada": "Dominio",
            "modelo_costo": "Freemium",
            "notas_uso_etico_legal": "Respetar privacidad",
        },
    )
    assert alta.status_code == 201
    creada = alta.json()["data"]
    id_nueva = creada["id_herramienta"]

    ficha = client.get(f"/api/v1/herramientas/{id_nueva}")
    assert ficha.status_code == 200
    assert ficha.json()["data"]["nombre"] == "Herramienta Prueba Admin"

    baja = client.delete(
        f"/api/v1/herramientas/{id_nueva}",
        headers={"X-Rol": "admin"},
    )
    assert baja.status_code == 200

    ficha_despues = client.get(f"/api/v1/herramientas/{id_nueva}")
    assert ficha_despues.status_code == 404