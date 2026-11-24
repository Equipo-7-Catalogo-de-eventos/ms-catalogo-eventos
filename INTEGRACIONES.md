
# Declaración de Integraciones - Evaluación 4 (TITEC)

**Equipo:** 7 - Catálogo de Eventos  
**Plataforma:** TicketU  
**Microservicio:** ms-catalogo-eventos  
**Ambiente de verificación:** Workstation

## 1. Tabla de integraciones

| ID | Tipo de servicio | Módulo contraparte | Endpoint | Contrato | Issue |
| --- | --- | --- | --- | --- | --- |
| I1 | Consumido | Panel Organizador | `GET /api/v1/organizador/eventos/proximos` | [Contrato Panel Organizador][panel] | [#10][issue10] |
| I2 | Proporcionado | Entradas/Inventario | `PUT /api/v1/catalogo/eventos/{id_evento}/stock` | [Contrato Entradas][entradas] | [#12][issue12] |
| I3 | Consumido | Reseñas | `POST /api/v1/resenas/calificaciones-basicas` y `GET /api/v1/resenas/evento/{id_evento}` | [Contrato Reseñas][resenas] | [#11][issue11] |
| I4 | Proporcionado | Reseñas | `GET /api/catalogo/eventos/{id}/info-servicio` | [Swagger][swagger] | [#13][issue13] |

## 2. Detalle de las integraciones

### I1 - Consulta de eventos desde Panel Organizador

- **Proveedor:** Panel Organizador.
- **Consumidor:** Catálogo de Eventos.
- **Protocolo acordado:** HTTP REST síncrono.
- **Método:** GET.
- **Parámetro:** `limite` (opcional).
- **Propósito:** Obtener los próximos eventos publicados para su visualización en Catálogo.
- **Datos acordados:** Identificador, título, lugar, fecha, imagen, stock y precio final.
- **SLA acordado:** Inferior a 500 ms.
- **Código:** `src/services/externalServices.js` y `src/controllers/eventController.js`.

#### Verificación en workstation

- [ ] Comprobar la consulta mediante el API Gateway.
- [ ] Verificar que la respuesta coincida con el contrato.
- [ ] Comprobar la visualización de los eventos recibidos.
- [ ] Verificar el manejo de errores y tiempos de espera.

**Estado:** Implementación existente, pendiente de verificación en workstation.

### I2 - Actualización de stock desde Entradas/Inventario

- **Proveedor:** Catálogo de Eventos.
- **Consumidor:** Entradas/Inventario.
- **Protocolo acordado:** HTTP REST síncrono.
- **Método:** PUT.
- **Parámetro de ruta:** `id_evento`.
- **Datos de entrada:** `nuevo_stock` y `token_sesion`.
- **Propósito:** Mantener actualizada la disponibilidad de entradas después de una compra exitosa.
- **Persistencia esperada:** Actualización de `stock_actual` y `estado_evento` en la tabla `eventos`.
- **SLA acordado:** Inferior a 500 ms.
- **Código:** `src/routes/eventRoutes.js` y `src/controllers/eventController.js`.

#### Reglas de negocio

- El stock debe ser un número entero mayor o igual a cero.
- Si el stock llega a cero, el evento pasa a estado `agotado`.
- Si un evento agotado recibe stock mayor que cero, pasa a estado `disponible`.

#### Verificación en workstation

- [ ] Comprobar la recepción del stock mediante el API Gateway.
- [ ] Verificar la actualización del stock y estado en la base de datos.
- [ ] Comprobar la disponibilidad mostrada en la interfaz.
- [ ] Verificar el rechazo de solicitudes inválidas o no autorizadas.
- [ ] Comprobar que la respuesta corresponda al contrato.

**Estado:** Implementación existente, pendiente de verificación en workstation.

### I3 - Consulta de calificaciones y reseñas

- **Proveedor:** Reseñas.
- **Consumidor:** Catálogo de Eventos.
- **Protocolo acordado:** HTTP REST síncrono.
- **Métodos:** POST y GET.
- **Propósito:** Obtener las calificaciones y opiniones asociadas a los eventos.
- **Datos de entrada:** Lista de identificadores de eventos o identificador de un evento específico.
- **Datos de salida:** Promedio de calificaciones, cantidad total de reseñas y opiniones.
- **SLA acordado:** Inferior a 500 ms.
- **Código:** `src/services/externalServices.js` y `src/controllers/eventController.js`.

#### Verificación en workstation

- [ ] Comprobar ambas consultas mediante el API Gateway.
- [ ] Verificar que las respuestas coincidan con el contrato.
- [ ] Comprobar la visualización de las calificaciones y opiniones.
- [ ] Verificar el manejo de errores y tiempos de espera.

**Estado:** Implementación existente, pendiente de verificación en workstation


### I4 - Provisión de información del evento para Reseñas

- **Proveedor:** Catálogo de Eventos.
- **Consumidor:** Reseñas.
- **Protocolo acordado:** HTTP REST síncrono.
- **Método:** GET.
- **Endpoint:** `GET /api/catalogo/eventos/{id}/info-servicio`.
- **Parámetro de ruta:** `id`.
- **Propósito:** Proporcionar la información necesaria para que Reseñas identifique el evento y asocie correctamente sus opiniones.
- **Datos de salida:** Identificador y nombre del evento.
- **Especificación:** [Swagger][swagger].
- **Código:** `src/routes/eventRoutes.js` y `src/controllers/eventController.js`.

#### Verificación en workstation

- [ ] Comprobar la consulta desde Reseñas mediante el API Gateway.
- [ ] Verificar que el identificador corresponda al evento solicitado.
- [ ] Verificar la respuesta HTTP 404 para eventos inexistentes.
- [ ] Comprobar la consistencia entre Swagger y la implementación.

**Estado:** Endpoint implementado y dependencia confirmada. Pendiente de confirmar el contrato y verificar el consumo en workstation.


## 3. Servicios adicionales pendientes de confirmación

| Módulo contraparte | Servicio | Referencia | Estado |
| --- | --- | --- | --- |
| Promociones | Consulta del precio del evento | [Issue #14][issue14] | Endpoint implementado; consumo y contrato pendientes de confirmar |
| Panel Organizador | Registro de eventos | `POST /api/catalogo/eventos` | Consumo y contrato pendientes de confirmar |
| Panel Organizador | Actualización del estado de eventos | `PATCH /api/catalogo/eventos/{id}/estado` | Consumo y contrato pendientes de confirmar |

## 4. Observaciones y pendientes técnicos

- Confirmar las rutas efectivas del API Gateway en workstation.
- Verificar que las consultas a Panel Organizador y Reseñas no dependan de invocaciones directas entre microservicios.
- Comprobar el cumplimiento de los tiempos de respuesta acordados.
- Verificar la persistencia efectiva de las operaciones.
- Confirmar la validación real de los tokens de sesión.
- Confirmar el alcance de las integraciones con Auth y broker.
- Actualizar los estados de los issues según los resultados obtenidos en workstation.

## 5. Responsabilidad de integración

El responsable de integración coordina los acuerdos entre módulos, verifica la consistencia de los contratos y mantiene actualizada la documentación y los ítems de integración en GitHub, conforme al criterio GE4 de la Evaluación 4.

[panel]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_PANEL.md
[entradas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_ENTRADAS_CATALOGO.md
[resenas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_RESENAS.md
[swagger]: https://github.com/Equipo-7-Catalogo-de-eventos/ms-catalogo-eventos/blob/main/docs/swagger.json
[issue10]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/10
[issue11]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/11
[issue12]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/12
[issue13]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/13
[issue14]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/14
