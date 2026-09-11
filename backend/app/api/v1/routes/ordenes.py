from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.afiliaciones import exigir_ips_del_usuario, obtener_ips_vigente_usuario
from app.core.deps import get_current_user
from app.database import get_db
from app.ips_db import ips_session
from app.models.medicamento import Medicamento
from app.models.usuario import RolUsuario, Usuario
from app.models_ips import EstadoOrden, OrdenMedica
from app.schemas.pedido import OrdenMedicaCreate, OrdenMedicaOut

router = APIRouter(prefix="/api/v1/ordenes", tags=["ordenes"])


@router.post("", response_model=OrdenMedicaOut, status_code=201)
def cargar_orden(
    payload: OrdenMedicaCreate,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Carga una formula solamente en la IPS vigente del paciente."""
    ips = exigir_ips_del_usuario(db_central, usuario, payload.ips_id)
    if not db_central.get(Medicamento, payload.medicamento_id):
        raise HTTPException(status_code=404, detail="Medicamento no encontrado en el catalogo")
    with ips_session(ips) as db:
        orden = OrdenMedica(
            usuario_cedula=usuario.cedula,
            # payload.archivo_url es HttpUrl (pydantic-core Url), no str: hay
            # que convertirlo explicitamente o SQLAlchemy intenta bindear un
            # objeto no soportado por el driver de la BD.
            archivo_url=str(payload.archivo_url),
            medicamento_id=payload.medicamento_id,
            estado=EstadoOrden.PENDIENTE,
        )
        db.add(orden)
        db.commit()
        db.refresh(orden)
        db.expunge(orden)
        return orden


@router.get("/mias", response_model=list[OrdenMedicaOut])
def mis_ordenes(
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Ordenes cargadas por el usuario autenticado en su IPS vigente, mas
    recientes primero. Sin este endpoint, la unica forma de conocer el
    estado de una orden ya creada era recordar su id manualmente."""
    ips = obtener_ips_vigente_usuario(db_central, usuario)
    with ips_session(ips) as db:
        ordenes = (
            db.query(OrdenMedica)
            .filter(OrdenMedica.usuario_cedula == usuario.cedula)
            .order_by(OrdenMedica.creado_en.desc())
            .all()
        )
        for orden in ordenes:
            db.expunge(orden)
        return ordenes


@router.get("/pendientes", response_model=list[OrdenMedicaOut])
def ordenes_pendientes(
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Cola de ordenes PENDIENTE en la IPS vigente del regente, para que
    pueda aprobar/rechazar sin depender de que el paciente le pase el id
    de la orden por otro medio."""
    if usuario.rol != RolUsuario.REGENTE:
        raise HTTPException(status_code=403, detail="Esta accion requiere rol de regente")
    ips = obtener_ips_vigente_usuario(db_central, usuario)
    with ips_session(ips) as db:
        ordenes = (
            db.query(OrdenMedica)
            .filter(OrdenMedica.estado == EstadoOrden.PENDIENTE)
            .order_by(OrdenMedica.creado_en)
            .all()
        )
        for orden in ordenes:
            db.expunge(orden)
        return ordenes


@router.get("/{ips_id}/{orden_id}", response_model=OrdenMedicaOut)
def obtener_orden(
    ips_id: int,
    orden_id: int,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Mismo control de acceso que GET /domicilios/{ips_id}/{domicilio_id}:
    el paciente dueño de la orden, o un regente de esa misma IPS."""
    ips = exigir_ips_del_usuario(db_central, usuario, ips_id)
    with ips_session(ips) as db:
        orden = db.get(OrdenMedica, orden_id)
        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada")
        if usuario.rol != RolUsuario.REGENTE and orden.usuario_cedula != usuario.cedula:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta orden")
        db.expunge(orden)
        return orden


@router.post("/{ips_id}/{orden_id}/aprobar", response_model=OrdenMedicaOut)
def aprobar_orden(
    ips_id: int,
    orden_id: int,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    ips = _validar_regente_de_su_ips(db_central, usuario, ips_id)
    with ips_session(ips) as db:
        orden = db.get(OrdenMedica, orden_id)
        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada")
        orden.estado = EstadoOrden.APROBADA
        orden.revisado_por = usuario.nombre
        db.commit()
        db.refresh(orden)
        db.expunge(orden)
        return orden


@router.post("/{ips_id}/{orden_id}/rechazar", response_model=OrdenMedicaOut)
def rechazar_orden(
    ips_id: int,
    orden_id: int,
    db_central: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    ips = _validar_regente_de_su_ips(db_central, usuario, ips_id)
    with ips_session(ips) as db:
        orden = db.get(OrdenMedica, orden_id)
        if not orden:
            raise HTTPException(status_code=404, detail="Orden no encontrada")
        orden.estado = EstadoOrden.RECHAZADA
        orden.revisado_por = usuario.nombre
        db.commit()
        db.refresh(orden)
        db.expunge(orden)
        return orden


def _validar_regente_de_su_ips(db_central: Session, usuario: Usuario, ips_id: int):
    if usuario.rol != RolUsuario.REGENTE:
        raise HTTPException(status_code=403, detail="Esta accion requiere rol de regente")
    return exigir_ips_del_usuario(db_central, usuario, ips_id)
