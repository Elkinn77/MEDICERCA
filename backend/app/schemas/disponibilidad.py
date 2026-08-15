from datetime import date

from pydantic import BaseModel, Field


class ResultadoDisponibilidad(BaseModel):
    ips_id: int
    ips_nombre: str
    punto_id: int
    punto_nombre: str
    ciudad: str
    cantidad: int
    fecha_reabastecimiento: date | None
    nivel: str  # "punto_mas_cercano" | "otro_punto_ciudad" | "otra_ciudad" | "no_disponible"


class ConsultaDisponibilidad(BaseModel):
    medicamento_id: int
    lat_usuario: float = Field(ge=-90, le=90)
    lng_usuario: float = Field(ge=-180, le=180)
    ciudad_usuario: str

