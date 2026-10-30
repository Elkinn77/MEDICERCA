import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PropositoCodigo(str, enum.Enum):
    REGISTRO = "registro"
    CAMBIO_PASSWORD = "cambio_password"  # nosec B105 - etiqueta de proposito, no una credencial


class CodigoVerificacion(Base):
    """Código OTP de 6 dígitos, ligado a un correo y a un propósito, con vencimiento."""
    __tablename__ = "codigo_verificacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    correo: Mapped[str] = mapped_column(String(160), index=True)
    codigo: Mapped[str] = mapped_column(String(6))
    proposito: Mapped[PropositoCodigo] = mapped_column(Enum(PropositoCodigo))
    expira_en: Mapped[datetime] = mapped_column(DateTime)
    usado: Mapped[bool] = mapped_column(Boolean, default=False)
    # Intentos de verificación fallidos contra ESTE código. Ver app.core.otp.MAX_INTENTOS_CODIGO:
    # al llegar al límite el código se quema, aunque no haya vencido ni se haya usado.
    intentos: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
