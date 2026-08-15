"""Rate limiting por IP compartido por toda la aplicación.

Se aplica sobre todo a los endpoints de autenticación que no tienen ya un
bloqueo por cuenta:

- `login` y `verificar-registro` SÍ tienen bloqueo por cuenta (ver
  `MAX_INTENTOS_LOGIN` en `api.v1.routes.auth`), así que aquí el límite por
  IP es una capa adicional, no la única defensa.
- `solicitar-cambio-password` y `register` NO bloquean por cuenta — el
  primero por diseño no revela si un correo existe, así que la única forma
  de frenar un abuso (espamear el envío de códigos a cualquier correo) es
  limitar por IP de origen.

`key_func=get_remote_address` agrupa los intentos por IP, no por usuario:
protege incluso contra un atacante que rota el correo objetivo en cada
intento.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
