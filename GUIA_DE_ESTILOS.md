# Guía de Estilos y Convenciones — Plataforma UDINT

Este documento establece los estándares visuales, de código y de integración para todos los módulos de la plataforma **UDINT** (Unidad de Investigación e Inteligencia OSINT).

---

## 1. (UI / Frontend)

El frontend se desarrolla en **React + Vite + Tailwind CSS**. Todos los módulos deben respetar esta línea gráfica para mantener uniformidad entre pantallas.

### 1.1 Paleta de Colores (Tema Oscuro OSINT)
* **Fondo principal (App):** `bg-slate-950` (`#020617`)
* **Superficies, tarjetas y modales:** `bg-slate-900` (`#0F172A`)
* **Bordes y divisores:** `border-slate-800` (`#1E293B`)
* **Texto principal:** `text-slate-100` (`#F1F5F9`)
* **Texto secundario / etiquetas:** `text-slate-400` (`#94A3B8`)
* **Color primario (Botones principales, enlaces activos):** `bg-cyan-600 hover:bg-cyan-500` (`#0891B2` / `#06B6D4`)

### 1.2 Colores Semánticos (Estados y Prioridades)
Para mantener consistencia con el esquema de casos, usar siempre estas etiquetas (*badges*):

* **Prioridades:**
  * `BAJA`: `bg-emerald-500/10 text-emerald-400 border-emerald-500/30`
  * `MEDIA`: `bg-amber-500/10 text-amber-400 border-amber-500/30`
  * `ALTA`: `bg-orange-500/10 text-orange-400 border-orange-500/30`
  * `CRITICA`: `bg-rose-500/10 text-rose-400 border-rose-500/30`
* **Estatus de caso:**
  * `ABIERTO`: `bg-emerald-500/10 text-emerald-400`
  * `EN INVESTIGACION`: `bg-sky-500/10 text-sky-400`
  * `EN PAUSA`: `bg-amber-500/10 text-amber-400`
  * `CERRADO`: `bg-slate-700/40 text-slate-300`

### 1.3 Tipografía e Iconografía
* **Fuente general:** `Inter` (sans-serif).
* **Fuente técnica:** `JetBrains Mono` o `font-mono` de Tailwind para folios (`UDINT-2026-0001`), direcciones IP, dominios, correos y hashes.
* **Iconos:** Librería **Lucide React** (`lucide-react`) con tamaño estándar `w-4 h-4` en botones y `w-5 h-5` en navegación.

### 1.4 Estructura de Pantalla (Layout)
* Cada módulo debe renderizar únicamente su área de contenido principal (sin crear barras laterales ni headers globales duplicados; el *Sidebar* y *Navbar* maestros los provee el cascarón principal).
* **Border radius:** `rounded-lg` para tarjetas/paneles y `rounded-md` para inputs y botones.

---

## 2. Convenciones de Código y Nomenclatura

### 2.1 Base de Datos (PostgreSQL)
* **Idioma y formato:** `snake_case` en español, nombres de tablas en plural (`casos`, `usuarios`, `evidencias`).
* **Llaves primarias y foráneas:** Tipo `SERIAL` / `INT` con prefijo `id_` (ej. `id_caso`, `id_usuario`).
* **Tablas auxiliares por equipo:** Usar prefijo de módulo (ej. `chatbot_sesiones`, `ai.fuentes`) para evitar colisiones.
* **Migraciones:** Archivos `.sql` numerados o identificados por equipo dentro de `/database/migrations/`.

### 2.2 Backend (Python + FastAPI)
* **Formato:** PEP 8 con formateador **Black** y linter **Ruff** (longitud máxima de línea: 88 caracteres).
* **Nomenclatura:**
  * Variables, funciones y archivos: `snake_case` (ej. `obtener_caso_por_id.py`).
  * Clases y esquemas Pydantic: `PascalCase` (ej. `CasoCreateSchema`).
  * Constantes: `UPPER_SNAKE_CASE`.

### 2.3 Frontend (React)
* **Formato:** **Prettier** + **ESLint** (comillas simples, punto y coma opcional consistente, indentación de 2 espacios).
* **Nomenclatura:**
  * Componentes y archivos JSX/TSX: `PascalCase` (ej. `DetalleCaso.jsx`).
  * Hooks personalizados: `camelCase` iniciando con `use` (ej. `useCasos.js`).
  * Variables y funciones: `camelCase`.

---

## 3. Contratos de APIs REST

* **Prefijo base:** `/api/v1/<modulo>/<recurso>` (todo en minúsculas y plural, separado por guiones medios si hay dos palabras, ej. `/api/v1/casos/historial-estatus`).
* **Formato de intercambio:** `application/json` con campos en `snake_case` para empatar directo con la base de datos.
* **Estructura estándar de respuesta exitosa:**
  ```json
  {
    "ok": true,
    "data": {},
    "mensaje": "Operación realizada correctamente"
  }
