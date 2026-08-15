"""Añade la tabla token_revocado (denylist de JWT para permitir logout).

Revision ID: 20260813_03_central
Revises: 20260813_02_central
"""
from alembic import op
import sqlalchemy as sa

revision = "20260813_03_central"
down_revision = "20260813_02_central"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "token_revocado",
        sa.Column("jti", sa.String(length=32), primary_key=True),
        sa.Column("expira_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_token_revocado_expira_en", "token_revocado", ["expira_en"])


def downgrade() -> None:
    op.drop_index("ix_token_revocado_expira_en", table_name="token_revocado")
    op.drop_table("token_revocado")
