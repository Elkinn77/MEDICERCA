"""
Hashing de contraseñas (bcrypt) y creación/lectura de JWT.
Ley 1581 de 2012 (Habeas Data): la contraseña nunca se guarda en texto plano.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PASSWORD_LONGITUD_MINIMA = 8


def validar_fortaleza_password(password: str) -> str:
    """Requisito mínimo: 8+ caracteres, con mayúscula, minúscula y número.

    No exigimos símbolos especiales a propósito — eso empuja a la gente a patrones
    predecibles ("Clave123!") sin ganar mucha entropía real. Se usa desde los
    validators de Pydantic, así que lanza ValueError (Pydantic lo convierte en 422).
    """
    if len(password) < PASSWORD_LONGITUD_MINIMA:
        raise ValueError(f"La contraseña debe tener al menos {PASSWORD_LONGITUD_MINIMA} caracteres")
    if not re.search(r"[a-z]", password):
        raise ValueError("La contraseña debe incluir al menos una letra minúscula")
    if not re.search(r"[A-Z]", password):
        raise ValueError("La contraseña debe incluir al menos una letra mayúscula")
    if not re.search(r"\d", password):
        raise ValueError("La contraseña debe incluir al menos un número")
    return password


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


# Hash "señuelo" fijo, calculado una sola vez al importar el módulo (no en cada
# request). No corresponde a ninguna contraseña real ni a ningún usuario: existe
# solo para que login() pueda pagar el mismo costo de bcrypt (~100-300ms) cuando
# el correo no existe que cuando existe pero la contraseña es incorrecta. Sin
# esto, la diferencia de tiempo entre ambas ramas permite inferir por fuerza
# bruta qué correos están registrados, aunque el mensaje de error sea idéntico.
HASH_SENUELO = pwd_context.hash("hash-senuelo-no-corresponde-a-ninguna-cuenta-real")


def verify_password_tiempo_constante(password: str, password_hash: str | None) -> bool:
    """Como verify_password, pero si password_hash es None (usuario inexistente)
    igual corre bcrypt contra un hash señuelo, para no filtrar por timing si el
    correo existe. Usar en vez de verify_password directo en el endpoint de login."""
    if password_hash is None:
        pwd_context.verify(password, HASH_SENUELO)
        return False
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    # jti (JWT ID) único por token: es lo que permite revocar UN token puntual
    # en logout sin tener que invalidar todos los tokens del usuario.
    payload = {"sub": subject, "exp": expire, "jti": uuid.uuid4().hex}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    """Devuelve el payload completo del token (sub, jti, exp), o None si es inválido/expiró."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
