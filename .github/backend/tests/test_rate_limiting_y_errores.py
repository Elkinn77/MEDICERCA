"""Tests del rate limiting por IP (slowapi) y del manejador global de
errores no controlados agregados en esta sesion. Ver app/core/rate_limit.py
y el @app.exception_handler(Exception) en app/main.py."""
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app


def test_solicitar_cambio_password_limita_por_ip_tras_varios_intentos(
    client: TestClient, db_session
) -> None:
    """Este endpoint no bloquea por cuenta (no revela si el correo existe,
    ver el comentario en la ruta), asi que la unica defensa contra alguien
    que rota el correo objetivo en cada intento es el limite por IP
    (5 por minuto, ver app/core/rate_limit.py)."""
    for _ in range(5):
        respuesta = client.post(
            "/api/v1/auth/solicitar-cambio-password",
            json={"correo": "cualquiera@prueba.com"},
        )
        assert respuesta.status_code == 200

    bloqueado = client.post(
        "/api/v1/auth/solicitar-cambio-password",
        json={"correo": "otro-correo-distinto@prueba.com"},
    )
    assert bloqueado.status_code == 429


def test_login_limita_por_ip_como_defensa_adicional_al_bloqueo_por_cuenta(
    client: TestClient, db_session
) -> None:
    """login ya bloquea por CUENTA tras 5 fallos (ver MAX_INTENTOS_LOGIN);
    este test confirma que ademas hay un limite por IP independiente de la
    cuenta que se este probando, para frenar a quien rota de correo."""
    for indice in range(20):
        respuesta = client.post(
            "/api/v1/auth/login",
            json={"correo": f"no-existe-{indice}@prueba.com", "password": "loquesea"},
        )
        assert respuesta.status_code == 401

    bloqueado = client.post(
        "/api/v1/auth/login",
        json={"correo": "no-existe-final@prueba.com", "password": "loquesea"},
    )
    assert bloqueado.status_code == 429


def _get_db_que_falla():
    """Generador que simula una falla no controlada al abrir la conexion
    (ej. la base de datos caida), en vez de una HTTPException prevista."""
    raise RuntimeError("Fallo simulado de conexion a la base de datos")
    yield  # pragma: no cover - nunca se alcanza; existe para que sea un generador


def test_manejador_global_de_errores_no_filtra_detalles_internos() -> None:
    """Simula el escenario que el pendiente original describia ('falla de
    conexion a una IPS') sobreescribiendo get_db, y confirma que el cliente
    recibe un 500 JSON generico -no el stack trace por defecto de Starlette-
    aunque el detalle real de la excepcion no se le filtra."""
    app.dependency_overrides[get_db] = _get_db_que_falla
    try:
        # raise_server_exceptions=False: queremos inspeccionar la respuesta
        # que el handler genera, no que la excepcion se propague al test.
        cliente_sin_relanzar = TestClient(app, raise_server_exceptions=False)
        response = cliente_sin_relanzar.get("/api/v1/medicamentos")
    finally:
        del app.dependency_overrides[get_db]

    assert response.status_code == 500
    assert response.json() == {"detail": "Error interno del servidor. Intenta de nuevo más tarde."}
    assert "RuntimeError" not in response.text
    assert "Traceback" not in response.text
    assert "conexion a la base de datos" not in response.text
