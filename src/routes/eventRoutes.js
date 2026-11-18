const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  getEventReviews,
  updateStock,
  getEventServiceInfo,
  createEvent,
  updateEventStatus
} = require('../controllers/eventController');

// 1. Listado y creación de eventos (Integración Panel Organizador I2)
router.route('/')
  .get(getEvents)
  .post(createEvent);

// 2. Información ligera para integración de otros microservicios (BE3)
router.get('/:id/info-servicio', getEventServiceInfo);

// 3. Consulta de opiniones y estrellas para el módulo de detalle de Amalia
router.get('/:id/resenas', getEventReviews);

// 4. Detalle completo de un evento con campo es_pasado y notas (HU4)
router.get('/:id', getEventById);

// 5. Cierre o cancelación de evento desde Panel Organizador
router.patch('/:id/estado', updateEventStatus);

// 6. Actualización de stock tras compra (Contrato Entradas ↔ Catálogo)
// Soporta PUT conforme a contrato firmado (y PATCH como alias seguro)
router.route('/:id/stock')
  .put(updateStock)
  .patch(updateStock);

module.exports = router;
