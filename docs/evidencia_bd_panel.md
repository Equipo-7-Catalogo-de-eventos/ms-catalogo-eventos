### Evidencia de Base de Datos (BD2) - Integración con Panel Organizador

**Descripción:** Se demuestra la persistencia, consistencia y trazabilidad de los datos en el Catálogo al recibir una actualización real de los detalles del evento proveniente directamente desde el microservicio de Panel Organizador.

#### 1. Estado Antes de la Integración
Se ejecuta la consulta SQL para verificar el estado inicial de los datos del evento en la base de datos antes de recibir la actualización del panel.

**Consulta SQL:**
```sql
SELECT id_evento, nombre_evento, lugar_evento, descripcion_evento FROM eventos WHERE id_evento = 'evt-101';
