# Pruebas de funcionalidad (CA1)

**Equipo 7 – Catálogo de Eventos** · Microservicio `ms-catalogo-eventos`

Las pruebas usan el runner nativo de Node.js (`node:test`), sin dependencias adicionales. Están en la carpeta [`test/`](../test):

| Archivo | Tipo | Qué valida |
| --- | --- | --- |
| `test/api.test.js` | Funcionalidad (HTTP) | Levanta el servidor en un puerto libre y prueba los endpoints como lo haría el front o un módulo integrado |
| `test/fechas.test.js` | Unitaria | Cálculo de `es_pasado` con fecha + hora del evento en hora de Chile |

## Cómo ejecutarlas

Requisito: Node.js 18 o superior.

```bash
npm install
npm test
```

Para guardar el resultado como evidencia (PowerShell):

```powershell
npm test 2>&1 | Out-File -Encoding utf8 docs\evidencias\resultado_pruebas.txt
```

Las pruebas usan la base de datos configurada en `.env`; si no existe, usan la de Supabase del proyecto. Si la base no responde, el catálogo usa sus datos en memoria y las pruebas igual deben pasar. Panel Organizador y Reseñas se apuntan a una dirección sin servicio para comprobar que el catálogo sigue respondiendo cuando una contraparte falla.

**Las pruebas no alteran datos:** no crean eventos y, en la única escritura, reenvían al evento su mismo stock actual.

## Casos de prueba

### Listado, filtros y paginación (HU1, HU3)

| Caso | Resultado esperado |
| --- | --- |
| Listar eventos | `200`, cada evento con `id_evento`, `nombre_evento`, `es_pasado`, precio y stock |
| `limite=2` | No más de 2 eventos por página, con metadatos de paginación |
| Segunda página | Respeta el límite y no supera el total |
| `temporalidad=proximos` | Ningún evento con `es_pasado: true` |
| `temporalidad=pasados` | Solo eventos con `es_pasado: true` |
| `isFree=true` | Solo eventos gratuitos |
| `isFree=quizas` | `400` |
| `fecha_desde=no-es-fecha` | `400` (no `500`) |

### Búsqueda y detalle (HU2, HU4)

| Caso | Resultado esperado |
| --- | --- |
| Buscar por una palabra del nombre de un evento | El evento aparece en los resultados |
| Detalle de un evento existente | `200` con sus datos |
| Detalle de un evento inexistente | `404` |

### Reseñas con respaldo (HU6, BE2)

| Caso | Resultado esperado |
| --- | --- |
| Reseñas no responde | `200` con `total_resenas` y lista de reseñas desde los datos locales |

### Servicios para otros módulos (BE3)

| Caso | Resultado esperado |
| --- | --- |
| `GET /:id/precio` (Promociones) | `200` con `precio_base` igual al precio del evento |
| Precio de un evento inexistente | `404` |
| `GET /:id/info-servicio` (Reseñas) | `200` con identificador y nombre del evento |
| info-servicio de un evento inexistente | `404` |

### Actualización de stock desde Entradas (HU5)

| Caso | Resultado esperado |
| --- | --- |
| Sin `token_sesion` | `401` |
| `nuevo_stock` negativo | `400` |
| `nuevo_stock` no entero | `400` |
| Evento inexistente | `404` (o `503` si la base no está disponible para validar) |
| Stock válido | `200`, stock guardado y estado coherente (`agotado` si es 0) |

### Registro de eventos (Panel Organizador)

| Caso | Resultado esperado |
| --- | --- |
| Sin nombre | `400` |
| Fecha inválida | `400` |

### CORS

| Caso | Resultado esperado |
| --- | --- |
| Acceso directo con `Origin` | Se refleja el origen, con `credentials: true` |
| Solicitud que viene del API Gateway | El catálogo no agrega cabeceras CORS propias |

### Cálculo de `es_pasado`

| Caso | Resultado esperado |
| --- | --- |
| Evento del 25-11 a las 14:30, consultado el 24-11 a las 21:19 | No es pasado |
| Un minuto antes de la hora de inicio | No es pasado |
| Un minuto después de la hora de inicio | Es pasado |
| Conversión de fecha + hora | 25-11-2026 14:30 Chile = 17:30 UTC |
| Evento sin hora | Vigente hasta el final del día |
| Evento de meses atrás | Es pasado |
| Fecha inválida | No se marca como pasado |
| Día actual | Se calcula en hora de Chile, no en UTC |

## Resultado

34 pruebas, 34 aprobadas. Salida completa de la ejecución: [`docs/evidencias/resultado_pruebas.txt`](evidencias/resultado_pruebas.txt).
