"""
Modelos que viven DENTRO de cada base de datos de IPS (no en la central).

Nota importante: `medicamento_id` aquí es una referencia "suelta" (no FK real
entre bases de datos) al id del medicamento en el catálogo central. Esto es
intencional: así funciona la interoperabilidad real — cada sistema referencia
por un identificador común (aquí, el id; en la vida real sería el código
INVIMA), sin tener acceso directo a la base de datos del otro sistema.
"""
import enum
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.ips_db import IPSBase


class PuntoVenta(IPSBase):
    """Sede/droguería aliada de ESTA IPS (ej. 'FarmaCentro Chapinero')."""
    __tablename__ = "punto_venta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    ciudad: Mapped[str] = mapped_column(String(80), index=True)
    direccion: Mapped[str] = mapped_column(String(200))
    lat: Mapped[float] = mapped_column(Numeric(9, 6))
    lng: Mapped[float] = mapped_column(Numeric(9, 6))

    inventario: Mapped[list["Inventario"]] = relationship(back_populates="punto")


class Inventario(IPSBase):
    __tablename__ = "inventario"

    punto_id: Mapped[int] = mapped_column(ForeignKey("punto_venta.id"), primary_key=True)
    medicamento_id: Mapped[int] = mapped_column(Integer, primary_key=True)  # referencia al catálogo central
    cantidad: Mapped[int] = mapped_column(Integer, default=0)
    fecha_reabastecimiento: Mapped[date | None] = mapped_column(Date, nullable=True)

    punto: Mapped["PuntoVenta"] = relationship(back_populates="inventario")


class HistoriaClinica(IPSBase):
    """
    Historia clínica simulada del paciente EN ESTA IPS.
    Se busca por cédula (no por id de usuario), porque en la vida real la
    identidad del paciente en el sistema de MediCerca y su historia en la
    IPS son dos sistemas distintos que se cruzan por documento de identidad.
    """
    __tablename__ = "historia_clinica"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cedula: Mapped[str] = mapped_column(String(20), index=True)
    diagnostico_simulado: Mapped[str] = mapped_column(String(200))
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    prescripciones: Mapped[list["PrescripcionActiva"]] = relationship(back_populates="historia")


class PrescripcionActiva(IPSBase):
    """Medicamento formulado vigente dentro de la historia clínica de esta IPS."""
    __tablename__ = "prescripcion_activa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    historia_id: Mapped[int] = mapped_column(ForeignKey("historia_clinica.id"))
    medicamento_id: Mapped[int] = mapped_column(Integer)  # referencia al catálogo central
    fecha_formula: Mapped[date] = mapped_column(Date)
    vigente: Mapped[bool] = mapped_column(Boolean, default=True)

    historia: Mapped["HistoriaClinica"] = relationship(back_populates="prescripciones")


class EstadoOrden(str, enum.Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"


class EstadoDomicilio(str, enum.Enum):
    CONFIRMADO = "confirmado"
    EN_ALISTAMIENTO = "en_alistamiento"
    EN_CAMINO = "en_camino"
    ENTREGADO = "entregado"


class OrdenMedica(IPSBase):
    """Fórmula médica dentro de esta IPS. usuario_cedula referencia al paciente por documento."""
    __tablename__ = "orden_medica"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_cedula: Mapped[str] = mapped_column(String(20), index=True)
    archivo_url: Mapped[str] = mapped_column(String(300))
    # Referencia "suelta" (no FK real, igual que en Inventario) al medicamento del
    # catálogo central que ampara esta fórmula. Sin este campo, cualquier orden
    # aprobada podía usarse para pedir a domicilio CUALQUIER medicamento RX, no
    # solo el que el médico realmente formuló — ver validación en
    # app.api.v1.routes.domicilios.crear_domicilio.
    medicamento_id: Mapped[int] = mapped_column(Integer, index=True)
    estado: Mapped[EstadoOrden] = mapped_column(Enum(EstadoOrden), default=EstadoOrden.PENDIENTE)
    revisado_por: Mapped[str | None] = mapped_column(String(120), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    domicilios: Mapped[list["Domicilio"]] = relationship(back_populates="orden")


class Domicilio(IPSBase):
    __tablename__ = "domicilio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("orden_medica.id"))
    punto_origen_id: Mapped[int] = mapped_column(ForeignKey("punto_venta.id"))
    estado: Mapped[EstadoDomicilio] = mapped_column(Enum(EstadoDomicilio), default=EstadoDomicilio.CONFIRMADO)
    eta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lat_actual: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    lng_actual: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    orden: Mapped["OrdenMedica"] = relationship(back_populates="domicilios")
