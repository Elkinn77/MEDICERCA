from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.afiliaciones import obtener_ips_vigente_usuario
from app.core.deps import get_current_user
from app.database import get_db
from app.ips_db import ips_session
from app.models.usuario import Usuario
from app.models_ips import HistoriaClinica
from app.schemas.historia_clinica import HistoriaClinicaOut, PrescripcionOut

router = APIRouter(prefix="/api/v1/historia-clinica", tags=["historia-clinica"])


@router.get("/mia", response_model=HistoriaClinicaOut)
def mi_historia_clinica(
    db_central: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
):
    """Resolves the user's current affiliation then queries that IPS by identity."""
    ips = obtener_ips_vigente_usuario(db_central, usuario)
    with ips_session(ips) as db:
        historia = db.query(HistoriaClinica).filter(HistoriaClinica.cedula == usuario.cedula).first()
        if not historia:
            raise HTTPException(status_code=404, detail="No hay historia clinica para este usuario en su IPS")
        return HistoriaClinicaOut(
            ips_id=ips.id,
            ips_nombre=ips.nombre_ficticio,
            diagnostico_simulado=historia.diagnostico_simulado,
            actualizado_en=historia.actualizado_en,
            prescripciones=[PrescripcionOut.model_validate(p) for p in historia.prescripciones],
        )
