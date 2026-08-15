from pydantic import BaseModel, ConfigDict

from app.models.medicamento import CondicionVenta


class MedicamentoCreate(BaseModel):
    nombre_generico: str
    nombre_comercial: str
    dosis: str
    presentacion: str
    condicion_venta: CondicionVenta
    control_especial: bool = False
    registro_sanitario: str


class MedicamentoOut(MedicamentoCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
