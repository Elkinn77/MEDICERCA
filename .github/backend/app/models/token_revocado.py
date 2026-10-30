"""Lista de revocación de tokens (denylist) para permitir logout con JWT.

Un JWT es stateless por diseño: la API no puede "borrarlo" del lado del cliente.
Lo único que puede hacer un logout real es marcar ese token específico como
inválido del lado del servidor hasta que hubiera expirado de todas formas —
que es exactamente lo que hace esta tabla, indexada por el `jti` (JWT ID)
único de cada token emitido.
"""
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TokenRevocado(Base):
    __tablename__ = "token_revocado"

    jti: Mapped[str] = mapped_column(String(32), primary_key=True)
    # Igual al 'exp' original del token. Sirve para poder purgar filas viejas
    # sin tener que decodificar cada token de nuevo (ver auth.logout).
    expira_en: Mapped[datetime] = mapped_column(DateTime, index=True)
