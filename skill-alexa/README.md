# UDINT — Skill de Alexa (Equipo 11)

Canal de voz para consultar un caso y escuchar las alertas de la cuenta vinculada. No modifica expedientes y no pide la contraseña: esa se escribe en la página de vinculación del equipo 2.

El modo por defecto usa el caso ficticio **1042** (correo institucional comprometido, Ana Ruiz y Luis Pérez). No llama a la plataforma.

## Correr las pruebas

Desde esta carpeta:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest
python -m app.ensayo
```

## Endpoint

```powershell
uvicorn app.main:app --reload --port 8001
```

- `GET /health`
- `POST /api/v1/alexa` recibe el JSON del Alexa Skills Kit y regresa la frase.

## Qué se le puede decir

Invocación: «Alexa, abre UDINT».

| Se dice | Alexa responde |
| --- | --- |
| consulta el caso 1042 | descripción breve, estatus e investigadores |
| estatus del caso 1042 | solo el estatus |
| quién lleva el caso 1042 | solo los investigadores |
| mis alertas | las alertas de esa cuenta, de una en una; «siguiente» continúa |
| repite / ayuda / cancela | repite la última frase, dice las opciones o cierra |

Si el número no se entiende, pregunta «¿Dijiste caso …?» y no consulta hasta el sí. Si no hay cuenta, permiso o el caso no existe, lo dice y no lee el expediente.

## Cuentas de prueba

En el simulador, antes de tener el OAuth del equipo 2, hay que pegar el token en el JSON de la petición (`session.user.accessToken` y `context.System.user.accessToken`):

| accessToken | Qué pasa |
| --- | --- |
| `token-ana` | Ve el caso 1042 y tiene una alerta |
| `token-sin-permiso` | El caso existe, pero no puede verlo |
| `token-sin-alertas` | Ve el caso y no tiene alertas |
| `token-varias-alertas` | Tres alertas, de la más reciente a la más antigua |
| vacío o cualquier otro | Pide vincular la cuenta y no consulta |

## Consola de Alexa

1. Crear una skill custom en **español (México)**.
2. Nombre de invocación: `udint`. Si la consola rechaza la sigla, usar `plataforma udint`.
3. En el editor JSON, cargar `skill-package/interactionModels/custom/es-MX.json` y construir el modelo.
4. Endpoint HTTPS: `https://<tu-host>/api/v1/alexa`.
5. Account Linking, cuando el equipo 2 publique OAuth: tipo Auth Code Grant. La skill solo reenvía el access token; no hay formulario de contraseña aquí.

## Conectar la plataforma

En `.env` (partir de `.env.example`):

```text
MODO_DATOS=plataforma
CASOS_BASE_URL=http://localhost:8000
ALERTAS_BASE_URL=http://localhost:8000
USUARIOS_BASE_URL=http://localhost:8000
BITACORA_BASE_URL=http://localhost:8000
ALEXA_SKILL_ID=
```

Consume:

- `GET /api/v1/casos/{folio}` con el folio `UDINT-<año>-<número>` y el número dicho.
- `GET /api/v1/notificaciones/mis-alertas`
- `GET /api/v1/usuarios/me`
- `POST /api/v1/bitacora` con `accion`, `caso_id`, `id_caso`, `id_usuario`, `modulo` y `timestamp`.

La API de casos que ya está en este repositorio identifica el folio, no el nombre de los investigadores. Hasta que el equipo 2 entregue el nombre y el 403, la frase dice que hay investigadores asignados y no inventa nombres. Un 403 no se lee en voz alta.

Las notificaciones proactivas (RF-11.07, prioridad «podría») quedan fuera de esta entrega.

Los identificadores de la skill y las URLs viven en el entorno, no en el código. Hay que declarar el uso de asistencia de IA en el manual técnico y poder explicar este flujo en la demo.
