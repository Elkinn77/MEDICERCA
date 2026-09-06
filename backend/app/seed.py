"""Load a small, repeatable demo data set. Usage: ``python -m app.seed``."""
from datetime import date, timedelta

import app.models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.ips_db import crear_tablas_ips_registradas, ips_session
from app.models.ips import InstitucionPrestadora, TipoIntegracionIPS
from app.models.medicamento import CondicionVenta, Medicamento
from app.models.usuario import EPS
from app.models_ips import HistoriaClinica, Inventario, PrescripcionActiva, PuntoVenta


def obtener_o_crear(db, modelo, defaults=None, **filtros):
    instancia = db.query(modelo).filter_by(**filtros).first()
    if instancia is None:
        instancia = modelo(**filtros, **(defaults or {}))
        db.add(instancia)
        db.flush()
    return instancia


def cargar() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Central, dynamic IPS registry. URLs remain in environment via clave_conexion.
        ips_1 = obtener_o_crear(db, InstitucionPrestadora, codigo="IPS-VITALIS", defaults={"nombre_ficticio": "IPS Vitalis Central", "clave_conexion": "demo_ips_1", "tipo_integracion": TipoIntegracionIPS.BASE_DATOS_DIRECTA})
        ips_2 = obtener_o_crear(db, InstitucionPrestadora, codigo="IPS-SOMOS", defaults={"nombre_ficticio": "IPS Somos Salud", "clave_conexion": "demo_ips_2", "tipo_integracion": TipoIntegracionIPS.BASE_DATOS_DIRECTA})
        ips_3 = obtener_o_crear(db, InstitucionPrestadora, codigo="IPS-RED", defaults={"nombre_ficticio": "IPS Red Continuo", "clave_conexion": "demo_ips_3", "tipo_integracion": TipoIntegracionIPS.BASE_DATOS_DIRECTA})
        obtener_o_crear(db, EPS, nombre_ficticio="Salud Total Simulada")
        obtener_o_crear(db, EPS, nombre_ficticio="Nueva Vida EPS (ficticia)")

        medicamentos = {
            "acetaminofen": obtener_o_crear(db, Medicamento, registro_sanitario="INVIMA-SIM-0001", defaults={"nombre_generico": "Acetaminofen", "nombre_comercial": "Dolex", "dosis": "500 mg", "presentacion": "Caja x 20 tabletas", "condicion_venta": CondicionVenta.OTC, "control_especial": False}),
            "losartan": obtener_o_crear(db, Medicamento, registro_sanitario="INVIMA-SIM-0002", defaults={"nombre_generico": "Losartan", "nombre_comercial": "Cozaar", "dosis": "50 mg", "presentacion": "Caja x 30 tabletas", "condicion_venta": CondicionVenta.RX, "control_especial": False}),
            "tramadol": obtener_o_crear(db, Medicamento, registro_sanitario="INVIMA-SIM-0003", defaults={"nombre_generico": "Tramadol", "nombre_comercial": "Tramal", "dosis": "50 mg", "presentacion": "Caja x 10 capsulas", "condicion_venta": CondicionVenta.RX, "control_especial": True}),
        }
        db.commit()
        # Los objetos de `medicamentos` se van a usar mas abajo, ya con
        # `db` cerrada. Si accedemos a `medicamento.id` en ese punto,
        # SQLAlchemy intenta recargar el atributo (quedo "expirado" tras el
        # commit) y como la sesion ya esta cerrada, revienta con
        # DetachedInstanceError. Por eso guardamos los IDs en un dict de
        # Python normal *mientras la sesion sigue abierta*, y usamos ese
        # dict (no los objetos ORM) en el resto de la funcion.
        medicamento_ids = {clave: obj.id for clave, obj in medicamentos.items()}
        # Keep the connection metadata loaded after closing the central session.
        db.refresh(ips_1)
        db.refresh(ips_2)
        db.refresh(ips_3)
        crear_tablas_ips_registradas([ips_1, ips_2, ips_3])
    finally:
        db.close()

    # Each block writes only to that IPS's independent database.
    # Alcance actual del proyecto: solo Bogota. Se dejan 10 puntos repartidos
    # geograficamente por la ciudad (Chapinero, Rosales, Kennedy, Usaquen,
    # Teusaquillo, Suba, Engativa, Fontibon, Puente Aranda, Ciudad Bolivar)
    # con coordenadas reales de cada zona, para que el calculo de "punto mas
    # cercano" tenga sentido geografico de verdad en la demo. Antes habia
    # puntos sueltos en Medellin y Cali (uno cada uno) que se quitaron a
    # proposito: con un solo punto por ciudad la demo no mostraba nada
    # interesante, y el foco actual del proyecto es Bogota.
    with ips_session(ips_1) as db_ips:
        p1 = obtener_o_crear(db_ips, PuntoVenta, nombre="FarmaCentro Chapinero", defaults={"ciudad": "Bogota", "direccion": "Cra 13 #60-20", "lat": 4.6486, "lng": -74.0625})
        p2 = obtener_o_crear(db_ips, PuntoVenta, nombre="FarmaCentro Kennedy", defaults={"ciudad": "Bogota", "direccion": "Av. Ciudad de Cali #38-10 Sur", "lat": 4.6280, "lng": -74.1567})
        p3 = obtener_o_crear(db_ips, PuntoVenta, nombre="FarmaCentro Rosales", defaults={"ciudad": "Bogota", "direccion": "Cra 7 #72-30", "lat": 4.6640, "lng": -74.0540})
        p4 = obtener_o_crear(db_ips, PuntoVenta, nombre="FarmaCentro Usaquen", defaults={"ciudad": "Bogota", "direccion": "Cra 7 #119-30", "lat": 4.6946, "lng": -74.0305})
        for punto, medicamento_id, cantidad, fecha in [
            (p1, medicamento_ids["acetaminofen"], 50, None),
            (p1, medicamento_ids["losartan"], 0, date.today() + timedelta(days=5)),
            (p1, medicamento_ids["tramadol"], 10, None),
            (p2, medicamento_ids["acetaminofen"], 0, date.today() + timedelta(days=3)),
            (p2, medicamento_ids["losartan"], 12, None),
            (p3, medicamento_ids["acetaminofen"], 18, None),
            (p3, medicamento_ids["tramadol"], 6, None),
            (p4, medicamento_ids["losartan"], 9, None),
        ]:
            obtener_o_crear(db_ips, Inventario, punto_id=punto.id, medicamento_id=medicamento_id, defaults={"cantidad": cantidad, "fecha_reabastecimiento": fecha})
        historia = obtener_o_crear(db_ips, HistoriaClinica, cedula="1011097239", defaults={"diagnostico_simulado": "Hipertension arterial controlada"})
        obtener_o_crear(db_ips, PrescripcionActiva, historia_id=historia.id, medicamento_id=medicamento_ids["losartan"], defaults={"fecha_formula": date.today() - timedelta(days=10), "vigente": True})
        db_ips.commit()
    with ips_session(ips_2) as db_ips:
        p5 = obtener_o_crear(db_ips, PuntoVenta, nombre="VitalDrogas Suba", defaults={"ciudad": "Bogota", "direccion": "Cra 91 #146-30", "lat": 4.7480, "lng": -74.0930})
        p6 = obtener_o_crear(db_ips, PuntoVenta, nombre="VitalDrogas Teusaquillo", defaults={"ciudad": "Bogota", "direccion": "Cra 24 #39-51", "lat": 4.6320, "lng": -74.0910})
        p7 = obtener_o_crear(db_ips, PuntoVenta, nombre="VitalDrogas Engativa", defaults={"ciudad": "Bogota", "direccion": "Cll 68 #91-30", "lat": 4.7112, "lng": -74.1170})
        for punto, medicamento_id, cantidad, fecha in [
            (p5, medicamento_ids["acetaminofen"], 20, None),
            (p5, medicamento_ids["losartan"], 15, None),
            (p6, medicamento_ids["acetaminofen"], 8, None),
            (p6, medicamento_ids["tramadol"], 4, None),
            (p7, medicamento_ids["losartan"], 0, date.today() + timedelta(days=7)),
        ]:
            obtener_o_crear(db_ips, Inventario, punto_id=punto.id, medicamento_id=medicamento_id, defaults={"cantidad": cantidad, "fecha_reabastecimiento": fecha})
        db_ips.commit()
    with ips_session(ips_3) as db_ips:
        p8 = obtener_o_crear(db_ips, PuntoVenta, nombre="DrogaYa Fontibon", defaults={"ciudad": "Bogota", "direccion": "Cll 22 #96-15", "lat": 4.6675, "lng": -74.1469})
        p9 = obtener_o_crear(db_ips, PuntoVenta, nombre="DrogaYa Puente Aranda", defaults={"ciudad": "Bogota", "direccion": "Cra 50 #12-40", "lat": 4.6157, "lng": -74.1160})
        p10 = obtener_o_crear(db_ips, PuntoVenta, nombre="DrogaYa Ciudad Bolivar", defaults={"ciudad": "Bogota", "direccion": "Cll 70 Sur #18-25", "lat": 4.5709, "lng": -74.1646})
        for punto, medicamento_id, cantidad, fecha in [
            (p8, medicamento_ids["acetaminofen"], 12, None),
            (p9, medicamento_ids["acetaminofen"], 25, None),
            (p9, medicamento_ids["losartan"], 5, None),
            (p10, medicamento_ids["acetaminofen"], 0, date.today() + timedelta(days=2)),
        ]:
            obtener_o_crear(db_ips, Inventario, punto_id=punto.id, medicamento_id=medicamento_id, defaults={"cantidad": cantidad, "fecha_reabastecimiento": fecha})
        db_ips.commit()
    print("Datos demo cargados: base central y tres IPS independientes (10 puntos, todos en Bogota).")


if __name__ == "__main__":
    cargar()
