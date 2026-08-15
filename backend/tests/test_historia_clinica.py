from datetime import date

from fastapi.testclient import TestClient

from app.models_ips import HistoriaClinica, PrescripcionActiva


def test_historia_clinica_se_busca_por_cedula_en_la_ips_del_usuario(
    client: TestClient, ips_db, usuario_factory
) -> None:
    usuario = usuario_factory(cedula="1011097239", ips_id=1)
    with ips_db(1) as db:
        historia = HistoriaClinica(
            cedula=usuario["cedula"],
            diagnostico_simulado="Hipertensión arterial controlada",
        )
        db.add(historia)
        db.flush()
        db.add(
            PrescripcionActiva(
                historia_id=historia.id,
                medicamento_id=987,
                fecha_formula=date(2026, 8, 1),
                vigente=True,
            )
        )
        db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"correo": usuario["correo"], "password": usuario["password"]},
    )
    assert login.status_code == 200

    response = client.get(
        "/api/v1/historia-clinica/mia",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )

    assert response.status_code == 200
    historia = response.json()
    assert historia["ips_id"] == 1
    assert historia["diagnostico_simulado"] == "Hipertensión arterial controlada"
    assert historia["prescripciones"] == [
        {"id": 1, "medicamento_id": 987, "fecha_formula": "2026-08-01", "vigente": True}
    ]
