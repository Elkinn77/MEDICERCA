"""
Códigos de verificación (OTP) para registro y cambio de contraseña.

Modo actual: SIMULADO. No se envía correo real — el código se devuelve en la
respuesta de la API (visible en Swagger/Postman), para no depender de una
cuenta de correo configurada. Para pasar a envío real más adelante, solo hay
que reemplazar `enviar_codigo()` por una llamada a un proveedor (SMTP con
Gmail, o una API como Resend/Brevo/SendGrid) — el resto del flujo no cambia.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.codigo_verificacion import CodigoVerificacion, PropositoCodigo

logger = logging.getLogger("medicerca.otp")

MINUTOS_VALIDEZ = 10

# Con 6 dígitos hay 1,000,000 de combinaciones. Sin este límite, alguien con la
# ventana de 10 minutos y suficiente concurrencia podría agotarlas todas antes de
# que el código expire. 5 intentos por código generado corta eso de raíz: forzar
# un código nuevo es gratis para el usuario legítimo y carísimo para el atacante
# (cada código nuevo invalida los anteriores del mismo correo/propósito).
MAX_INTENTOS_CODIGO = 5


def generar_codigo(db: Session, correo: str, proposito: PropositoCodigo) -> str:
    """Crea un código de 6 dígitos, invalida los anteriores del mismo correo/propósito y lo 'envía'."""
    # Invalidar códigos previos sin usar del mismo correo y propósito.
    db.query(CodigoVerificacion).filter(
        CodigoVerificacion.correo == correo,
        CodigoVerificacion.proposito == proposito,
        CodigoVerificacion.usado.is_(False),
    ).update({"usado": True})

    # secrets.randbelow, no random.randint: este código protege registro y
    # cambio de contraseña, así que necesita un generador criptográficamente
    # seguro. random usa Mersenne Twister, predecible si se conoce/observa
    # suficiente salida — no apto para nada con valor de seguridad.
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    registro = CodigoVerificacion(
        correo=correo,
        codigo=codigo,
        proposito=proposito,
        expira_en=datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_VALIDEZ),
    )
    db.add(registro)
    db.commit()

    enviar_codigo(correo, codigo, proposito)
    return codigo


def enviar_codigo(correo: str, codigo: str, proposito: PropositoCodigo) -> None:
    """
    Simula el envío. Por ahora solo lo deja en el log del servidor.
    Cuando haya un proveedor real de correo, este es el único lugar que cambia.
    """
    logger.info("[SIMULADO] Código %s para %s (%s)", codigo, correo, proposito.value)


def validar_codigo(db: Session, correo: str, codigo: str, proposito: PropositoCodigo) -> bool:
    """Verifica el código: debe existir, no estar usado, no haber vencido, no haber agotado
    sus intentos, y coincidir. Lo marca usado si es válido.

    A propósito NO filtramos por `codigo` en la consulta: necesitamos encontrar el
    registro pendiente del correo/propósito aunque el dígito enviado sea incorrecto,
    para poder contar el intento fallido contra él.
    """
    registro = (
        db.query(CodigoVerificacion)
        .filter(
            CodigoVerificacion.correo == correo,
            CodigoVerificacion.proposito == proposito,
            CodigoVerificacion.usado.is_(False),
        )
        .order_by(CodigoVerificacion.creado_en.desc())
        .first()
    )
    if not registro:
        return False

    if registro.expira_en.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return False

    if registro.intentos >= MAX_INTENTOS_CODIGO:
        # Se agotaron los intentos: quemamos el código para que ni siquiera el dígito
        # correcto sirva ya. El usuario debe solicitar uno nuevo.
        registro.usado = True
        db.commit()
        return False

    if registro.codigo != codigo:
        registro.intentos += 1
        db.commit()
        return False

    registro.usado = True
    db.commit()
    return True
