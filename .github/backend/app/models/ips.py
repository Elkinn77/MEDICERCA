"""Registro central de IPS y afiliaciones con vigencia.

La base central conoce a qu\u00e9 IPS dirigir cada solicitud, pero no guarda
historias cl\u00ednicas, inventarios ni las contrase\u00f1as de sus conexiones.
"""
import enum
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class TipoIntegracionIPS(str, enum.Enum):
    BASE_DATOS_DIRECTA = "base_datos_directa"
    API = "api"


class InstitucionPrestadora(Base):
    """Una IPS habilitada para interoperar con MediCerca."""

    __tablename__ = "ips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    nombre_ficticio: Mapped[str] = mapped_column(String(150), unique=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    tipo_integracion: Mapped[TipoIntegracionIPS] = mapped_column(
        Enum(TipoIntegracionIPS), default=TipoIntegracionIPS.BASE_DATOS_DIRECTA
    )
    # Ej.: "demo_ips_1". El secreto real queda en las variables de entorno.
    clave_conexion: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    endpoint_api: Mapped[str | None] = mapped_column(String(300), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    afiliaciones: Mapped[list["AfiliacionUsuario"]] = relationship(back_populates="ips")


class AfiliacionUsuario(Base):
    """Historial de pertenencia de un paciente a una IPS."""

    __tablename__ = "afiliacion_usuario"
    __table_args__ = (
        CheckConstraint(
            "vigente_hasta IS NULL OR vigente_hasta >= vigente_desde",
            name="ck_afiliacion_fechas_validas",
        ),
        Index("ix_afiliacion_usuario_estado", "usuario_id", "activa"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuario.id"), index=True)
    ips_id: Mapped[int] = mapped_column(ForeignKey("ips.id"), index=True)
    identificador_paciente_ips: Mapped[str | None] = mapped_column(String(80), nullable=True)
    vigente_desde: Mapped[date] = mapped_column(Date, default=date.today)
    vigente_hasta: Mapped[date | None] = mapped_column(Date, nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    usuario: Mapped["Usuario"] = relationship(back_populates="afiliaciones")
    ips: Mapped["InstitucionPrestadora"] = relationship(back_populates="afiliaciones")
