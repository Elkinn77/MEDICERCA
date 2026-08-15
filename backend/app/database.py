"""
Conexión a la base de datos central y sesión de SQLAlchemy.

La base central guarda: usuarios, EPS, catálogo de medicamentos (nacional).
Los datos propios de cada IPS (puntos de venta, inventario, historia
clínica, domicilios) viven en bases de datos SEPARADAS — ver app/ips_db.py.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Modelos de la base de datos CENTRAL (usuario, eps, medicamento, código de verificación)."""
    pass


def get_db():
    """Dependencia de FastAPI: entrega una sesión de la BD central por request y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

