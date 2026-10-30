import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.api.v1.routes import admin, auth, disponibilidad, domicilios, historia_clinica, ips, medicamentos, ordenes
from app.config import settings
from app.core.rate_limit import limiter
from app.database import Base, SessionLocal, engine
from app.ips_db import crear_tablas_ips_registradas, obtener_engine_ips
from app.models.ips import InstitucionPrestadora
import app.models  # noqa: F401 - register central models before metadata use

logger = logging.getLogger(__name__)

# Falla rápido si esto es un despliegue real y quedaron secretos de ejemplo.
settings.verificar_config_produccion()


def preparar_esquema_local() -> None:
    """Convenience bootstrap for local Docker demos; production uses Alembic."""
    if not settings.auto_create_schema:
        return
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        crear_tablas_ips_registradas(db.query(InstitucionPrestadora).filter(InstitucionPrestadora.activa.is_(True)).all())
    finally:
        db.close()


preparar_esquema_local()

app = FastAPI(
    title=settings.app_name,
    description=(
        "Gateway de interoperabilidad: identidad, registro de IPS y afiliaciones en una base central; "
        "datos clinicos e inventario en sistemas independientes por IPS."
    ),
    version="0.3.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Key"],
)


@app.exception_handler(Exception)
async def manejador_global_de_errores(request: Request, exc: Exception) -> JSONResponse:
    """Última red de seguridad: sin esto, un error no controlado (ej. una IPS
    caída o un fallo de conexión a la BD) devuelve el stack trace por defecto
    de Starlette en vez de una respuesta JSON controlada, filtrando detalles
    internos (rutas de archivo, nombres de tablas, etc.) a quien hizo la
    petición. El detalle completo sí queda registrado en el log del servidor
    para poder diagnosticarlo.

    No intercepta `HTTPException` ni `RequestValidationError`: esos ya tienen
    manejadores propios más específicos (de FastAPI) que se evalúan antes que
    este; este solo atrapa lo verdaderamente no controlado.
    """
    logger.exception("Error no controlado atendiendo %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Intenta de nuevo más tarde."},
    )


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(medicamentos.router)
app.include_router(ordenes.router)
app.include_router(disponibilidad.router)
app.include_router(domicilios.router)
app.include_router(historia_clinica.router)
app.include_router(ips.router)


@app.get("/api/v1/health", tags=["health"])
def health():
    """Verifica conectividad real contra las 4 bases de datos (central + 3 IPS),
    no solo que el proceso esté vivo. Útil para healthchecks de orquestación
    (docker-compose, k8s) que deben saber si el backend puede servir tráfico."""

    def _conexion_ok(motor) -> bool:
        try:
            with motor.connect() as conexion:
                conexion.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    bases_de_datos = {"central": _conexion_ok(engine)}
    for clave in settings.ips_connection_registry:
        bases_de_datos[clave] = _conexion_ok(obtener_engine_ips(clave))

    saludable = all(bases_de_datos.values())
    contenido = {"status": "ok" if saludable else "degraded", "app": settings.app_name, "bases_de_datos": bases_de_datos}
    return JSONResponse(status_code=200 if saludable else 503, content=contenido)
