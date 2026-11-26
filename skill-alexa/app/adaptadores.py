from datetime import datetime

from app.modelos import CasoVoz, Usuario

_CLAVES_NOMBRE = ("nombre", "nombre_completo", "nombre_corto")
_CLAVES_MENSAJE = ("mensaje", "texto", "descripcion")


def desenvolver(payload: object) -> object:
    if (
        isinstance(payload, dict)
        and "data" in payload
        and payload.get("ok") is True
    ):
        return payload["data"]
    return payload


def adaptar_usuario(payload: object) -> Usuario:
    datos = desenvolver(payload)
    if not isinstance(datos, dict):
        return Usuario(id_usuario=None, nombre=None)
    nombre = None
    for clave in ("nombre_corto", "nombre", "nombres"):
        valor = datos.get(clave)
        if isinstance(valor, str) and valor.strip():
            nombre = valor.strip()
            break
    id_usuario = datos.get("id_usuario", datos.get("id"))
    if isinstance(id_usuario, bool) or not isinstance(id_usuario, int):
        id_usuario = None
    return Usuario(id_usuario=id_usuario, nombre=nombre)


def adaptar_caso(payload: object, numero: int) -> CasoVoz | None:
    datos = desenvolver(payload)
    if not isinstance(datos, dict):
        return None

    if isinstance(datos.get("investigadores"), list):
        investigadores = [
            item.strip()
            for item in datos["investigadores"]
            if isinstance(item, str) and item.strip()
        ]
        sin_nombre = 0
        descripcion = datos.get("descripcion") or datos.get("titulo") or ""
        estatus = datos.get("estatus") or ""
    else:
        descripcion = _elegir_descripcion(datos)
        estatus = datos.get("estatus") or ""
        investigadores, sin_nombre = _de_asignaciones(datos.get("asignaciones"))

    if (
        not str(descripcion).strip()
        and not str(estatus).strip()
        and not investigadores
        and sin_nombre == 0
        and "id_caso" not in datos
        and "id" not in datos
    ):
        return None

    return CasoVoz(
        numero=numero,
        descripcion=str(descripcion or ""),
        estatus=str(estatus or ""),
        investigadores=investigadores,
        id_caso=_entero(datos.get("id_caso", datos.get("id"))),
        investigadores_sin_nombre=sin_nombre,
    )


def adaptar_alertas(payload: object) -> list[str] | None:
    datos = desenvolver(payload)
    if isinstance(datos, dict):
        crudas = datos.get("alertas", datos.get("notificaciones"))
    elif isinstance(datos, list):
        crudas = datos
    else:
        return None
    if not isinstance(crudas, list):
        return None

    mensajes: list[str] = []
    for item in crudas:
        if isinstance(item, str) and item.strip():
            mensajes.append(item.strip())
            continue
        if not isinstance(item, dict):
            continue
        for clave in _CLAVES_MENSAJE:
            valor = item.get(clave)
            if isinstance(valor, str) and valor.strip():
                mensajes.append(valor.strip())
                break
    return mensajes


def candidatos_folio(numero: int, anio: int | None = None) -> list[str]:
    year = anio or datetime.now().year
    cuatro = f"{numero:04d}"
    vistos: list[str] = []
    for folio in (
        str(numero),
        f"UDINT-{year}-{cuatro}",
        f"UDINT-{year}-{numero}",
        f"UDINT-{year - 1}-{cuatro}",
    ):
        if folio not in vistos:
            vistos.append(folio)
    return vistos


def _elegir_descripcion(datos: dict) -> str:
    descripcion = str(datos.get("descripcion") or "").strip()
    titulo = str(datos.get("titulo") or "").strip()
    breve = descripcion and len(descripcion) <= 140
    limpia = "@" not in descripcion and "http" not in descripcion.lower()
    if breve and limpia:
        return descripcion
    return titulo or descripcion


def _de_asignaciones(asignaciones: object) -> tuple[list[str], int]:
    if not isinstance(asignaciones, list):
        return [], 0
    nombres: list[str] = []
    sin_nombre = 0
    for asignacion in asignaciones:
        if not isinstance(asignacion, dict):
            continue
        if asignacion.get("activo") is False:
            continue
        rol = str(asignacion.get("rol_en_caso") or "INVESTIGADOR").upper()
        if rol != "INVESTIGADOR":
            continue
        nombre = _primer_texto(asignacion, _CLAVES_NOMBRE)
        if nombre:
            nombres.append(nombre)
        else:
            sin_nombre += 1
    return nombres, sin_nombre


def _primer_texto(datos: dict, claves: tuple[str, ...]) -> str | None:
    for clave in claves:
        valor = datos.get(clave)
        if isinstance(valor, str) and valor.strip():
            return valor.strip()
    return None


def _entero(valor: object) -> int | None:
    if isinstance(valor, bool) or not isinstance(valor, int):
        return None
    return valor
