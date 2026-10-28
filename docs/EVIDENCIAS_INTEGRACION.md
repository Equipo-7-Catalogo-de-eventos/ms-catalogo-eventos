# Guía y Evidencias de Integración de Microservicios

**Módulo:** Catálogo de Eventos  
**Equipo:** Equipo 7  
**Entrega:** Sprint 2 - Integración de Microservicios  
**Asignatura:** Arquitectura de Software / Plataforma de Eventos  

---

## 1. Resumen de Configuración del Microservicio

| Parámetro | Valor Oficial de Integración |
|---|---|
| **Nombre del Contenedor** | `ms-catalogo-eventos` |
| **Puerto Interno / Externo** | `4000` |
| **Red Compartida Docker** | `plataforma-eventos-net` (externa) |
| **Prefijo Oficial de Rutas** | `/api/catalogo/eventos` (alias `/api/catalogo`) |
| **Documentación OpenAPI 3.0** | `/api-docs` (Swagger UI interactivo) |
| **Variable en Gateway** | `CATALOGO_SERVICE_URL=http://ms-catalogo-eventos:4000` |

---

## 2. Cumplimiento de los 6 Pasos de Integración

### ✅ Paso 1: Levantar su servicio
* **Dockerfile:** Imagen ligera basada en `node:20-alpine`.
* **Puerto:** Expone el puerto `4000` (`EXPOSE 4000`), evitando colisiones con frontends (3000) u otros microservicios.
* **Comando de arranque:** `CMD ["node", "src/index.js"]`.

### ✅ Paso 2: Compartir red (`plataforma-eventos-net`)
El servicio se conecta a la red compartida definida por la cátedra mediante `docker-compose.yml`:
```yaml
services:
  ms-catalogo-eventos:
    build: .
    container_name: ms-catalogo-eventos
    ports:
      - "4000:4000"
    networks:
      - plataforma-eventos-net

networks:
  plataforma-eventos-net:
    external: true
```
* **Comando para crear la red (si no existe previamente en la máquina anfitriona):**
  ```bash
  docker network create plataforma-eventos-net
  ```
* **Comando de despliegue:**
  ```bash
  docker compose up --build -d
  ```

### ✅ Paso 3: Respetar rutas (`/api/<modulo>/...` y OpenAPI)
* Todos los endpoints de Catálogo de Eventos responden bajo el prefijo reglamentario:
  * `GET /api/catalogo/eventos`
  * `GET /api/catalogo/eventos/:id`
  * `GET /api/catalogo/eventos/:id/resenas`
  * `PUT /api/catalogo/eventos/:id/stock`
  * `GET /api/catalogo/eventos/:id/info-servicio`
* **Swagger OpenAPI:** Disponible localmente en `http://localhost:4000/api-docs` con esquema JSON descargable en `/docs/swagger.json`.

### ✅ Paso 4: Registrar destino (`*_SERVICE_URL`)
* **Variable que expone Catálogo para el Gateway:**
  ```env
  CATALOGO_SERVICE_URL=http://ms-catalogo-eventos:4000
  ```
* **Variables que consume Catálogo desde la red Docker:**
  ```env
  RESENAS_SERVICE_URL=http://ms-resenas:3000
  ORGANIZADOR_SERVICE_URL=http://ms-organizador:3000
  EXTERNAL_TIMEOUT_MS=500
  ```

### ✅ Paso 5: Acordar eventos y contratos (1 Servicio Provisto + 1 Servicio Consumido)

El microservicio cumple con la directriz del profesor René de proveer y consumir servicios acordados:

#### 1. Servicio que Proveemos a otros módulos (Entradas / Inventario):
* **Endpoint:** `PUT /api/catalogo/eventos/:id/stock`
* **Consumidor:** Microservicio de **Entradas / Inventario** tras concretar una compra.
* **Comportamiento:** Actualiza el campo `stock_actual`. Si el nuevo stock es `0`, pasa automáticamente el estado a `'agotado'`; si se repone stock, vuelve a `'disponible'`.

#### 2. Servicio que Proveemos a otros módulos (Reseñas / Promociones):
* **Endpoint:** `GET /api/catalogo/eventos/:id/info-servicio`
* **Consumidores:** **Reseñas** y **Promociones** para validar existencia, título y precio final del evento sin sobrecargar el detalle completo.

#### 3. Servicio que Consumimos de otro módulo (Reseñas):
* **Endpoint consultado:** `POST /api/v1/resenas/calificaciones-basicas` y `GET /api/v1/resenas/evento/:id`
* **Proveedor:** Microservicio de **Reseñas**.
* **Resiliencia (SLA):** Timeout estricto de **500 ms** (`AbortSignal.timeout(500)`). Si Reseñas no responde o falla, Catálogo activa **Graceful Degradation** retornando `"Sin calificaciones aún"` y preservando la navegación y compra sin errores 500.

---

## 3. Evidencias de Pruebas HTTP (Paso 6)

A continuación se presentan los comandos `curl` y las respuestas verificadas del sistema:

### Evidencia 1: Servicio Provisto - Actualización de Stock desde Entradas
**Request:**
```bash
curl -X PUT http://localhost:4000/api/catalogo/eventos/evt-101/stock \
  -H "Content-Type: application/json" \
  -d '{
    "nuevo_stock": 140,
    "token_sesion": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Stock actualizado correctamente.",
  "data": {
    "id_evento": "evt-101",
    "evento_id": "evt-101",
    "stock_anterior": 150,
    "nuevo_stock": 140,
    "estado_evento": "disponible",
    "fecha_actualizacion": "2026-10-28T17:40:00.000Z"
  }
}
```

---

### Evidencia 2: Servicio Provisto - Información Ligera para Microservicios
**Request:**
```bash
curl -X GET http://localhost:4000/api/catalogo/eventos/evt-101/info-servicio
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id_evento": "evt-101",
    "nombre_evento": "Festival de Innovación y Tecnología 2026",
    "precio_final_evento": 15000,
    "estado_evento": "disponible",
    "fecha_evento": "2026-11-15T18:00:00Z",
    "titulo": "Festival de Innovación y Tecnología 2026",
    "precio_final": 15000
  }
}
```

---

### Evidencia 3: Servicio Consumido - Reseñas con Fallback Seguro (Resiliencia)
Cuando el microservicio externo de Reseñas no está disponible o supera el SLA de 500 ms:

**Request:**
```bash
curl -X GET http://localhost:4000/api/catalogo/eventos/evt-101/resenas?limite=3
```

**Response (`200 OK` - Graceful Degradation):**
```json
{
  "success": true,
  "data": {
    "id_evento": "evt-101",
    "evento_id": "evt-101",
    "promedio": 4.5,
    "total_resenas": 12,
    "resenas": [],
    "mensaje": "Información provista con resiliencia de catálogo"
  }
}
```
* **Log del Servidor:**
  ```text
  [BE2] Reseñas no disponible para calificaciones básicas (fetch failed). Preservando métricas locales.
  ```

---

## 4. Instrucciones de Verificación Rápida para Ayudantes / Profesor

1. Clonar el repositorio y ubicarse en la raíz:
   ```bash
   git clone https://github.com/Equipo-7-Catalogo-de-eventos/ms-catalogo-eventos.git
   cd ms-catalogo-eventos
   ```
2. Crear la red compartida (si no existe):
   ```bash
   docker network create plataforma-eventos-net 2>/dev/null || true
   ```
3. Construir y levantar el contenedor:
   ```bash
   docker compose up --build -d
   ```
4. Comprobar que el servicio responde y ver Swagger interactivo:
   * **API:** `curl http://localhost:4000/api/catalogo/eventos`
   * **Swagger:** Abrir en el navegador `http://localhost:4000/api-docs`
