from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class PrescripcionOut(BaseModel):
    id: int
    medicamento_id: int
    fecha_formula: date
    vigente: bool

    model_config = ConfigDict(from_attributes=True)


class HistoriaClinicaOut(BaseModel):
    ips_id: int
    ips_nombre: str
    diagnostico_simulado: str
    actualizado_en: datetime
    prescripciones: list[PrescripcionOut]
