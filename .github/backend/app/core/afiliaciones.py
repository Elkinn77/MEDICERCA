"""Rules for resolving the IPS that currently serves a user."""
from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.ips import AfiliacionUsuario, InstitucionPrestadora
from app.models.usuario import Usuario


def obtener_ips_activa(db: Session, ips_id: int) -> InstitucionPrestadora:
    ips = db.get(InstitucionPrestadora, ips_id)
    if ips is None or not ips.activa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="IPS no encontrada o inactiva")
    return ips


def obtener_afiliacion_vigente(db: Session, usuario_id: int) -> AfiliacionUsuario | None:
    hoy = date.today()
    return (
        db.query(AfiliacionUsuario)
        .filter(
            AfiliacionUsuario.usuario_id == usuario_id,
            AfiliacionUsuario.activa.is_(True),
            AfiliacionUsuario.vigente_desde <= hoy,
            (AfiliacionUsuario.vigente_hasta.is_(None) | (AfiliacionUsuario.vigente_hasta >= hoy)),
        )
        .order_by(AfiliacionUsuario.vigente_desde.desc(), AfiliacionUsuario.id.desc())
        .first()
    )


def obtener_ips_vigente_usuario(db: Session, usuario: Usuario) -> InstitucionPrestadora:
    afiliacion = obtener_afiliacion_vigente(db, usuario.id)
    if afiliacion is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene una afiliacion vigente a una IPS",
        )
    return obtener_ips_activa(db, afiliacion.ips_id)


def exigir_ips_del_usuario(db: Session, usuario: Usuario, ips_id: int) -> InstitucionPrestadora:
    ips = obtener_ips_vigente_usuario(db, usuario)
    if ips.id != ips_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La operacion solo esta permitida en la IPS vigente del usuario",
        )
    return ips


def cambiar_afiliacion(db: Session, usuario: Usuario, ips: InstitucionPrestadora) -> AfiliacionUsuario:
    """Close the active affiliation and open a new one without losing history."""
    actual = obtener_afiliacion_vigente(db, usuario.id)
    if actual and actual.ips_id == ips.id:
        return actual

    hoy = date.today()
    if actual:
        actual.activa = False
        actual.vigente_hasta = hoy

    nueva = AfiliacionUsuario(
        usuario_id=usuario.id,
        ips_id=ips.id,
        identificador_paciente_ips=usuario.cedula,
        vigente_desde=hoy,
        activa=True,
    )
    db.add(nueva)
    # Kept temporarily so the current response model remains backward compatible.
    usuario.ips_id = ips.id
    db.flush()
    return nueva
