# Microservicio de Catálogo de Eventos (TicketU)

Microservicio backend RESTful desarrollado en **Node.js** y **Express**, encargado de la consulta, búsqueda multivariable, filtros avanzados y vista de detalle de eventos, sincronizado con base de datos PostgreSQL alojada en **Supabase**.

> **Documentación General y Contratos:**  
> Los contratos de interfaz interservicios, diagramas de secuencia e hitos de planificación se encuentran en el repositorio principal:  
> **[Equipo-7-Catalogo-de-eventos / Catalogo_de_eventos](https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos)**

---

## Características de la Implementación (Rúbrica y Contratos)

* **Búsqueda Multivariable (HU2):** Búsqueda por palabra clave concurrente en `evento_titulo`, `evento_descripcion` y `evento_lugar`.
* **Filtros Avanzados (BE1):**
  * Temporalidad: `proximos` (>= hoy), `pasados` (< hoy).
  * Rango de fechas: `fecha_desde` y `fecha_hasta`.
  * Categorías múltiples: filtrado simultáneo por varias categorías (ej. `academico,fiesta`).
  * Ordenamiento dinámico: por fecha (`fecha_asc`, `fecha_desc`), valoración promedio (`valoracion`) o precio (`precio_asc`, `precio_desc`).
  * Paginación limpia: con `pagina` y `limite`.
* **Campo Calculado (BE1):** Atributo booleano `es_pasado` agregado a cada evento retornado.
* **Integración Interservicios Resiliente (BE2):**
  * Comunicación con microservicio de **Reseñas** para calificaciones básicas y opiniones detalladas con SLA < 500ms y *Graceful Degradation* (fallback automático a "Sin calificaciones aún" si Reseñas no responde).
  * Comunicación con **Panel Organizador** para carga de eventos.
* **Servicio para Otros Módulos (BE3):**
  * Endpoint `GET /api/catalogo/eventos/:id/info-servicio` para entregar ID y nombre a Reseñas, y precio a Promociones.
* **Sincronización de Stock con Entradas (Contrato oficial):**
  * Endpoint `PUT /api/catalogo/eventos/:id/stock` que valida `nuevo_stock` y `token_sesion`, actualizando automáticamente el estado a `agotado` si el stock llega a 0.
* **Dockerización Compartida:** Configurado para conectarse a la red común Docker `plataforma-eventos-net`.
* **Swagger OpenAPI 3.0:** Documentación completa en español accesible en `/api-docs`.

---

## Estructura del Repositorio

```text
ms-catalogo-eventos/
├── src/
│   ├── config/
│   │   └── supabase.js             # Inicialización del cliente Supabase
│   ├── controllers/
│   │   └── eventController.js      # Lógica de negocio y controladores
│   ├── routes/
│   │   └── eventRoutes.js          # Definición de rutas Express
│   ├── services/
│   │   └── externalServices.js     # Integración HTTP con otros microservicios (BE2)
│   └── index.js                    # Entrada de servidor Express y Swagger UI
├── Dockerfile                      # Contenedor Node 20 Alpine
├── docker-compose.yml              # Despliegue con red plataforma-eventos-net
├── .env.example                    # Plantilla de variables de entorno (puerto 4000)
├── .gitignore                      # Exclusiones de Git
├── package.json
└── README.md
```

---

## Variables de Entorno

Crear un archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
```

Contenido necesario:
```env
PORT=4000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key

# Microservicios externos (Red plataforma-eventos-net / Gateway)
RESENAS_SERVICE_URL=http://resenas-service:3000
ORGANIZADOR_SERVICE_URL=http://organizador-service:3000
ENTRADAS_SERVICE_URL=http://entradas-service:3000
EXTERNAL_TIMEOUT_MS=500
```

---

## Ejecución Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar en modo desarrollo
```bash
npm run dev
```

### 3. Iniciar en modo producción
```bash
npm start
```

---

## Ejecución con Docker (Red Compartida plataforma-eventos-net)

El microservicio está preparado para integrarse al **API Gateway** central de TicketU ([FWizav/backendticketU](https://github.com/FWizav/backendticketU)).

1. Crear la red compartida (si no existe):
```bash
docker network create plataforma-eventos-net 2>/dev/null || true
```

2. Construir y levantar el contenedor:
```bash
docker compose up -d --build
```

El servicio se registra en la red con el nombre de contenedor `ms-catalogo-eventos` y el alias de red `catalogo-service` en el puerto `4000`.

---

## Endpoints Principales

| Método | Endpoint | Descripción |
| :---: | :--- | :--- |
| `GET` | `/health` | Chequeo de salud del servicio |
| `GET` | `/api-docs` | Documentación interactiva Swagger OpenAPI 3.0 |
| `GET` | `/api/catalogo/eventos` | Listar eventos con filtros avanzados, búsqueda multivariable y paginación |
| `GET` | `/api/catalogo/eventos/:id` | Detalle completo del evento y campo calculado `es_pasado` |
| `GET` | `/api/catalogo/eventos/:id/resenas` | Consulta de estrellas y opiniones a Reseñas con fallback seguro |
| `GET` | `/api/catalogo/eventos/:id/info-servicio` | Datos mínimos para microservicios de Reseñas y Promociones (BE3) |
| `PUT` | `/api/catalogo/eventos/:id/stock` | Actualizar stock desde Entradas/Inventario (conforme a contrato) |

Para ver el detalle completo de las pruebas, capturas y respuestas HTTP de integración, consultar:  
👉 **[Guía y Evidencias de Integración (docs/EVIDENCIAS_INTEGRACION.md)](docs/EVIDENCIAS_INTEGRACION.md)**

