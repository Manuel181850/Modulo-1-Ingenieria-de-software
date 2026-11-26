from app.modelos import CasoVoz, ResultadoAlertas, ResultadoCaso, Usuario

CASO_EJEMPLO = CasoVoz(
    numero=1042,
    descripcion="Correo institucional comprometido",
    estatus="EN INVESTIGACION",
    investigadores=["Ana Ruiz", "Luis Pérez"],
    id_caso=1042,
)

_CASOS = {1042: CASO_EJEMPLO}


class FuenteEjemplo:
    """Caso ficticio del docente. No llama a la plataforma ni guarda contraseñas."""

    def __init__(self) -> None:
        self.eventos: list[dict] = []
        self._usuarios = {
            "token-ana": _persona(
                1,
                "Ana",
                puede_ver={1042},
                alertas=["Te asignaron el caso 1042."],
            ),
            "token-sin-permiso": _persona(
                2,
                "Luis",
                puede_ver=set(),
                alertas=["Te asignaron el caso 1042."],
            ),
            "token-sin-alertas": _persona(3, "Ana", puede_ver={1042}, alertas=[]),
            "token-varias-alertas": _persona(
                4,
                "Ana",
                puede_ver={1042},
                alertas=[
                    "Te asignaron el caso 1042.",
                    "El caso 1042 tiene evidencia nueva.",
                    "El caso 1042 cambió de estatus.",
                ],
            ),
        }

    def usuario(self, token: str) -> Usuario | None:
        persona = self._usuarios.get(token)
        if persona is None:
            return None
        return persona["usuario"]

    def caso(self, token: str, numero: int) -> ResultadoCaso:
        persona = self._usuarios.get(token)
        caso = _CASOS.get(numero)
        if caso is None:
            return ResultadoCaso("inexistente")
        if persona is None or numero not in persona["puede_ver"]:
            return ResultadoCaso("prohibido")
        return ResultadoCaso("ok", caso)

    def alertas(self, token: str) -> ResultadoAlertas:
        persona = self._usuarios.get(token)
        if persona is None:
            return ResultadoAlertas("no_autorizado")
        return ResultadoAlertas("ok", list(persona["alertas"]))

    def registrar(self, evento: dict) -> None:
        self.eventos.append(dict(evento))


def _persona(
    id_usuario: int, nombre: str, puede_ver: set[int], alertas: list[str]
) -> dict:
    return {
        "usuario": Usuario(id_usuario=id_usuario, nombre=nombre),
        "puede_ver": puede_ver,
        "alertas": alertas,
    }
