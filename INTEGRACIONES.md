
# Declaración de Integraciones - Evaluación 4 (TITEC)

**Equipo:** 7 - Catálogo de Eventos  
**Plataforma:** TicketU  
**Microservicio:** ms-catalogo-eventos  
**Ambiente de verificación:** Workstation  

---

## 1. Tabla de integraciones

| ID | Tipo de servicio | Módulo contraparte | Endpoint | Contrato | Issue |
| --- | --- | --- | --- | --- | --- |
| I1 | Consumido | Panel Organizador | `GET /api/v1/organizador/eventos/proximos` | [Contrato Catálogo-Panel][panel] | [#10][issue10] |
| I2 | Proporcionado | Entradas/Inventario | `PUT /api/v1/catalogo/eventos/{id_evento}/stock` | [Contrato Entradas-Catálogo][entradas] | [#12][issue12] |
| I3 | Consumido | Reseñas | `POST /api/v1/resenas/calificaciones-basicas` y `GET /api/v1/resenas/evento/{id_evento}` | [Contrato Catálogo-Reseñas][resenas] | [#11][issue11] |
| I4 | Proporcionado | Reseñas | `GET /api/catalogo/eventos/{id}/info-servicio` | [Contrato Reseñas-Catálogo (propuesto)][resenas_catalogo] | [#13][issue13] |

Las integraciones declaradas cuentan con implementación en el repositorio, pero su funcionamiento efectivo debe verificarse contra los módulos reales en workstation.

---

## 2. Detalle de las integraciones

### I1 - Consumo de eventos desde Panel Organizador

- **Proveedor:** Panel Organizador.
- **Consumidor:** Catálogo de Eventos.
- **Protocolo acordado:** HTTP REST síncrono.
- **Método:** GET.
- **Endpoint:** `/api/v1/organizador/eventos/proximos`.
- **Parámetro:** `limite` (opcional).
- **Propósito:** Obtener los próximos eventos publicados para su visualización en Catálogo.
- **Datos acordados:** Identificador, título, lugar, fecha, imagen, stock y precio final.
- **SLA acordado:** Inferior a 500 ms.
- **Contrato:** [CONTRATO_CATALOGO_PANEL.md][panel].
- **Issue asociado:** [#10][issue10].
- **Código:** `src/services/externalServices.js` y `src/controllers/eventController.js`.

#### Verificación en workstation

- [ ] Comprobar la consulta mediante el API Gateway.
- [ ] Verificar que la respuesta coincida con el contrato.
- [ ] Comprobar la visualización de los eventos recibidos.
- [ ] Verificar el manejo de errores y tiempos de espera.
- [ ] Comprobar el cumplimiento del SLA acordado.

**Estado:** Implementación existente, pendiente de verificación en workstation.

---

### I2 - Provisión del servicio de actualización de stock a Entradas/Inventario

- **Proveedor:** Catálogo de Eventos.
- **Consumidor:** Entradas/Inventario.
- **Protocolo acordado:** HTTP REST síncrono.
- **Método:** PUT.
- **Endpoint:** `/api/v1/catalogo/eventos/{id_evento}/stock`.
- **Parámetro de ruta:** `id_evento`.
- **Datos de entrada:** `nuevo_stock` y `token_sesion`.
- **Propósito:** Mantener actualizada la disponibilidad de entradas después de una compra o emisión exitosa.
- **Persistencia esperada:** Actualización de `stock_actual` y `estado_evento` en la tabla `eventos`.
- **SLA acordado:** Inferior a 500 ms.
- **Contrato:** [CONTRATO_ENTRADAS_CATALOGO.md][entradas].
- **Issue asociado:** [#12][issue12].
- **Historia de usuario asociada:** [#5 - HU5][issue5].
- **Código:** `src/routes/eventRoutes.js` y `src/controllers/eventController.js`.

#### Reglas de negocio

- Entradas/Inventario constituye la fuente de verdad del stock.
- El valor recibido corresponde al stock absoluto restante, no a la cantidad de entradas descontadas.
- El stock debe ser un número entero mayor o igual a cero.
- Si el stock llega a cero, el evento pasa a estado `agotado`.
- Si un evento agotado recibe stock mayor que cero, pasa a estado `disponible`.
- Las solicitudes inválidas o no autorizadas deben rechazarse sin modificar los datos.
- La actualización de stock se realiza mediante HTTP REST, conforme al contrato acordado entre ambos módulos.

#### Verificación en workstation

- [ ] Comprobar la recepción del stock desde Entradas/Inventario mediante el API Gateway.
- [ ] Verificar que la solicitud y la respuesta coincidan con el contrato.
- [ ] Comprobar la persistencia del stock y estado en la base de datos.
- [ ] Comprobar los cambios de estado asociados al stock recibido.
- [ ] Verificar el rechazo de solicitudes inválidas o no autorizadas.
- [ ] Comprobar la disponibilidad mostrada en el listado y detalle del evento.
- [ ] Comprobar el funcionamiento de la integración después de una compra exitosa.
- [ ] Comprobar el cumplimiento del SLA acordado.

**Estado:** Implementación existente, pendiente de verificación en workstation.

---

### I3 - Consumo de calificaciones y reseñas desde Reseñas

- **Proveedor:** Reseñas.
- **Consumidor:** Catálogo de Eventos.
- **Protocolo acordado:** HTTP REST síncrono.
- **Métodos:** POST y GET.
- **Propósito:** Obtener las calificaciones y opiniones asociadas a los eventos para su visualización en Catálogo.
- **SLA acordado:** Inferior a 500 ms.
- **Contrato:** [CONTRATO_CATALOGO_RESENAS.md][resenas].
- **Issue asociado:** [#11][issue11].
- **Código:** `src/services/externalServices.js` y `src/controllers/eventController.js`.

#### Operaciones

| Método | Endpoint | Datos de entrada | Datos de salida |
| --- | --- | --- | --- |
| POST | `/api/v1/resenas/calificaciones-basicas` | `lista_id_eventos` | Promedio de calificaciones y total de reseñas por evento |
| GET | `/api/v1/resenas/evento/{id_evento}` | Identificador del evento | Promedio, total de reseñas y opiniones asociadas |

#### Reglas de negocio

- Las calificaciones y opiniones son proporcionadas por el módulo Reseñas.
- Catálogo utiliza estos datos para informar a los usuarios sobre las experiencias de otros asistentes.
- Si Reseñas no está disponible o supera el tiempo de espera establecido, Catálogo debe manejar el error sin interrumpir el funcionamiento de la aplicación.

#### Verificación en workstation

- [ ] Comprobar ambas consultas mediante el API Gateway.
- [ ] Verificar que las respuestas coincidan con el contrato.
- [ ] Comprobar la visualización de las calificaciones y opiniones recibidas.
- [ ] Verificar el manejo de errores y tiempos de espera.
- [ ] Comprobar el cumplimiento del SLA acordado.

**Estado:** Implementación existente, pendiente de verificación en workstation.

---

### I4 - Provisión de información de eventos a Reseñas

- **Proveedor:** Catálogo de Eventos.
- **Consumidor:** Reseñas.
- **Protocolo previsto:** HTTP REST síncrono.
- **Método:** GET.
- **Endpoint propuesto en el contrato original:** `/eventos/{eventoId}`.
- **Endpoint implementado:** `/api/catalogo/eventos/{id}/info-servicio`.
- **Parámetro de ruta:** `id`.
- **Propósito:** Proporcionar información básica de los eventos para que Reseñas valide su existencia y muestre su información junto a las reseñas publicadas.
- **Contrato:** [CONTRATO_RESENAS_CATALOGO.md][resenas_catalogo].
- **Versión del contrato:** 1.0.
- **Estado del contrato:** Propuesto.
- **SLA propuesto:** Inferior a 300 ms.
- **Especificación:** [Swagger][swagger].
- **Issue asociado:** [#13][issue13].
- **Código:** `src/routes/eventRoutes.js` y `src/controllers/eventController.js`.

#### Datos solicitados en el contrato

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `eventoId` | string | Identificador único del evento |
| `nombre` | string | Nombre del evento |
| `fecha` | string (ISO 8601) | Fecha de realización del evento |
| `tipo` | string | Tipo o categoría del evento |
| `existe` | boolean | Confirmación de existencia del evento |

#### Pendientes de formalización

- [ ] Confirmar la ruta definitiva del endpoint.
- [ ] Acordar los nombres y la estructura de los campos de respuesta.
- [ ] Confirmar el mecanismo de autenticación.
- [ ] Confirmar el SLA de respuesta.
- [ ] Confirmar el manejo de reintentos.
- [ ] Alinear el contrato, Swagger y la implementación.

#### Verificación en workstation

- [ ] Comprobar la consulta desde Reseñas mediante el API Gateway.
- [ ] Verificar que los datos entregados correspondan al evento solicitado.
- [ ] Comprobar la respuesta HTTP 404 para eventos inexistentes.
- [ ] Verificar que la respuesta coincida con el contrato definitivo.
- [ ] Verificar el manejo de errores y tiempos de respuesta.

**Estado:** Endpoint implementado y contrato propuesto disponible, pendiente de formalización y verificación de su consumo en workstation.

---

## 3. Servicios adicionales pendientes de confirmación

Los siguientes servicios no se contabilizan como integraciones efectivas mientras no se confirme su implementación y consumo entre los módulos involucrados.

| Módulo contraparte | Servicio | Contrato o referencia | Estado |
| --- | --- | --- | --- |
| Entradas/Inventario | `POST /api/v1/entradas/procesar-compra` | [CONTRATO_CATALOGO_ENTRADAS.md][catalogo_entradas] | Contrato existente; implementación y consumo pendientes de confirmar |
| Panel Organizador | `POST /api/catalogo/eventos` | Registro de eventos | Consumo y contrato pendientes de confirmar |
| Panel Organizador | `PATCH /api/catalogo/eventos/{id}/estado` | Actualización del estado de eventos | Consumo y contrato pendientes de confirmar |

---

## 4. Infraestructura de interoperabilidad

| Componente | Finalidad | Estado |
| --- | --- | --- |
| Auth | Autenticación y autorización de solicitudes | Pendiente de confirmación y verificación en workstation |
| API Gateway | Comunicación REST entre los microservicios de TicketU | Pendiente de verificación de las rutas efectivas en workstation |
| Broker de mensajería | Comunicación asíncrona entre módulos, según los acuerdos correspondientes | Alcance, implementación y funcionamiento pendientes de confirmar |

La integración de actualización de stock con Entradas/Inventario utiliza HTTP REST y no depende del broker de mensajería, conforme al contrato acordado.

---

## 5. Observaciones y pendientes técnicos

- Confirmar las rutas efectivas del API Gateway en workstation.
- Verificar que las comunicaciones entre módulos utilicen la infraestructura de interoperabilidad correspondiente.
- Comprobar el cumplimiento de los tiempos de respuesta acordados.
- Verificar la persistencia efectiva de las operaciones en la base de datos.
- Confirmar la validación real de los tokens de sesión.
- Formalizar los acuerdos pendientes con los módulos contraparte.
- Verificar la consistencia entre los contratos, Swagger y el código implementado.
- Confirmar el alcance efectivo de los servicios adicionales.
- Registrar evidencias de las pruebas realizadas en workstation.
- Actualizar los estados de los issues de acuerdo con los resultados obtenidos.

---

## 6. Responsabilidad de integración

El responsable de integración coordina los acuerdos entre módulos, verifica la consistencia de los contratos y mantiene actualizada la documentación y los ítems de integración en GitHub, conforme al criterio GE4 de la Evaluación 4.

Cada integración debe contar con:

- Módulo proveedor y consumidor identificados.
- Contrato de integración correspondiente.
- Criterios de aceptación verificables.
- Issue asociado en GitHub.
- Estado consistente con su implementación y funcionamiento en workstation.
- Evidencias de interoperabilidad con la contraparte real.

Los issues de integración se vinculan con las historias de usuario correspondientes para mantener la trazabilidad y evitar la duplicación de responsabilidades.

---

## 7. Criterio de cierre

Una integración se considera completada cuando cumple sus criterios de aceptación, coincide con el contrato acordado y funciona correctamente contra el módulo contraparte real en workstation.

La existencia de un endpoint, un contrato o pruebas locales no constituye por sí sola evidencia suficiente de interoperabilidad efectiva.

---

[panel]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_PANEL.md
[entradas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_ENTRADAS_CATALOGO.md
[resenas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_RESENAS.md
[resenas_catalogo]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_RESENAS_CATALOGO.md
[catalogo_entradas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_ENTRADAS.md
[swagger]: https://github.com/Equipo-7-Catalogo-de-eventos/ms-catalogo-eventos/blob/main/docs/swagger.json
[issue5]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/5
[issue10]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/10
[issue11]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/11
[issue12]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/12
[issue13]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/13
