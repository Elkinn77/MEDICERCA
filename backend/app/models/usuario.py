import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.ips import AfiliacionUsuario


class RolUsuario(str, enum.Enum):
    """
    PACIENTE: consulta catálogo/disponibilidad, sube fórmulas, pide domicilio.
    REGENTE: aprueba/rechaza órdenes médicas y administra el catálogo de SU IPS.
    (Nombre real en Colombia: 'regente de farmacia', el profesional que autoriza
    la dispensación — de ahí el nombre del rol.)
    """
    PACIENTE = "paciente"
    REGENTE = "regente"


class EPS(Base):
    """EPS ficticia (aseguradora) — quien paga, no quien tiene la historia clínica."""
    __tablename__ = "eps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre_ficticio: Mapped[str] = mapped_column(String(120), unique=True)

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="eps")


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    cedula: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    correo: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[RolUsuario] = mapped_column(Enum(RolUsuario), default=RolUsuario.PACIENTE)

    eps_id: Mapped[int | None] = mapped_column(ForeignKey("eps.id"), nullable=True)
    # A qué IPS está afiliado (1, 2 o 3 — ver app.config.settings.ips_registry).
    # Ahí vive su historia clínica simulada, no en esta base central.
    # Campo de compatibilidad para los datos creados antes de introducir el
    # historial de afiliaciones. Las nuevas consultas usan AfiliacionUsuario.
    ips_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    verificado: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Bloqueo por fuerza bruta de login — ver app.api.v1.routes.auth.login.
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    eps: Mapped["EPS"] = relationship(back_populates="usuarios")
    afiliaciones: Mapped[list["AfiliacionUsuario"]] = relationship(back_populates="usuario")
