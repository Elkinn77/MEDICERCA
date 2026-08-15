from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.ips import TipoIntegracionIPS


class IPSOut(BaseModel):
    id: int
    codigo: str
    nombre_ficticio: str
    tipo_integracion: TipoIntegracionIPS

    model_config = ConfigDict(from_attributes=True)


class AfiliacionOut(BaseModel):
    ips_id: int
    identificador_paciente_ips: str | None
    vigente_desde: date
    vigente_hasta: date | None
    activa: bool

    model_config = ConfigDict(from_attributes=True)
