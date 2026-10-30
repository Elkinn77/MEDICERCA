"""Añade contadores de intentos (OTP) y bloqueo temporal (login) para seguridad.

Revision ID: 20260813_02_central
Revises: 20260813_01_central
"""
from alembic import op
import sqlalchemy as sa

revision = "20260813_02_central"
down_revision = "20260813_01_central"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "codigo_verificacion",
        sa.Column("intentos", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "usuario",
        sa.Column("intentos_fallidos", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "usuario",
        sa.Column("bloqueado_hasta", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("usuario", "bloqueado_hasta")
    op.drop_column("usuario", "intentos_fallidos")
    op.drop_column("codigo_verificacion", "intentos")
