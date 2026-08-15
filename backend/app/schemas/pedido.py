from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models_ips import EstadoDomicilio, EstadoOrden


class OrdenMedicaCreate(BaseModel):
    ips_id: int
    archivo_url: HttpUrl
    # Medicamento que la fórmula ampara, tomado del catálogo central. Se exige
    # aquí (y no se infiere después) para poder validar en la creación del
    # domicilio que se está pidiendo exactamente lo que la orden autoriza.
    medicamento_id: int


class OrdenMedicaOut(BaseModel):
    id: int
    usuario_cedula: str
    archivo_url: str
    medicamento_id: int
    estado: EstadoOrden
    revisado_por: str | None
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class DomicilioCreate(BaseModel):
    ips_id: int
    orden_id: int
    punto_origen_id: int
    medicamento_id: int  # para poder validar la regla legal (control especial / RX)


class DomicilioOut(BaseModel):
    id: int
    orden_id: int
    punto_origen_id: int
    estado: EstadoDomicilio
    eta: datetime | None
    lat_actual: float | None
    lng_actual: float | None

    model_config = ConfigDict(from_attributes=True)


class DomicilioEstadoUpdate(BaseModel):
    estado: EstadoDomicilio
    lat_actual: float | None = Field(default=None, ge=-90, le=90)
    lng_actual: float | None = Field(default=None, ge=-180, le=180)

