FROM python:3.12-slim

WORKDIR /app

# Dependencias primero: solo se reinstalan si requirements.txt cambia,
# no en cada edicion de app/ (aprovecha el cache de capas de Docker).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini alembic-ips.ini ./

# No correr como root: si el proceso se compromete (dependencia vulnerable,
# bug de path traversal, etc.), un usuario sin privilegios limita el daño
# que se puede hacer dentro del contenedor.
RUN groupadd --system app && useradd --system --gid app --home-dir /app app \
    && chown -R app:app /app
USER app

EXPOSE 8000

# Reutiliza /api/v1/health, que ya valida conexion real a las 4 bases de
# datos (central + 3 IPS) y no solo que el proceso este vivo (ver app/main.py).
# Se usa el interprete de Python que ya esta en la imagen para no tener que
# instalar curl/wget solo para este chequeo.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
