"""Initial schema shared by every direct IPS database."""
from alembic import op
import sqlalchemy as sa

revision = "20260813_01_ips"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "punto_venta",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("ciudad", sa.String(length=80), nullable=False),
        sa.Column("direccion", sa.String(length=200), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=False),
        sa.Column("lng", sa.Numeric(9, 6), nullable=False),
    )
    op.create_index("ix_punto_venta_ciudad", "punto_venta", ["ciudad"])
    op.create_table(
        "historia_clinica",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cedula", sa.String(length=20), nullable=False),
        sa.Column("diagnostico_simulado", sa.String(length=200), nullable=False),
        sa.Column("actualizado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_historia_clinica_cedula", "historia_clinica", ["cedula"])
    op.create_table(
        "orden_medica",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_cedula", sa.String(length=20), nullable=False),
        sa.Column("archivo_url", sa.String(length=300), nullable=False),
        sa.Column("estado", sa.Enum("PENDIENTE", "APROBADA", "RECHAZADA", name="estadoorden"), nullable=False),
        sa.Column("revisado_por", sa.String(length=120), nullable=True),
        sa.Column("creado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_orden_medica_usuario_cedula", "orden_medica", ["usuario_cedula"])
    op.create_table(
        "inventario",
        sa.Column("punto_id", sa.Integer(), sa.ForeignKey("punto_venta.id"), primary_key=True),
        sa.Column("medicamento_id", sa.Integer(), primary_key=True),
        sa.Column("cantidad", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fecha_reabastecimiento", sa.Date(), nullable=True),
    )
    op.create_table(
        "prescripcion_activa",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("historia_id", sa.Integer(), sa.ForeignKey("historia_clinica.id"), nullable=False),
        sa.Column("medicamento_id", sa.Integer(), nullable=False),
        sa.Column("fecha_formula", sa.Date(), nullable=False),
        sa.Column("vigente", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "domicilio",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("orden_id", sa.Integer(), sa.ForeignKey("orden_medica.id"), nullable=False),
        sa.Column("punto_origen_id", sa.Integer(), sa.ForeignKey("punto_venta.id"), nullable=False),
        sa.Column("estado", sa.Enum("CONFIRMADO", "EN_ALISTAMIENTO", "EN_CAMINO", "ENTREGADO", name="estadodomicilio"), nullable=False),
        sa.Column("eta", sa.DateTime(), nullable=True),
        sa.Column("lat_actual", sa.Numeric(9, 6), nullable=True),
        sa.Column("lng_actual", sa.Numeric(9, 6), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("domicilio")
    op.drop_table("prescripcion_activa")
    op.drop_table("inventario")
    op.drop_index("ix_orden_medica_usuario_cedula", table_name="orden_medica")
    op.drop_table("orden_medica")
    op.drop_index("ix_historia_clinica_cedula", table_name="historia_clinica")
    op.drop_table("historia_clinica")
    op.drop_index("ix_punto_venta_ciudad", table_name="punto_venta")
    op.drop_table("punto_venta")
