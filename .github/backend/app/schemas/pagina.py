"""Envoltorio genérico de paginación para listados que pueden crecer sin
límite (catálogo de medicamentos, registro de IPS, etc.).

Sin esto, `GET /medicamentos` trae la tabla completa en una sola respuesta:
funciona con los ~5 medicamentos de la demo, pero con un catálogo real
(miles de registros INVIMA) sería una respuesta lenta y pesada. `total` le
permite al cliente saber cuántas páginas hay sin tener que traerlas todas.
"""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Pagina(BaseModel, Generic[T]):
    items: list[T]
    total: int
    skip: int
    limit: int
