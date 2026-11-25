# Microservicio de Catálogo de Eventos (TicketU)

Microservicio backend RESTful desarrollado en **Node.js** y **Express**, encargado del listado, búsqueda, filtrado y consulta de eventos, con persistencia en PostgreSQL mediante **Supabase**.

> **Repositorio principal, documentación y contratos:**  
> [Catalogo_de_eventos](https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos)

---

## Características de la implementación

- **Visualización de eventos (HU1):** Listado de eventos próximos, vigentes y pasados.
- **Búsqueda multivariable (HU2):** Búsqueda por título, descripción y lugar del evento.
- **Filtros avanzados (HU3 / BE1):**
  - Temporalidad: `proximos` y `pasados`.
  - Rango de fechas: `fecha_desde` y `fecha_hasta`.
  - Filtrado por múltiples categorías.
  - Ordenamiento por fecha, valoración y precio.
  - Paginación mediante `pagina` y `limite`.
- **Detalle del evento (HU4):** Consulta de información, precio, disponibilidad y estado.
- **Disponibilidad de entradas (HU5):** Actualización del stock desde Entradas/Inventario.
- **Visualización de reseñas (HU6):** Consulta de calificaciones y opiniones de los eventos.
- **Consumo de servicios (BE2):** Integración con Panel Organizador y Reseñas, con manejo de errores y tiempos de espera.
- **Provisión de servicios (BE3):** Información de eventos para Reseñas, actualización de stock desde Entradas/Inventario y consulta de precios para Promociones.
- **Dockerización:** Conexión a la red compartida `plataforma-eventos-net`.
- **Swagger OpenAPI 3.0:** Documentación interactiva disponible en `/api-docs`.

---

## Estructura del repositorio

```text
ms-catalogo-eventos/
├── docs/                         # Contratos, esquemas SQL, diagramas y evidencias
├── src/
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   │   └── eventController.js
│   ├── data/
│   │   └── eventStore.js
│   ├── routes/
│   │   └── eventRoutes.js
│   ├── services/
│   │   └── externalServices.js
│   └── index.js
├── Dockerfile                    # Node 22 Alpine
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── INTEGRACIONES.md
├── RESPONSABLES.md
└── README.md
```

---

## Variables de entorno

Crear el archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Configurar las siguientes variables según el ambiente de ejecución:

```env
PORT=4000
SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
SUPABASE_KEY=tu-anon-key

RESENAS_SERVICE_URL=http://resenas-service:3000
ORGANIZADOR_SERVICE_URL=http://organizador-service:3000
ENTRADAS_SERVICE_URL=http://entradas-service:3000

EXTERNAL_TIMEOUT_MS=500
```

Las direcciones y credenciales deben corresponder al ambiente de ejecución. En workstation, las comunicaciones entre módulos deben utilizar las rutas configuradas en el API Gateway. El archivo `.env` no debe incorporarse al repositorio.

---

## Ejecución local

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

## Ejecución con Docker

API Gateway central de TicketU: [FWizav/backendticketU](https://github.com/FWizav/backendticketU).

### 1. Crear la red compartida

Si la red no existe:

```bash
docker network create plataforma-eventos-net
```

### 2. Construir e iniciar el contenedor

```bash
docker compose up -d --build
```

| Parámetro | Valor |
| --- | --- |
| Contenedor | `ms-catalogo-eventos` |
| Alias de red | `catalogo-service` |
| Red Docker | `plataforma-eventos-net` |
| Puerto interno | `3000` |
| Puerto externo | `4000` |

---

## Inicialización de Base de Datos (`BD1` / `BD3`)

El esquema relacional, restricciones (`CHECK`), índices GIN/B-Tree y los 16 registros iniciales se encuentran en `docs/schema_db.sql` (y su documentación técnica en `docs/diccionario-de-datos.md` y `docs/diagrama-relacional.md`).

### Opción A: Mediante Supabase (Ambiente Cloud / Workstation)
1. Ingresar al **SQL Editor** del proyecto en Supabase configurado en `SUPABASE_URL`.
2. Copiar y ejecutar el contenido íntegro de `docs/schema_db.sql`.
3. Verificar en el **Table Editor** que la tabla `eventos` se haya creado con sus 16 registros iniciales y sus URLs de imagen actualizadas.

### Opción B: Mediante PostgreSQL local o contenedor (`psql`)
Si se despliega sobre una instancia PostgreSQL estándar en workstation:
```bash
psql -h <HOST_DB> -U <USUARIO_DB> -d <NOMBRE_DB> -f docs/schema_db.sql
```

### Flujo Principal de Verificación
1. Consultar `GET /api/catalogo/eventos` (a través del API Gateway o desde el Front End del catálogo) para visualizar la cartelera general (acceso público o autenticado con usuario de prueba de Auth con `rol: cliente` u `organizador`).
2. Filtrar eventos por categoría (ej. `GET /api/catalogo/eventos?categoria=academico`) o realizar búsqueda por palabras clave (ej. `GET /api/catalogo/eventos?busqueda=TITEC`).
3. Ingresar al detalle de un evento específico (`GET /api/catalogo/eventos/evt-101`) y verificar disponibilidad de stock, precio final y calificación promedio consolidada.

---

## Endpoints principales

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio |
| GET | `/api-docs` | Documentación interactiva Swagger |
| GET | `/api/catalogo/eventos` | Listado, búsqueda, filtrado y paginación de eventos |
| GET | `/api/catalogo/eventos/:id` | Detalle del evento |
| GET | `/api/catalogo/eventos/:id/resenas` | Consulta de calificaciones y reseñas |
| GET | `/api/catalogo/eventos/:id/info-servicio` | Información del evento para Reseñas |
| GET | `/api/catalogo/eventos/:id/precio` | Consulta del precio para Promociones |
| POST | `/api/catalogo/eventos` | Registro de eventos |
| PATCH | `/api/catalogo/eventos/:id/estado` | Actualización del estado del evento |
| PUT | `/api/catalogo/eventos/:id/stock` | Actualización de stock desde Entradas/Inventario |
| PATCH | `/api/catalogo/eventos/:id/stock` | Ruta alternativa de actualización de stock |

---

## Documentación

- [Contratos de integración](https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos/tree/main/docs)
- [Diccionario de Datos](docs/diccionario-de-datos.md)
- [Diagrama Relacional](docs/diagrama-relacional.md)
- [Script SQL de Creación](docs/schema_db.sql)
- [Integraciones](INTEGRACIONES.md)
- [Responsables](RESPONSABLES.md)
- [Evidencias de integración](docs/EVIDENCIAS_INTEGRACION.md)
