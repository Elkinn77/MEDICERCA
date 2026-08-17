"""Add historial_estado_domicilio table.

Registro append-only de cada cambio de estado de un domicilio, para tener
trazabilidad completa de un pedido a lo largo del tiempo (ej. "confirmado a
las 10:00, en camino a las 10:15, entregado a las 10:40"). Antes de esta
migración, cambiar el estado de un domicilio sobrescribía el valor anterior
sin dejar rastro.

Es intencionalmente una tabla simple (sin updated_at, sin borrado lógico):
nunca se edita ni se borra una fila existente, solo se agregan nuevas.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260816_03_ips"
down_revision = "20260814_02_ips"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_type=False: el tipo enum "estadodomicilio" ya existe en la base
    # (lo creó la migración inicial para la columna domicilio.estado). Sin
    # esto, Alembic intentaría crearlo de nuevo y fallaría con "type
    # estadodomicilio already exists".
    estado_domicilio_enum = postgresql.ENUM(
        "CONFIRMADO", "EN_ALISTAMIENTO", "EN_CAMINO", "ENTREGADO",
        name="estadodomicilio",
        create_type=False,
    )
    op.create_table(
        "historial_estado_domicilio",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("domicilio_id", sa.Integer(), sa.ForeignKey("domicilio.id"), nullable=False),
        sa.Column("estado", estado_domicilio_enum, nullable=False),
        sa.Column("lat_actual", sa.Numeric(9, 6), nullable=True),
        sa.Column("lng_actual", sa.Numeric(9, 6), nullable=True),
        sa.Column("registrado_en", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_historial_estado_domicilio_domicilio_id",
        "historial_estado_domicilio",
        ["domicilio_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_historial_estado_domicilio_domicilio_id", table_name="historial_estado_domicilio")
    op.drop_table("historial_estado_domicilio")
