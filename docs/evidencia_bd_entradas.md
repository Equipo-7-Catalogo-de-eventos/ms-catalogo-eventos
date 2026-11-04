### Evidencia de Base de Datos (BD1) - Integración con Entradas

**Descripción:** Se demuestra la persistencia y consistencia de datos en el Catálogo al recibir una actualización de stock desde el microservicio de Entradas. La operación es trazable por el identificador único del evento.

#### 1. Estado Antes de la Integración
Se ejecuta la consulta para verificar el estado del inventario antes de que el microservicio de Entradas envíe la compra.

**Consulta SQL:**
```sql
SELECT id_evento, nombre_evento, stock_actual FROM eventos WHERE id_evento = 'evt-101';
```

**Captura (Antes):**

![Estado inicial del stock](evidencia_bd_antes.png)

*(Nota: El stock actual verificado es de 145 unidades para el evento evt-101)*
