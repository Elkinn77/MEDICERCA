from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.token_revocado import TokenRevocado
from app.models.usuario import RolUsuario, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credenciales_invalidas

    correo = payload.get("sub")
    jti = payload.get("jti")
    if correo is None or jti is None:
        raise credenciales_invalidas

    # Token revocado por logout: aunque la firma y el 'exp' sigan siendo válidos,
    # ya no debe autenticar a nadie.
    if db.get(TokenRevocado, jti) is not None:
        raise credenciales_invalidas

    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    if usuario is None:
        raise credenciales_invalidas
    return usuario


def requerir_regente(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    """Dependencia para endpoints que solo puede usar un regente (aprobar órdenes, administrar catálogo)."""
    if usuario.rol != RolUsuario.REGENTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acción requiere rol de regente",
        )
    return usuario
