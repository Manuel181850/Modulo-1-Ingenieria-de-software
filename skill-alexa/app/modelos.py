from dataclasses import dataclass, field
from typing import Literal, Protocol

TipoCaso = Literal["ok", "prohibido", "inexistente", "no_autorizado", "error"]
TipoAlertas = Literal["ok", "no_autorizado", "error"]


@dataclass(frozen=True)
class Usuario:
    id_usuario: int | None
    nombre: str | None


@dataclass(frozen=True)
class CasoVoz:
    numero: int
    descripcion: str
    estatus: str
    investigadores: list[str]
    id_caso: int | None = None
    investigadores_sin_nombre: int = 0


@dataclass(frozen=True)
class ResultadoCaso:
    tipo: TipoCaso
    caso: CasoVoz | None = None


@dataclass(frozen=True)
class ResultadoAlertas:
    tipo: TipoAlertas
    mensajes: list[str] = field(default_factory=list)


class FuenteDatos(Protocol):
    def usuario(self, token: str) -> Usuario | None: ...

    def caso(self, token: str, numero: int) -> ResultadoCaso: ...

    def alertas(self, token: str) -> ResultadoAlertas: ...

    def registrar(self, evento: dict) -> None: ...
