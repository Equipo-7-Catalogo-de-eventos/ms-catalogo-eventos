# Microservicio de Catálogo de Eventos (TicketU)

Microservicio backend RESTful desarrollado en **Node.js** y **Express**, encargado de la gestión, consulta, búsqueda avanzada y vista de detalle de eventos, conectado a base de datos PostgreSQL alojada en **Supabase**.

> 📚 **Documentación General y Contratos:**  
> Los contratos de interfaz interservicios, diagramas de secuencia e hitos de planificación se encuentran en el repositorio principal:  
> 👉 **[Equipo-7-Catalogo-de-eventos / Catalogo_de_eventos](https://github.com/Equipo-7-Catalogo-de-eventos/Catalogo_de_eventos)**

---

## Características
* **API RESTful modular**: Separación clara de responsabilidades con `routes/`, `controllers/` y `config/`.
* **Persistencia en Supabase / PostgreSQL**: Integración oficial con `@supabase/supabase-js`.
* **Documentación Interactiva (Swagger OpenAPI 3.0)**: Explorador de endpoints listo para usar en `/api-docs`.
* **Health Check Endpoint**: Verificación de estado del servicio en `/health`.
* **CORS y Variables de Entorno**: Configuración flexible mediante `dotenv` y `cors`.

---

## Estructura del Microservicio

```text
ms-catalogo-eventos/
├── src/
│   ├── config/
│   │   └── supabase.js             # Inicialización del cliente Supabase
│   ├── controllers/
│   │   └── eventController.js      # Lógica de negocio y consultas a tabla 'eventos'
│   ├── routes/
│   │   └── eventRoutes.js          # Definición de rutas Express
│   └── index.js                    # Entrada del servidor y configuración Swagger
├── .env.example                    # Plantilla de variables de entorno
├── .gitignore                      # Exclusiones de Git (node_modules, .env, etc.)
├── package.json
└── README.md
```

---

## Requisitos Previos
* **Node.js** v18 o superior
* **npm** v9 o superior
* Instancia de **Supabase** con el esquema ejecutado (disponible en `schema_db.sql` del repositorio de documentación).

---

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/Equipo-7-Catalogo-de-eventos/ms-catalogo-eventos.git
cd ms-catalogo-eventos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea tu archivo `.env` a partir del ejemplo:
```bash
cp .env.example .env
```

Configura tus credenciales en `.env`:
```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-o-service-role-key
```

---

## Ejecución

### Modo Desarrollo (con recarga automática mediante nodemon):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

---

## Endpoints Principales

| Método | Endpoint | Descripción | Parámetros / Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de salud del servicio | Ninguno |
| `GET` | `/api-docs` | Documentación Swagger UI interactiva | Ninguno |
| `GET` | `/api/v1/events` | Listado y filtros de eventos | `search`, `category`, `isFree` |
| `GET` | `/api/v1/events/:id` | Detalle completo de un evento por ID | `id` (path) |
| `POST` | `/api/v1/events` | Crear un nuevo evento | JSON del evento |
| `PATCH`| `/api/v1/events/:id/stock` | Actualizar stock desde Entradas/Inventario | `inventario_stock`, `evento_estado` |
