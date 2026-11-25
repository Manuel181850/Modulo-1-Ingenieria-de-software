import csv
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Herramienta

RUTA_CSV_DEFECTO = Path("data/catalogo_herramientas_osint_eq06.csv")
RUTA_CSV_RAIZ = Path("catalogo_herramientas_osint_eq06.csv")


def importar_csv(db: Session):
    ruta = RUTA_CSV_DEFECTO if RUTA_CSV_DEFECTO.exists() else RUTA_CSV_RAIZ
    with ruta.open("r", encoding="utf-8-sig") as archivo:
        for fila in csv.DictReader(archivo):
            nombre = fila["nombre"].strip()
            existe = (
                db.query(Herramienta).filter(Herramienta.nombre == nombre).first()
            )
            datos = {
                "nombre": nombre,
                "descripcion": fila["descripcion"].strip(),
                "categoria": fila["categoria"].strip(),
                "url": fila["url"].strip(),
                "tipo_dato_entrada": fila["tipo_dato_entrada"].strip(),
                "modelo_costo": fila["modelo_costo"].strip(),
                "notas_uso_etico_legal": fila["notas_uso_etico_legal"].strip(),
                "activa": True,
            }
            if existe:
                for clave, valor in datos.items():
                    setattr(existe, clave, valor)
            else:
                db.add(Herramienta(**datos))
    db.commit()