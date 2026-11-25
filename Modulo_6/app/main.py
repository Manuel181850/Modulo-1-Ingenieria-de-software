from typing import Optional
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.cargar_csv import importar_csv
from app.database import Base, get_db, sesion_local, engine
from app.models import Herramienta, MaterialReferencia
from app.schemas import (
    HerramientaCreateSchema,
    MaterialCreateSchema,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Modulo 6 - Herramientas y Referencias")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def respuesta_ok(data, mensaje: str = "Operación realizada correctamente"):
    return {"ok": True, "data": data, "mensaje": mensaje}


def serializar_herramienta(h: Herramienta) -> dict:
    return {
        "id_herramienta": h.id_herramienta,
        "nombre": h.nombre,
        "descripcion": h.descripcion,
        "categoria": h.categoria,
        "url": h.url,
        "tipo_dato_entrada": h.tipo_dato_entrada,
        "modelo_costo": h.modelo_costo,
        "notas_uso_etico_legal": h.notas_uso_etico_legal,
        "activa": h.activa,
    }


@app.on_event("startup")
def al_iniciar():
    db = sesion_local()
    try:
        importar_csv(db)
    finally:
        db.close()


def verificar_admin(x_rol: str = Header(default="usuario")):
    if x_rol.lower() != "admin":
        raise HTTPException(status_code=403, detail="Solo el rol admin puede hacer esto")


@app.get("/api/v1/herramientas")
def listar_herramientas(
    q: Optional[str] = None,
    categoria: Optional[str] = None,
    modelo_costo: Optional[str] = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(Herramienta).filter(Herramienta.activa.is_(True))
    if q:
        patron = f"%{q.strip()}%"
        consulta = consulta.filter(
            or_(
                Herramienta.nombre.ilike(patron),
                Herramienta.descripcion.ilike(patron),
                Herramienta.tipo_dato_entrada.ilike(patron),
                Herramienta.notas_uso_etico_legal.ilike(patron),
            )
        )
    if categoria:
        consulta = consulta.filter(
            Herramienta.categoria.ilike(f"%{categoria.strip()}%")
        )
    if modelo_costo:
        consulta = consulta.filter(Herramienta.modelo_costo == modelo_costo)

    items = [serializar_herramienta(h) for h in consulta.all()]
    return respuesta_ok(items, "Catálogo consultado correctamente")


@app.get("/api/v1/herramientas/{id_herramienta}")
def ver_ficha_herramienta(id_herramienta: int, db: Session = Depends(get_db)):
    herramienta = (
        db.query(Herramienta)
        .filter(
            Herramienta.id_herramienta == id_herramienta,
            Herramienta.activa.is_(True),
        )
        .first()
    )
    if not herramienta:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")
    return respuesta_ok(serializar_herramienta(herramienta), "Ficha obtenida")


@app.post("/api/v1/herramientas", status_code=201)
def crear_herramienta(
    datos: HerramientaCreateSchema,
    db: Session = Depends(get_db),
    _: None = Depends(verificar_admin),
):
    nueva = Herramienta(**datos.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return respuesta_ok(serializar_herramienta(nueva), "Herramienta creada")


@app.delete("/api/v1/herramientas/{id_herramienta}")
def eliminar_herramienta(
    id_herramienta: int,
    db: Session = Depends(get_db),
    _: None = Depends(verificar_admin),
):
    herramienta = (
        db.query(Herramienta)
        .filter(Herramienta.id_herramienta == id_herramienta)
        .first()
    )
    if not herramienta:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")
    herramienta.activa = False
    db.commit()
    return respuesta_ok({"id_herramienta": id_herramienta}, "Herramienta dada de baja")


@app.get("/api/v1/herramientas/recomendaciones")
def recomendar_herramientas(tipo_entidad: str, db: Session = Depends(get_db)):
    patron = f"%{tipo_entidad.strip()}%"
    items = (
        db.query(Herramienta)
        .filter(
            Herramienta.activa.is_(True),
            or_(
                Herramienta.categoria.ilike(patron),
                Herramienta.tipo_dato_entrada.ilike(patron),
            ),
        )
        .all()
    )
    return respuesta_ok([serializar_herramienta(h) for h in items], "Recomendaciones listas")


@app.get("/api/v1/herramientas/materiales-referencia")
def listar_materiales(db: Session = Depends(get_db)):
    materiales = db.query(MaterialReferencia).all()
    data = [
        {
            "id_material": m.id_material,
            "titulo": m.titulo,
            "descripcion": m.descripcion,
            "tipo": m.tipo,
            "url": m.url,
        }
        for m in materiales
    ]
    return respuesta_ok(data, "Materiales consultados")


@app.post("/api/v1/herramientas/materiales-referencia", status_code=201)
def crear_material(
    datos: MaterialCreateSchema,
    db: Session = Depends(get_db),
    _: None = Depends(verificar_admin),
):
    mat = MaterialReferencia(**datos.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return respuesta_ok(
        {
            "id_material": mat.id_material,
            "titulo": mat.titulo,
            "descripcion": mat.descripcion,
            "tipo": mat.tipo,
            "url": mat.url,
        },
        "Material registrado",
    )


@app.get("/api/v1/herramientas/consulta-externa")
def consulta_externa(
    q: Optional[str] = None,
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return listar_herramientas(q=q, categoria=categoria, modelo_costo=None, db=db)