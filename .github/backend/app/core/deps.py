from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.token_revocado import TokenRevocado
from app.models.usuario import RolUsuario, Usuario

# Usamos HTTPBearer (no OAuth2PasswordBearer) porque nuestro login real es un
# endpoint JSON normal (POST /api/v1/auth/login con {"correo", "password"}),
# no el flujo OAuth2 password-grant estandar (form-encoded username/password).
# OAuth2PasswordBearer le decia a Swagger que probara ese flujo estandar en el
# boton "Authorize", lo cual chocaba contra nuestro endpoint real y devolvia
# 422 Unprocessable Entity. HTTPBearer simplemente le pide a Swagger un token
# ya obtenido (pegado a mano o via el flujo real de login), que es justo como
# funciona esta API. La verificacion del token en si (decode_access_token,
# denylist de jti, etc.) no cambia en nada.
security_scheme = HTTPBearer(description="Pega aqui el access_token que te devuelve POST /api/v1/auth/login")


def get_current_user(
    credenciales: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    token = credenciales.credentials
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
