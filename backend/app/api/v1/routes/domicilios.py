from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.afiliaciones import exigir_ips_del_usuario
from app.core.deps import get_current_user
from app.core.legal_rules import MedicamentoNoElegibleParaDomicilio, validar_domicilio_o_falla
from app.database import get_db
from app.ips_db import ips_session
from app.models.medicamento import Medicamento
from app.models.usuario import RolUsuario, Usuario
from app.models_ips import Domicilio, EstadoOrden, OrdenMedica, PuntoVenta
from app.schemas.pedido import DomicilioCreate, DomicilioEstadoUpdate, DomicilioOut

router = APIRouter(prefix="/api/v1/domicilios", tags=["domicilios"])


def _obtener_domicilio_del_usuario(db_central: Session, usuario: Usuario, ips_id: int, domicilio_id: int):
    ips = exigir_ips_del_usuario(db_central, usuario, ips_id)
    with ips_session(ips) as db:
        domicilio = db.get(Domicilio, domicilio_id)
        if not domicilio:
            raise HTTPException(status_code=404, detail="Domicilio no encontrado")
        orden = db.get(OrdenMedica, domicilio.orden_id)
        if not orden or orden.usuario_cedula != usuario.cedula:
            raise HTTPException(status_code=403, detail="No tienes acceso a este domicilio")
        db.expunge(domicilio)
        return ips, domicilio


@router.post("", response_model=DomicilioOut, status_code=201)
def crear_domicilio(
    payload: DomicilioCreate,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    ips = exigir_ips_del_usuario(db_central, usuario, payload.ips_id)
    medicamento = db_central.get(Medicamento, payload.medicamento_id)
    if not medicamento:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado en el catalogo")

    with ips_session(ips) as db:
        orden = db.get(OrdenMedica, payload.orden_id)
        if not orden:
            raise HTTPException(status_code=404, detail="Orden medica no encontrada en esa IPS")
        if orden.usuario_cedula != usuario.cedula:
            raise HTTPException(status_code=403, detail="No puedes usar una orden medica de otro paciente")
        if orden.medicamento_id != payload.medicamento_id:
            # Sin esta validación, una orden aprobada para CUALQUIER medicamento RX
            # serviría para pedir a domicilio otro distinto al que el médico formuló.
            raise HTTPException(
                status_code=422,
                detail="El medicamento solicitado no coincide con el amparado por esta orden médica",
            )
        if not db.get(PuntoVenta, payload.punto_origen_id):
            raise HTTPException(status_code=404, detail="Punto de origen no encontrado en esa IPS")
        try:
            validar_domicilio_o_falla(medicamento, orden.estado == EstadoOrden.APROBADA)
        except MedicamentoNoElegibleParaDomicilio as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        domicilio = Domicilio(orden_id=orden.id, punto_origen_id=payload.punto_origen_id)
        db.add(domicilio)
        db.commit()
        db.refresh(domicilio)
        db.expunge(domicilio)
        return domicilio


@router.get("/{ips_id}/{domicilio_id}", response_model=DomicilioOut)
def obtener(
    ips_id: int,
    domicilio_id: int,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _, domicilio = _obtener_domicilio_del_usuario(db_central, usuario, ips_id, domicilio_id)
    return domicilio


@router.patch("/{ips_id}/{domicilio_id}/estado", response_model=DomicilioOut)
def actualizar_estado(
    ips_id: int,
    domicilio_id: int,
    payload: DomicilioEstadoUpdate,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Only the IPS staff can update logistics; patients can only read their tracking."""
    if usuario.rol != RolUsuario.REGENTE:
        raise HTTPException(status_code=403, detail="Solo un regente puede actualizar el estado del domicilio")
    ips = exigir_ips_del_usuario(db_central, usuario, ips_id)
    with ips_session(ips) as db:
        domicilio = db.get(Domicilio, domicilio_id)
        if not domicilio:
            raise HTTPException(status_code=404, detail="Domicilio no encontrado")
        domicilio.estado = payload.estado
        if payload.lat_actual is not None:
            domicilio.lat_actual = payload.lat_actual
        if payload.lng_actual is not None:
            domicilio.lng_actual = payload.lng_actual
        db.commit()
        db.refresh(domicilio)
        db.expunge(domicilio)
        return domicilio
