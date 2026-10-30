"""Add medicamento_id to orden_medica.

Sin este campo, una orden médica aprobada podía usarse para pedir a domicilio
cualquier medicamento RX, no solo el que el médico realmente formuló (ver
validación agregada en app.api.v1.routes.domicilios.crear_domicilio).

Se agrega como nullable en la migración porque una BD de IPS ya desplegada
puede tener filas existentes sin este dato; NOT NULL se aplica a nivel de
aplicación (schema Pydantic) para todo registro nuevo. Si esta migración se
aplica sobre una instalación con datos reales, backfillear medicamento_id
antes de asumir que el campo siempre viene poblado.
"""
from alembic import op
import sqlalchemy as sa

revision = "20260814_02_ips"
down_revision = "20260813_01_ips"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orden_medica", sa.Column("medicamento_id", sa.Integer(), nullable=True))
    op.create_index("ix_orden_medica_medicamento_id", "orden_medica", ["medicamento_id"])


def downgrade() -> None:
    op.drop_index("ix_orden_medica_medicamento_id", table_name="orden_medica")
    op.drop_column("orden_medica", "medicamento_id")
