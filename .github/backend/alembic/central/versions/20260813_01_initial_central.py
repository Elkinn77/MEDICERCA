"""Initial schema for the central MediCerca database."""
from alembic import op
import sqlalchemy as sa

revision = "20260813_01_central"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "eps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre_ficticio", sa.String(length=120), nullable=False, unique=True),
    )
    op.create_table(
        "ips",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(length=50), nullable=False, unique=True),
        sa.Column("nombre_ficticio", sa.String(length=150), nullable=False, unique=True),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("tipo_integracion", sa.Enum("BASE_DATOS_DIRECTA", "API", name="tipointegracionips"), nullable=False),
        sa.Column("clave_conexion", sa.String(length=80), nullable=True, unique=True),
        sa.Column("endpoint_api", sa.String(length=300), nullable=True),
        sa.Column("creado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_ips_codigo", "ips", ["codigo"])
    op.create_index("ix_ips_activa", "ips", ["activa"])
    op.create_table(
        "medicamento",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre_generico", sa.String(length=150), nullable=False),
        sa.Column("nombre_comercial", sa.String(length=150), nullable=False),
        sa.Column("dosis", sa.String(length=50), nullable=False),
        sa.Column("presentacion", sa.String(length=80), nullable=False),
        sa.Column("condicion_venta", sa.Enum("RX", "OTC", name="condicionventa"), nullable=False),
        sa.Column("control_especial", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("registro_sanitario", sa.String(length=50), nullable=False),
    )
    op.create_index("ix_medicamento_nombre_generico", "medicamento", ["nombre_generico"])
    op.create_table(
        "usuario",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("cedula", sa.String(length=20), nullable=False, unique=True),
        sa.Column("correo", sa.String(length=160), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("rol", sa.Enum("PACIENTE", "REGENTE", name="rolusuario"), nullable=False),
        sa.Column("eps_id", sa.Integer(), sa.ForeignKey("eps.id"), nullable=True),
        sa.Column("ips_id", sa.Integer(), nullable=True),
        sa.Column("verificado", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("creado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_usuario_cedula", "usuario", ["cedula"])
    op.create_index("ix_usuario_correo", "usuario", ["correo"])
    op.create_table(
        "afiliacion_usuario",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("ips_id", sa.Integer(), sa.ForeignKey("ips.id"), nullable=False),
        sa.Column("identificador_paciente_ips", sa.String(length=80), nullable=True),
        sa.Column("vigente_desde", sa.Date(), nullable=False),
        sa.Column("vigente_hasta", sa.Date(), nullable=True),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("creado_en", sa.DateTime(), nullable=False),
        sa.CheckConstraint("vigente_hasta IS NULL OR vigente_hasta >= vigente_desde", name="ck_afiliacion_fechas_validas"),
    )
    op.create_index("ix_afiliacion_usuario_usuario_id", "afiliacion_usuario", ["usuario_id"])
    op.create_index("ix_afiliacion_usuario_ips_id", "afiliacion_usuario", ["ips_id"])
    op.create_index("ix_afiliacion_usuario_activa", "afiliacion_usuario", ["activa"])
    op.create_index("ix_afiliacion_usuario_estado", "afiliacion_usuario", ["usuario_id", "activa"])
    op.create_table(
        "codigo_verificacion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("correo", sa.String(length=160), nullable=False),
        sa.Column("codigo", sa.String(length=6), nullable=False),
        sa.Column("proposito", sa.Enum("REGISTRO", "CAMBIO_PASSWORD", name="propositocodigo"), nullable=False),
        sa.Column("expira_en", sa.DateTime(), nullable=False),
        sa.Column("usado", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("creado_en", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_codigo_verificacion_correo", "codigo_verificacion", ["correo"])


def downgrade() -> None:
    op.drop_index("ix_codigo_verificacion_correo", table_name="codigo_verificacion")
    op.drop_table("codigo_verificacion")
    op.drop_index("ix_afiliacion_usuario_estado", table_name="afiliacion_usuario")
    op.drop_index("ix_afiliacion_usuario_activa", table_name="afiliacion_usuario")
    op.drop_index("ix_afiliacion_usuario_ips_id", table_name="afiliacion_usuario")
    op.drop_index("ix_afiliacion_usuario_usuario_id", table_name="afiliacion_usuario")
    op.drop_table("afiliacion_usuario")
    op.drop_index("ix_usuario_correo", table_name="usuario")
    op.drop_index("ix_usuario_cedula", table_name="usuario")
    op.drop_table("usuario")
    op.drop_index("ix_medicamento_nombre_generico", table_name="medicamento")
    op.drop_table("medicamento")
    op.drop_index("ix_ips_activa", table_name="ips")
    op.drop_index("ix_ips_codigo", table_name="ips")
    op.drop_table("ips")
    op.drop_table("eps")
