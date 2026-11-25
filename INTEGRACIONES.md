
# Integraciones - Evaluación 4

**Equipo 7 - Catálogo de Eventos**

| ID | Proveedor | Consumidor | Endpoint | Contrato | Issue | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | Panel Organizador | Catálogo | `GET /api/v1/organizador/eventos/proximos` | [Catálogo-Panel][panel] | [#10][issue10] | Verificada en workstation |
| I2 | Catálogo | Entradas/Inventario | `PUT /api/v1/catalogo/eventos/{id_evento}/stock` | [Entradas-Catálogo][entradas] | [#12][issue12] | Verificada en workstation |
| I3 | Reseñas | Catálogo | `POST /api/v1/resenas/calificaciones-basicas` y `GET /api/v1/resenas/evento/{id_evento}` | [Catálogo-Reseñas][resenas] | [#11][issue11] | Verificada en workstation |
| I4 | Catálogo | Reseñas | `GET /api/catalogo/eventos/{id}/info-servicio` | [Reseñas-Catálogo][resenas_catalogo] | [#13][issue13] | Verificada en workstation |
| I5 | Catálogo | Promociones | `GET /api/catalogo/eventos/{id}/precio` | Pendiente de formalización | [#19][issue19] | Pendiente de verificación en workstation |

[panel]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_PANEL.md
[entradas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_ENTRADAS_CATALOGO.md
[resenas]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_CATALOGO_RESENAS.md
[resenas_catalogo]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/blob/main/docs/CONTRATO_RESENAS_CATALOGO.md
[issue10]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/10
[issue11]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/11
[issue12]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/12
[issue13]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/13
[issue19]: https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/issues/19
