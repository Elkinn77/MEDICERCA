"""Endpoints de administración.

Protegidos por un secreto compartido (ADMIN_KEY vía header X-Admin-Key), no por
el sistema de auth de usuarios — todavía no existe un rol "administrador" en el
modelo de datos (solo paciente/regente), así que no hay una cuenta de usuario
contra la cual autenticar esta acción. Este es el enfoque más simple que resuelve
el problema real ("no hay forma de dar de alta un regente sin tocar la BD a
mano") sin inventarse un sistema de roles completo antes de necesitarlo.

Cuando el proyecto tenga roles de administrador propiamente dichos, este
endpoint debería migrar a `requerir_admin` (como `requerir_regente` en
app.core.deps) y este archivo puede retirarse.
"""
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.afiliaciones import cambiar_afiliacion, obtener_ips_activa
from app.core.security import hash_password
from app.database import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.usuario import AdminCrearRegenteRequest, UsuarioOut

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def verificar_admin_key(x_admin_key: str = Header(...)) -> None:
    """Compara con secrets.compare_digest para evitar timing attacks sobre la clave."""
    if not secrets.compare_digest(x_admin_key, settings.admin_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administración inválida",
        )


@router.post(
    "/regentes",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_admin_key)],
)
def crear_regente(payload: AdminCrearRegenteRequest, db: Session = Depends(get_db)):
    """Crea una cuenta de regente ya verificada (sin pasar por el flujo de OTP:
    quien tiene la ADMIN_KEY ya es una fuente de confianza distinta al correo)."""
    existe = db.query(Usuario).filter(Usuario.correo == payload.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo")

    existe_cedula = db.query(Usuario).filter(Usuario.cedula == payload.cedula).first()
    if existe_cedula:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con esa cédula")

    ips = obtener_ips_activa(db, payload.ips_id) if payload.ips_id is not None else None

    usuario = Usuario(
        nombre=payload.nombre,
        cedula=payload.cedula,
        correo=payload.correo,
        password_hash=hash_password(payload.password),
        ips_id=payload.ips_id,
        rol=RolUsuario.REGENTE,
        verificado=True,
    )
    db.add(usuario)
    db.flush()
    db.refresh(usuario)

    if ips is not None:
        cambiar_afiliacion(db, usuario, ips)
    db.commit()
    db.refresh(usuario)
    return usuario
