"""Casos borde de ordenes/domicilios no cubiertos por test_reglas_legales.py
ni test_roles.py: autenticacion ausente, afiliacion invalida, referencias
inexistentes (orden/punto de venta), acceso cruzado entre pacientes, y el
limite exacto entre medicamentos OTC y RX en la regla de "orden aprobada"."""
from fastapi.testclient import TestClient

from app.models.medicamento import CondicionVenta, Medicamento
from app.models.usuario import RolUsuario
from app.models_ips import EstadoOrden, OrdenMedica, PuntoVenta


def _crear_medicamento(db_session, *, rx: bool, sufijo: str) -> int:
    medicamento = Medicamento(
        nombre_generico=f"Medicamento {sufijo}",
        nombre_comercial=f"Comercial {sufijo}",
        dosis="500 mg",
        presentacion="Tabletas x 10",
        condicion_venta=CondicionVenta.RX if rx else CondicionVenta.OTC,
        control_especial=False,
        registro_sanitario=f"INVIMA-{sufijo}",
    )
    db_session.add(medicamento)
    db_session.commit()
    db_session.refresh(medicamento)
    return medicamento.id


def _crear_orden(ips_db, *, estado: EstadoOrden, medicamento_id: int, cedula: str) -> int:
    with ips_db(1) as db:
        orden = OrdenMedica(
            usuario_cedula=cedula,
            archivo_url="https://ejemplo.test/formula.pdf",
            medicamento_id=medicamento_id,
            estado=estado,
        )
        db.add(orden)
        db.commit()
        db.refresh(orden)
        return orden.id


def _crear_punto_venta(ips_db, ips_id: int = 1) -> int:
    with ips_db(ips_id) as db:
        punto = PuntoVenta(
            nombre="Sede de prueba",
            ciudad="Bogotá",
            direccion="Calle 1 # 2-3",
            lat=4.6500,
            lng=-74.0600,
        )
        db.add(punto)
        db.commit()
        db.refresh(punto)
        return punto.id


# ---------------------------------------------------------------------------
# Sin token
# ---------------------------------------------------------------------------

def test_crear_domicilio_sin_token_devuelve_401(client: TestClient, db_session, ips_db) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="AUTH1")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="1010101010")
    punto_id = _crear_punto_venta(ips_db)

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
    )

    assert response.status_code == 401


def test_cargar_orden_sin_token_devuelve_401(client: TestClient, db_session) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="AUTH2")

    response = client.post(
        "/api/v1/ordenes",
        json={"ips_id": 1, "archivo_url": "https://ejemplo.test/formula.pdf", "medicamento_id": medicamento_id},
    )

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Afiliacion / IPS invalida
# ---------------------------------------------------------------------------

def test_usuario_sin_afiliacion_vigente_no_puede_cargar_orden(
    client: TestClient, db_session, token_factory
) -> None:
    """Un usuario que nunca se afilio a una IPS (ips_id=None en el factory) no
    tiene "IPS vigente": debe rechazarse antes de siquiera comparar contra el
    ips_id del payload."""
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="NOAFIL1")

    response = client.post(
        "/api/v1/ordenes",
        json={"ips_id": 1, "archivo_url": "https://ejemplo.test/formula.pdf", "medicamento_id": medicamento_id},
        headers=token_factory(ips_id=None),
    )

    assert response.status_code == 403
    assert "afiliacion" in response.json()["detail"].lower()


def test_usuario_sin_afiliacion_vigente_no_puede_crear_domicilio(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="NOAFIL2")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="9999999999")
    punto_id = _crear_punto_venta(ips_db)

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        headers=token_factory(cedula="9999999999", ips_id=None),
    )

    assert response.status_code == 403
    assert "afiliacion" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Referencias inexistentes
# ---------------------------------------------------------------------------

def test_domicilio_con_orden_inexistente_devuelve_404(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="ORDNOEX")
    punto_id = _crear_punto_venta(ips_db)

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": 999999, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        headers=token_factory(ips_id=1),
    )

    assert response.status_code == 404
    assert "orden" in response.json()["detail"].lower()


def test_domicilio_con_punto_de_venta_inexistente_devuelve_404(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="PUNTONOEX")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="1010101010")

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": 999999, "medicamento_id": medicamento_id},
        headers=token_factory(cedula="1010101010", ips_id=1),
    )

    assert response.status_code == 404
    assert "punto" in response.json()["detail"].lower()


def test_domicilio_con_orden_de_otro_paciente_no_autoriza(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="OTROPAC")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="5555555555")
    punto_id = _crear_punto_venta(ips_db)

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        # cedula del token es distinta a la duena de la orden (5555555555)
        headers=token_factory(cedula="1010101010", ips_id=1),
    )

    assert response.status_code == 403
    assert "otro paciente" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Limite OTC / RX (caso borde del fix de medicamento_id ya aplicado)
# ---------------------------------------------------------------------------

def test_medicamento_otc_no_requiere_orden_aprobada_para_domicilio(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    """La exigencia de "orden aprobada" solo aplica a medicamentos RX
    (ver core.legal_rules.requiere_formula). Un OTC con una orden todavia
    PENDIENTE debe poder generar domicilio igual, para confirmar que la regla
    RX no se aplico de mas al corregir el gap de medicamento_id."""
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="OTCBORDE")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.PENDIENTE, medicamento_id=medicamento_id, cedula="1010101010")
    punto_id = _crear_punto_venta(ips_db)

    response = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        headers=token_factory(cedula="1010101010", ips_id=1),
    )

    assert response.status_code == 201
    assert response.json()["estado"] == "confirmado"


# ---------------------------------------------------------------------------
# Lectura y actualizacion de estado (sin tests previos)
# ---------------------------------------------------------------------------

def test_obtener_domicilio_niega_acceso_a_paciente_distinto(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="GETACC")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="1010101010")
    punto_id = _crear_punto_venta(ips_db)
    dueno = token_factory(cedula="1010101010", ips_id=1)

    creado = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        headers=dueno,
    )
    assert creado.status_code == 201
    domicilio_id = creado.json()["id"]

    propio = client.get(f"/api/v1/domicilios/1/{domicilio_id}", headers=dueno)
    assert propio.status_code == 200

    otro_paciente = token_factory(cedula="2020202020", ips_id=1)
    ajeno = client.get(f"/api/v1/domicilios/1/{domicilio_id}", headers=otro_paciente)
    assert ajeno.status_code == 403


def test_actualizar_estado_domicilio_requiere_rol_regente(
    client: TestClient, db_session, ips_db, token_factory
) -> None:
    medicamento_id = _crear_medicamento(db_session, rx=False, sufijo="PATCHROL")
    orden_id = _crear_orden(ips_db, estado=EstadoOrden.APROBADA, medicamento_id=medicamento_id, cedula="1010101010")
    punto_id = _crear_punto_venta(ips_db)
    paciente = token_factory(cedula="1010101010", ips_id=1)

    creado = client.post(
        "/api/v1/domicilios",
        json={"ips_id": 1, "orden_id": orden_id, "punto_origen_id": punto_id, "medicamento_id": medicamento_id},
        headers=paciente,
    )
    domicilio_id = creado.json()["id"]

    paciente_intenta = client.patch(
        f"/api/v1/domicilios/1/{domicilio_id}/estado",
        json={"estado": "en_camino"},
        headers=paciente,
    )
    assert paciente_intenta.status_code == 403

    regente = token_factory(rol=RolUsuario.REGENTE, ips_id=1)
    actualizado = client.patch(
        f"/api/v1/domicilios/1/{domicilio_id}/estado",
        json={"estado": "en_camino", "lat_actual": 4.65, "lng_actual": -74.06},
        headers=regente,
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["estado"] == "en_camino"
    assert actualizado.json()["lat_actual"] == 4.65
