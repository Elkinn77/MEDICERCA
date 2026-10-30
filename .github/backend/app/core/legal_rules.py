"""
Capa de cumplimiento: aplica la clasificación legal del medicamento a cada flujo.

Referencias normativas usadas como base de diseño (simulado):
- Decreto 677 de 1995: condición de venta (RX / OTC).
- Resolución 1896: venta/dispensación a distancia por plataformas digitales.
- Nota de exclusión del proyecto: medicamentos de control especial (opioides,
  psicotrópicos) se excluyen del canal de domicilio y solo permiten recogida
  presencial validada, evitando un flujo que en la vida real exigiría permiso
  del Fondo Nacional de Estupefacientes.
"""
from app.models.medicamento import CondicionVenta, Medicamento


class MedicamentoNoElegibleParaDomicilio(Exception):
    """Se lanza cuando un medicamento no puede pedirse a domicilio por su clasificación legal."""


def requiere_formula(medicamento: Medicamento) -> bool:
    return medicamento.condicion_venta == CondicionVenta.RX


def elegible_para_domicilio(medicamento: Medicamento) -> bool:
    """
    Un medicamento es elegible para domicilio si:
    - No es de control especial (siempre requiere recogida presencial validada).
    - Si es RX, debe tener una orden médica aprobada (se valida en la ruta,
      no aquí, porque esta función solo conoce el medicamento).
    """
    if medicamento.control_especial:
        return False
    return True


def validar_domicilio_o_falla(medicamento: Medicamento, orden_aprobada: bool) -> None:
    """Lanza MedicamentoNoElegibleParaDomicilio si el pedido no cumple las reglas legales."""
    if medicamento.control_especial:
        raise MedicamentoNoElegibleParaDomicilio(
            "Los medicamentos de control especial solo se entregan por recogida "
            "presencial validada, no por domicilio."
        )
    if requiere_formula(medicamento) and not orden_aprobada:
        raise MedicamentoNoElegibleParaDomicilio(
            "Este medicamento requiere fórmula médica aprobada antes de generar el domicilio."
        )
