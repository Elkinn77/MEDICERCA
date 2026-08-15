# MediCerca — Backend

Prototipo académico de interoperabilidad para consulta de medicamentos, órdenes médicas y domicilios. No utiliza nombres, marcas ni datos reales de empresas de salud o farmacias.

## Arquitectura

MediCerca es un **gateway**: no concentra los datos clínicos ni el inventario de las IPS. Mantiene su propia base central y se conecta con sistemas de IPS independientes.

```text
Cliente → API MediCerca
              ├── PostgreSQL central: usuarios, EPS, IPS, afiliaciones, catálogo
              ├── PostgreSQL IPS 1: historia, puntos, inventario, órdenes, domicilios
              ├── PostgreSQL IPS 2: historia, puntos, inventario, órdenes, domicilios
              └── PostgreSQL IPS 3: historia, puntos, inventario, órdenes, domicilios
```

La tabla central `ips` es dinámica: registra las IPS activas y su tipo de integración. La tabla `afiliacion_usuario` mantiene la historia de a qué IPS pertenece un usuario y desde cuándo. Al cambiar de IPS, se cierra la afiliación anterior; no se borran datos históricos.

Por seguridad, la tabla `ips` guarda únicamente `clave_conexion`, una referencia como `demo_ips_1`. Las URLs y claves reales se conservan exclusivamente en variables de entorno, nunca en la base central.

Las tres IPS de Docker son datos demo. En una evolución de tesis, una IPS real usaría `tipo_integracion=api` y MediCerca hablaría con la API segura de esa IPS, no con su base de datos directamente.

## Levantar la demo con Docker

```powershell
cd backend
Copy-Item .env.example .env
cd ..\infra
docker compose up --build
```

La API queda en `http://localhost:8000` y Swagger en `http://localhost:8000/docs`.

Carga datos de demostración una vez las cuatro bases estén arriba:

```powershell
docker compose exec backend python -m app.seed
```

El seed registra tres IPS dinámicamente, dos EPS, tres medicamentos y datos de inventario distribuidos entre los tres sistemas IPS.

## Configuración de conexiones

```env
DATABASE_URL=postgresql+psycopg2://medicerca:clave@db_central:5432/medicerca
DATABASE_URL_IPS_1=postgresql+psycopg2://medicerca:clave@db_ips1:5432/ips1
DATABASE_URL_IPS_2=postgresql+psycopg2://medicerca:clave@db_ips2:5432/ips2
DATABASE_URL_IPS_3=postgresql+psycopg2://medicerca:clave@db_ips3:5432/ips3
```

Docker usa los nombres de servicio `db_central`, `db_ips1`, `db_ips2` y `db_ips3` como hosts internos. Para un despliegue real, cada URL apuntaría al servidor de cada entidad o, preferiblemente, se sustituiría por una integración API.

## Migraciones

En desarrollo, `AUTO_CREATE_SCHEMA=true` permite levantar la demo sin pasos extra. Para despliegues se debe configurar `AUTO_CREATE_SCHEMA=false` y aplicar Alembic antes de arrancar la API.

```powershell
# Base central
$env:DATABASE_URL="postgresql+psycopg2://usuario:clave@host-central:5432/medicerca"
alembic -c alembic.ini upgrade head

# Repetir una vez por cada base IPS directa
$env:DATABASE_URL="postgresql+psycopg2://usuario:clave@host-ips1:5432/ips1"
alembic -c alembic-ips.ini upgrade head
```

Si una instalación existente fue creada con `create_all` y su esquema coincide con la migración inicial, se marca como migrada con `alembic -c alembic.ini stamp head` en lugar de ejecutar el `upgrade` inicial.

## Seguridad implementada

- El registro público solo crea pacientes; enviar `rol=regente` es rechazado.
- Los regentes se aprovisionan vía `POST /api/v1/admin/regentes`, protegido por el header `X-Admin-Key` (variable `ADMIN_KEY` en `.env`, distinta de `SECRET_KEY`).
- Contraseñas: mínimo 8 caracteres, con mayúscula, minúscula y número (registro, cambio de contraseña y alta de regentes).
- Código OTP: máximo 5 intentos por código generado; al agotarlos, el código se invalida aunque no haya vencido.
- Login: se bloquea 15 minutos tras 5 intentos fallidos consecutivos contra el mismo correo (HTTP 429).
- Logout real: `POST /api/v1/auth/logout` revoca el token actual (denylist por `jti`), sin depender de que el cliente simplemente "olvide" el token.
- El arranque falla (`RuntimeError`) si `ENVIRONMENT` no es local/development/test y `SECRET_KEY` o `ADMIN_KEY` siguen con el valor de ejemplo del repositorio.
- CORS restringido a los orígenes listados en `CORS_ORIGINS` (nunca `*` en producción).
- `GET /api/v1/health` verifica conectividad real contra las 4 bases de datos (central + 3 IPS) y responde `503` si alguna falla — no solo confirma que el proceso está vivo.
- Las órdenes y domicilios solo operan en la IPS vigente del usuario.
- Un paciente no puede usar la orden ni ver el domicilio de otro paciente.
- Solo un regente de la IPS correspondiente puede aprobar una orden o actualizar el estado logístico.
- La historia clínica se resuelve por cédula dentro de la IPS vigente, sin compartir llaves foráneas entre bases.

## Pruebas

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Las pruebas crean cuatro SQLite temporales aisladas, por lo que no modifican PostgreSQL ni Docker. Cubren autenticación, OTP, roles, afiliaciones, autorización por IPS, disponibilidad agregada, reglas legales e historia clínica.
