from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, casos

app = FastAPI(
    title="UDINT - Módulo Administración de Casos (Equipo 3)",
    version="1.0.0",
    description="API REST para gestión de expedientes OSINT, folios, estatus y asignaciones.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(casos.router)
app.include_router(admin.router)


@app.get("/health", tags=["Sistema"])
def health_check():
    return {"status": "ok", "modulo": "administracion-casos-eq03"}