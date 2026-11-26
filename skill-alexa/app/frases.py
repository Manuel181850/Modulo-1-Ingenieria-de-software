import re

REPROMPT = "Puedes consultar un caso o escuchar tus alertas."
REPROMPT_AYUDA = "Por ejemplo, di: consulta el caso mil cuarenta y dos."
REPROMPT_SIGUIENTE = "Di siguiente para oír otra alerta."

_ARTICULOS = ("un ", "una ", "el ", "la ", "los ", "las ", "unos ", "unas ")
_NOMBRE = re.compile(
    r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]{0,58}$"
)
_EMAIL = re.compile(r"\b[\w.+-]+@[\w.-]+\.\w+\b")
_URL = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_IP = re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b")
_TELEFONO = re.compile(r"\b\d{10,}\b")
_ESTATUS = {
    "ABIERTO": "abierto",
    "EN INVESTIGACION": "en investigación",
    "EN PAUSA": "en pausa",
    "CERRADO": "cerrado",
}
_CANTIDADES = {
    2: "dos",
    3: "tres",
    4: "cuatro",
    5: "cinco",
    6: "seis",
    7: "siete",
    8: "ocho",
    9: "nueve",
    10: "diez",
}


def oraciones(texto: str) -> list[str]:
    partes = re.split(r"(?<=[.!?])\s+", texto.strip())
    return [parte for parte in partes if parte]


def saludo(nombre: str | None) -> str:
    corto = nombre_hablado(nombre)
    if corto:
        return (
            f"Hola, {corto}. Puedes consultar un caso o escuchar tus alertas."
        )
    return "Hola. Puedes consultar un caso o escuchar tus alertas."


def vincular_cuenta() -> str:
    return (
        "Vincula tu cuenta de UDINT en la aplicación de Alexa. "
        "La contraseña se escribe en la página, no me la dictes."
    )


def frase_caso(
    numero: int,
    descripcion: str,
    estatus: str,
    investigadores: list[str],
    investigadores_sin_nombre: int = 0,
) -> str:
    desc = descripcion_hablada(descripcion)
    estado = estatus_hablado(estatus)
    primera = f"El caso {numero} trata de {desc} y está {estado}."
    segunda = _segunda_investigadores(investigadores, investigadores_sin_nombre)
    return f"{primera} {segunda}"


def frase_estatus(numero: int, estatus: str) -> str:
    return f"El caso {numero} está {estatus_hablado(estatus)}."


def frase_investigadores(
    numero: int,
    investigadores: list[str],
    investigadores_sin_nombre: int = 0,
) -> str:
    hablados = nombres_hablados(investigadores)
    if not hablados and (investigadores or investigadores_sin_nombre):
        return f"El caso {numero} tiene investigadores asignados."
    if not hablados:
        return f"El caso {numero} aún no tiene investigadores asignados."
    if len(hablados) == 1:
        return f"El caso {numero} lo lleva {hablados[0]}."
    return f"El caso {numero} lo llevan {_lista_nombres(hablados)}."


def sin_permiso(numero: int) -> str:
    return f"No tienes permiso para consultar el caso {numero}."


def caso_inexistente(numero: int) -> str:
    return f"No existe el caso {numero}."


def error_consulta() -> str:
    return (
        "No pude consultar el caso en este momento. "
        "Inténtalo de nuevo más tarde."
    )


def error_alertas() -> str:
    return "No pude consultar tus alertas en este momento."


def error_inesperado() -> str:
    return "No pude completar la consulta. Inténtalo de nuevo más tarde."


def sesion_invalida() -> str:
    return (
        "Tu sesión ya no es válida. "
        "Vincula de nuevo tu cuenta en la aplicación de Alexa."
    )


def frase_alertas(mensajes: list[str]) -> str:
    primera = mensaje_alerta(mensajes[0])
    if len(mensajes) == 1:
        return f"Tienes una alerta: {primera}."
    cantidad = _CANTIDADES.get(len(mensajes), str(len(mensajes)))
    return (
        f"Tienes {cantidad} alertas y la más reciente es: {primera}. "
        "Di siguiente para oír otra."
    )


def frase_alerta_siguiente(mensaje: str, es_ultima: bool) -> str:
    texto = mensaje_alerta(mensaje)
    if es_ultima:
        return f"La última alerta: {texto}."
    return f"La siguiente alerta: {texto}. Di siguiente para oír otra."


def sin_alertas() -> str:
    return "No tienes alertas."


def alertas_terminadas() -> str:
    return "Esas eran todas tus alertas."


def sin_lectura_de_alertas() -> str:
    return "No estoy leyendo alertas. Di mis alertas para empezar."


def confirmacion_numero(numero: int) -> str:
    return f"¿Dijiste caso {numero}?"


def pedir_numero() -> str:
    return "¿Cuál es el número de caso?"


def numero_negado() -> str:
    return "De acuerdo. Dime el número de caso otra vez."


def nada_que_confirmar() -> str:
    return (
        "No hay nada que confirmar. "
        "Puedes consultar un caso o escuchar tus alertas."
    )


def ayuda() -> str:
    return (
        "Puedes consultar un caso, su estatus, sus investigadores "
        "o escuchar tus alertas."
    )


def despedida() -> str:
    return "Hasta luego."


def no_entendi() -> str:
    return (
        "No entendí. Puedes consultar un caso por su número "
        "o escuchar tus alertas."
    )


def repetir_vacio() -> str:
    return (
        "No tengo una frase para repetir. "
        "Puedes consultar un caso o escuchar tus alertas."
    )


def nombre_hablado(nombre: str | None) -> str | None:
    if not nombre:
        return None
    texto = " ".join(str(nombre).split())
    if not _NOMBRE.match(texto):
        return None
    return texto.split()[0]


def descripcion_hablada(texto: str) -> str:
    limpio = _limpiar_sensible(texto)
    if not limpio:
        return "un asunto sin descripción breve"
    punto = re.search(r"[.!?]", limpio)
    if punto and punto.start() > 0:
        limpio = limpio[: punto.start()]
    limpio = _recortar(limpio, 120)
    if not limpio.lower().startswith(_ARTICULOS):
        return "un " + limpio[0].lower() + limpio[1:]
    return limpio[0].lower() + limpio[1:]


def estatus_hablado(estatus: str) -> str:
    clave = _sin_acentos(" ".join(str(estatus).split()).upper())
    if clave in _ESTATUS:
        return _ESTATUS[clave]
    palabras = " ".join(str(estatus).split())
    if re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,40}", palabras):
        return palabras.lower()
    return "en un estatus no disponible"


def nombres_hablados(nombres: list[str]) -> list[str]:
    limpios: list[str] = []
    for nombre in nombres:
        texto = " ".join(str(nombre).split())
        if _NOMBRE.match(texto):
            limpios.append(texto)
    return limpios


def mensaje_alerta(texto: str) -> str:
    limpio = _limpiar_sensible(texto).rstrip(".")
    if not limpio:
        return "hay una novedad en tus casos"
    return limpio[0].lower() + limpio[1:]


def _segunda_investigadores(
    investigadores: list[str], investigadores_sin_nombre: int
) -> str:
    hablados = nombres_hablados(investigadores)
    if not hablados and (investigadores or investigadores_sin_nombre):
        return "Tiene investigadores asignados."
    if not hablados:
        return "Aún no tiene investigadores asignados."
    if len(hablados) == 1:
        return f"Lo lleva {hablados[0]}."
    return f"Lo llevan {_lista_nombres(hablados)}."


def _lista_nombres(nombres: list[str]) -> str:
    if len(nombres) == 2:
        return f"{nombres[0]} y {nombres[1]}"
    if len(nombres) == 3:
        return f"{nombres[0]}, {nombres[1]} y {nombres[2]}"
    resto = len(nombres) - 2
    otros = "otro más" if resto == 1 else f"otros {resto}"
    return f"{nombres[0]}, {nombres[1]} y {otros}"


def _limpiar_sensible(texto: str) -> str:
    limpio = str(texto or "")
    limpio = _EMAIL.sub(" ", limpio)
    limpio = _URL.sub(" ", limpio)
    limpio = _IP.sub(" ", limpio)
    limpio = _TELEFONO.sub(" ", limpio)
    return " ".join(limpio.split())


def _recortar(texto: str, limite: int) -> str:
    if len(texto) <= limite:
        return texto
    corte = texto[:limite].rsplit(" ", 1)[0]
    return corte.rstrip(" ,;:")


def _sin_acentos(texto: str) -> str:
    cambios = str.maketrans("ÁÉÍÓÚÜ", "AEIOUU")
    return texto.translate(cambios)
