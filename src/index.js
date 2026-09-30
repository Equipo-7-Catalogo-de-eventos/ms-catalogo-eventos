const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
// Corrección 8: Puerto 4000 por defecto para evitar choques con el frontend
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Documentación OpenAPI 3.0 corregida con nombres reales de BD en español y formatos de respuesta (Rúbrica punto 4)
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Catálogo de Eventos - TicketU',
    version: '1.2.0',
    description: 'Microservicio de consulta, búsqueda y catálogo de eventos para clientes, sincronizado con base de datos PostgreSQL/Supabase.'
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Servidor local de desarrollo'
    }
  ],
  paths: {
    '/api/catalogo/eventos': {
      get: {
        summary: 'Listar y filtrar eventos del catálogo (HU1, HU2, HU3, BE1)',
        description: 'Permite buscar por palabra clave, filtrar por categorías múltiples, tipo de evento, temporalidad y rango de fechas, con ordenamiento y paginación.',
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Palabra clave a buscar en título, descripción o lugar',
            schema: { type: 'string' }
          },
          {
            name: 'categorias',
            in: 'query',
            description: 'Una o varias categorías separadas por coma (ej. academico,fiesta)',
            schema: { type: 'string' }
          },
          {
            name: 'isFree',
            in: 'query',
            description: "Filtrar por eventos gratuitos ('true') o de pago ('false'). Si se envía otro valor responde 400.",
            schema: { type: 'string', enum: ['true', 'false'] }
          },
          {
            name: 'temporalidad',
            in: 'query',
            description: "Filtro de vigencia: 'proximos' (>= hoy) o 'pasados' (< hoy)",
            schema: { type: 'string', enum: ['proximos', 'pasados', 'todos'] }
          },
          {
            name: 'fecha_desde',
            in: 'query',
            description: 'Fecha inicial en formato ISO 8601 (ej. 2026-10-01)',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'fecha_hasta',
            in: 'query',
            description: 'Fecha límite en formato ISO 8601',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'orden',
            in: 'query',
            description: 'Criterio de ordenación',
            schema: {
              type: 'string',
              enum: ['fecha_asc', 'fecha_desc', 'valoracion', 'precio_asc', 'precio_desc']
            }
          },
          {
            name: 'pagina',
            in: 'query',
            description: 'Número de página (por defecto: 1)',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'limite',
            in: 'query',
            description: 'Cantidad de elementos por página (por defecto: 10, máx: 100)',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          200: {
            description: 'Listado de eventos obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 1 },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 15 },
                        pagina: { type: 'integer', example: 1 },
                        limite: { type: 'integer', example: 10 },
                        total_paginas: { type: 'integer', example: 2 }
                      }
                    },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Evento' }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Parámetro de consulta inválido (ej. isFree incorrecto)'
          },
          500: {
            description: 'Error interno del servidor o falla en la base de datos'
          }
        }
      }
    },
    '/api/catalogo/eventos/{id}': {
      get: {
        summary: 'Obtener detalle completo de un evento (HU4)',
        description: 'Entrega la ficha completa del evento con el campo calculado es_pasado y notas de Reseñas.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador único del evento (ej. evt-101)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Detalle del evento encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EventoDetalle' }
                  }
                }
              }
            }
          },
          404: {
            description: 'Evento no encontrado'
          },
          500: {
            description: 'Error al consultar la base de datos'
          }
        }
      }
    },
    '/api/catalogo/eventos/{id}/info-servicio': {
      get: {
        summary: 'Consultar información ligera para otros microservicios (BE3)',
        description: 'Entrega ID y título (para Reseñas) y precio (para Promociones).',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Información básica de servicio entregada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id_evento: { type: 'string', example: 'evt-101' },
                        titulo: { type: 'string', example: 'Feria de Innovación TITEC' },
                        precio_final: { type: 'number', example: 0 },
                        estado: { type: 'string', example: 'disponible' },
                        fecha: { type: 'string', example: '2026-10-15 10:00:00+00' }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Evento no existe' },
          500: { description: 'Error interno' }
        }
      }
    },
    '/api/catalogo/eventos/{id}/stock': {
      put: {
        summary: 'Actualizar stock desde módulo Entradas / Inventario (Contrato oficial)',
        description: 'Actualiza la cantidad disponible y marca automáticamente como agotado si nuevo_stock es 0.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nuevo_stock', 'token_sesion'],
                properties: {
                  nuevo_stock: { type: 'integer', minimum: 0, example: 148 },
                  token_sesion: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Stock actualizado correctamente en Catálogo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    mensaje: { type: 'string', example: 'Stock de Catálogo actualizado correctamente' },
                    data: {
                      type: 'object',
                      properties: {
                        evento_id: { type: 'string' },
                        inventario_stock: { type: 'integer' },
                        evento_estado: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Parámetros inválidos (ej. stock negativo)' },
          401: { description: 'No autorizado. Token de sesión no válido o ausente' },
          404: { description: 'Evento no encontrado' },
          500: { description: 'Error interno al actualizar' }
        }
      }
    }
  },
  components: {
    schemas: {
      Evento: {
        type: 'object',
        properties: {
          evento_id: { type: 'string', example: 'evt-101' },
          evento_titulo: { type: 'string', example: 'Feria de Innovación TITEC' },
          evento_descripcion: { type: 'string', example: 'Muestra anual de proyectos.' },
          evento_lugar: { type: 'string', example: 'Auditorio Principal UV' },
          evento_fecha: { type: 'string', format: 'date-time', example: '2026-10-15T10:00:00Z' },
          evento_hora: { type: 'string', example: '10:00' },
          evento_imagen: { type: 'string', format: 'uri', example: 'https://ticketu.cl/img/feria-titec.jpg' },
          evento_precio_final: { type: 'number', example: 0 },
          evento_tipo: { type: 'string', enum: ['gratuito', 'pagado'], example: 'gratuito' },
          evento_categoria: { type: 'string', example: 'academico' },
          evento_estado: { type: 'string', enum: ['disponible', 'agotado', 'pasado'], example: 'disponible' },
          inventario_stock: { type: 'integer', example: 150 },
          resena_calificacion_promedio: { type: 'number', example: 4.8 },
          resena_total: { type: 'integer', example: 12 },
          es_pasado: { type: 'boolean', example: false }
        }
      },
      EventoDetalle: {
        allOf: [
          { $ref: '#/components/schemas/Evento' },
          {
            type: 'object',
            properties: {
              resenas_opiniones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    usuario_id: { type: 'string' },
                    calificacion: { type: 'integer' },
                    comentario: { type: 'string' },
                    fecha: { type: 'string' }
                  }
                }
              },
              resena_estado: { type: 'string', example: 'Disponible' }
            }
          }
        ]
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Corrección 7: Enrutamiento alineado al API Gateway (/api/catalogo/*)
app.use('/api/catalogo/eventos', eventRoutes);
app.use('/api/catalogo', eventRoutes);

// Alias de retrocompatibilidad con frontend existente
app.use('/api/v1/events', eventRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ms-catalogo-eventos',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[ms-catalogo-eventos] Servidor ejecutándose en puerto ${PORT}`);
  console.log(`[ms-catalogo-eventos] API Gateway route: http://localhost:${PORT}/api/catalogo/eventos`);
  console.log(`[ms-catalogo-eventos] Swagger UI: http://localhost:${PORT}/api-docs`);
});
