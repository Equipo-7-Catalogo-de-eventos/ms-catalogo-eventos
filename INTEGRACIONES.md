
# Integraciones - Evaluación 4

**Equipo 7 - Catálogo de Eventos**

| ID | Proveedor | Consumidor | Endpoint | Contrato | Issue | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | Panel Organizador | Catálogo | `GET /api/v1/organizador/eventos/proximos` | [Catálogo-Panel][panel] | [#10][issue10] | Verificada en workstation |
| I2 | Catálogo | Entradas/Inventario | `PUT /api/v1/catalogo/eventos/{id_evento}/stock` | [Entradas-Catálogo][entradas] | [#12][issue12] | Verificada en workstation |
| I3 | Reseñas | Catálogo | `POST /api/v1/resenas/calificaciones-basicas` y `GET /api/v1/resenas/evento/{id_evento}` | [Catálogo-Reseñas][resenas] | [#11][issue11] | Verificada en workstation |
| I4 | Catálogo | Reseñas | `GET /api/catalogo/eventos/{id}/info-servicio` | [Reseñas-Catálogo][resenas_catalogo] | [#13][issue13] | Verificada en workstation |
| I5 | Catálogo | Promociones | `GET /api/catalogo/eventos/{id}/precio` | Pendiente de formalización | [#19][issue19] | Servicio disponible en workstation; pendiente de corrección de configuración en Promociones |

## Observaciones de la verificación en workstation (24-11-2026)

- **I2:** al reservar una entrada del evento TestRN desde Entradas, `stock_actual` pasó de 100 a 8 en el catálogo. Entradas informa el stock al reservar; Pagos no estaba operativo, por lo que no se probó una compra completa.
- **I5:** el endpoint responde por el API Gateway y desde el contenedor de Promociones (`http://catalogo-service:3000/api/catalogo/eventos/{id}/precio`). Promociones tiene configurado `CATALOGO_SERVICE_URL=http://ticketu-catalogo:4001`, que no existe en la red; debe ser `http://catalogo-service:3000/api/catalogo`. Se informó al equipo Promociones.
- Evidencias: [docs/EVIDENCIAS_INTEGRACION.md](docs/EVIDENCIAS_INTEGRACION.md).

[panel]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_PANEL.md
[entradas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_ENTRADAS_CATALOGO.md
[resenas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_RESENAS.md
[resenas_catalogo]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_RESENAS_CATALOGO.md
[issue10]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/10
[issue11]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/11
[issue12]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/12
[issue13]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/13
[issue19]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/19
