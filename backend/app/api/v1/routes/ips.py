from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ips import InstitucionPrestadora
from app.schemas.ips import IPSOut
from app.schemas.pagina import Pagina

router = APIRouter(prefix="/api/v1/ips", tags=["ips"])


@router.get("", response_model=Pagina[IPSOut])
def listar(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Lista IPS activas desde el registro central, no desde una lista fija."""
    consulta = db.query(InstitucionPrestadora).filter(InstitucionPrestadora.activa.is_(True))
    total = consulta.count()
    registros = consulta.order_by(InstitucionPrestadora.id).offset(skip).limit(limit).all()
    return Pagina(items=registros, total=total, skip=skip, limit=limit)
