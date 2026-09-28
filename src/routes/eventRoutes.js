const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  updateStock
} = require('../controllers/eventController');

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent);

router.route('/:id/cancel')
  .patch(cancelEvent);

router.route('/:id/stock')
  .patch(updateStock);

module.exports = router;