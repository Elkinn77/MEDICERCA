"""Interoperability gateway: aggregate availability from registered IPS systems."""
import math

from sqlalchemy.orm import Session

from app.ips_db import ips_session
from app.models.ips import InstitucionPrestadora
from app.models_ips import Inventario, PuntoVenta
from app.schemas.disponibilidad import ResultadoDisponibilidad


def _distancia_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radio = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return radio * 2 * math.asin(math.sqrt(a))


def _consultar_una_ips(ips: InstitucionPrestadora, medicamento_id: int) -> list[tuple[Inventario, PuntoVenta]]:
    with ips_session(ips) as db:
        filas = (
            db.query(Inventario, PuntoVenta)
            .join(PuntoVenta, Inventario.punto_id == PuntoVenta.id)
            .filter(Inventario.medicamento_id == medicamento_id)
            .all()
        )
        for inventario, punto in filas:
            db.expunge(inventario)
            db.expunge(punto)
        return filas


def buscar_disponibilidad(
    db_central: Session, medicamento_id: int, lat_usuario: float, lng_usuario: float, ciudad_usuario: str
) -> list[ResultadoDisponibilidad]:
    ips_activas = db_central.query(InstitucionPrestadora).filter(InstitucionPrestadora.activa.is_(True)).all()
    todas: list[tuple[InstitucionPrestadora, Inventario, PuntoVenta]] = []
    for ips in ips_activas:
        if ips.tipo_integracion.value != "base_datos_directa" or not ips.clave_conexion:
            continue
        for inventario, punto in _consultar_una_ips(ips, medicamento_id):
            todas.append((ips, inventario, punto))

    con_stock = [fila for fila in todas if fila[1].cantidad > 0]
    if con_stock:
        misma_ciudad = [fila for fila in con_stock if fila[2].ciudad.lower() == ciudad_usuario.lower()]
        otra_ciudad = [fila for fila in con_stock if fila[2].ciudad.lower() != ciudad_usuario.lower()]
        misma_ciudad.sort(key=lambda fila: _distancia_km(lat_usuario, lng_usuario, float(fila[2].lat), float(fila[2].lng)))
        resultados = [_a_resultado(ips, inv, punto, "punto_mas_cercano" if i == 0 else "otro_punto_ciudad") for i, (ips, inv, punto) in enumerate(misma_ciudad)]
        return resultados + [_a_resultado(ips, inv, punto, "otra_ciudad") for ips, inv, punto in otra_ciudad]

    todas.sort(key=lambda fila: (fila[1].fecha_reabastecimiento is None, fila[1].fecha_reabastecimiento))
    return [_a_resultado(ips, inv, punto, "no_disponible") for ips, inv, punto in todas]


def _a_resultado(ips: InstitucionPrestadora, inventario: Inventario, punto: PuntoVenta, nivel: str) -> ResultadoDisponibilidad:
    return ResultadoDisponibilidad(
        ips_id=ips.id,
        ips_nombre=ips.nombre_ficticio,
        punto_id=punto.id,
        punto_nombre=punto.nombre,
        ciudad=punto.ciudad,
        cantidad=inventario.cantidad,
        fecha_reabastecimiento=inventario.fecha_reabastecimiento,
        nivel=nivel,
    )
