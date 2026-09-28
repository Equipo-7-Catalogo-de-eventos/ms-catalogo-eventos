const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Catálogo de Eventos - TicketU',
    version: '1.0.0',
    description: 'Documentación visual e interactiva del microservicio de Catálogo'
  },
  paths: {
    '/api/v1/events': {
      get: {
        summary: 'Listar y filtrar eventos',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'isFree', in: 'query', schema: { type: 'boolean' } },
          { name: 'isPast', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: { 200: { description: 'Lista de eventos' } }
      },
      post: {
        summary: 'Crear un nuevo evento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' }, description: { type: 'string' },
                  category: { type: 'string' }, start_date: { type: 'string' },
                  end_date: { type: 'string' }, location_name: { type: 'string' },
                  is_free: { type: 'boolean' }, base_price: { type: 'number' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Evento creado' } }
      }
    },
    '/api/v1/events/{id}': {
      get: {
        summary: 'Obtener detalle de un evento',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detalle del evento' } }
      },
      put: {
        summary: 'Editar un evento existente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' }, description: { type: 'string' },
                  base_price: { type: 'number' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Evento actualizado' } }
      }
    },
    '/api/v1/events/{id}/cancel': {
      patch: {
        summary: 'Cancelar un evento',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Evento cancelado' } }
      }
    },
    '/api/v1/events/{id}/stock': {
      patch: {
        summary: 'Actualizar stock desde módulo Entradas',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  available_stock: { type: 'number' },
                  is_sold_out: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Stock actualizado' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/events', eventRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Catálogo de Eventos' });
});

app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});