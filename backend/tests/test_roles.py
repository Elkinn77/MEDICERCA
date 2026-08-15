from fastapi.testclient import TestClient

from app.models.usuario import RolUsuario


def _medicamento_payload() -> dict[str, object]:
    return {
        "nombre_generico": "Ibuprofeno",
        "nombre_comercial": "Ibuprofeno Prueba",
        "dosis": "400 mg",
        "presentacion": "Tabletas x 10",
        "condicion_venta": "OTC",
        "control_especial": False,
        "registro_sanitario": "INVIMA-PRUEBA-001",
    }


def _crear_medicamento(client: TestClient, token_factory) -> int:
    """Crea un medicamento vía la API usando un regente de una IPS cualquiera."""
    respuesta = client.post(
        "/api/v1/medicamentos",
        json=_medicamento_payload(),
        headers=token_factory(rol=RolUsuario.REGENTE, ips_id=1),
    )
    assert respuesta.status_code == 201
    return respuesta.json()["id"]


def test_paciente_no_puede_administrar_catalogo(client: TestClient, token_factory) -> None:
    response = client.post(
        "/api/v1/medicamentos",
        json=_medicamento_payload(),
        headers=token_factory(),
    )

    assert response.status_code == 403
    assert "regente" in response.json()["detail"].lower()


def test_regente_puede_administrar_catalogo(client: TestClient, token_factory) -> None:
    response = client.post(
        "/api/v1/medicamentos",
        json=_medicamento_payload(),
        headers=token_factory(rol=RolUsuario.REGENTE, ips_id=1),
    )

    assert response.status_code == 201
    assert response.json()["nombre_generico"] == "Ibuprofeno"


def test_solo_regente_de_la_misma_ips_puede_aprobar_orden(client: TestClient, token_factory) -> None:
    medicamento_id = _crear_medicamento(client, token_factory)
    paciente = token_factory(ips_id=1)
    orden = client.post(
        "/api/v1/ordenes",
        json={"ips_id": 1, "archivo_url": "https://ejemplo.test/formula.pdf", "medicamento_id": medicamento_id},
        headers=paciente,
    )
    assert orden.status_code == 201
    orden_id = orden.json()["id"]

    paciente_intenta_aprobar = client.post(
        f"/api/v1/ordenes/1/{orden_id}/aprobar",
        headers=paciente,
    )
    assert paciente_intenta_aprobar.status_code == 403

    regente_de_otra_ips = token_factory(rol=RolUsuario.REGENTE, ips_id=2)
    otra_ips_intenta_aprobar = client.post(
        f"/api/v1/ordenes/1/{orden_id}/aprobar",
        headers=regente_de_otra_ips,
    )
    assert otra_ips_intenta_aprobar.status_code == 403

    regente_correcto = token_factory(nombre="Regente IPS 1", rol=RolUsuario.REGENTE, ips_id=1)
    aprobacion = client.post(
        f"/api/v1/ordenes/1/{orden_id}/aprobar",
        headers=regente_correcto,
    )
    assert aprobacion.status_code == 200
    assert aprobacion.json()["estado"] == "aprobada"
    assert aprobacion.json()["revisado_por"] == "Regente IPS 1"


def test_no_se_puede_cargar_orden_con_medicamento_inexistente(client: TestClient, token_factory) -> None:
    response = client.post(
        "/api/v1/ordenes",
        json={"ips_id": 1, "archivo_url": "https://ejemplo.test/formula.pdf", "medicamento_id": 999999},
        headers=token_factory(ips_id=1),
    )

    assert response.status_code == 404
    assert "medicamento" in response.json()["detail"].lower()


def test_paciente_no_puede_subir_orden_a_otra_ips(client: TestClient, token_factory) -> None:
    medicamento_id = _crear_medicamento(client, token_factory)
    response = client.post(
        "/api/v1/ordenes",
        json={"ips_id": 2, "archivo_url": "https://ejemplo.test/formula.pdf", "medicamento_id": medicamento_id},
        headers=token_factory(ips_id=1),
    )

    assert response.status_code == 403
    assert "ips vigente" in response.json()["detail"].lower()
