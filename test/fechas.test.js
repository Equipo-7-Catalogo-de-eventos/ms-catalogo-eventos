/**
 * Pruebas unitarias del cálculo de es_pasado (src/utils/fechas.js).
 *
 * Panel Organizador envía fecha_evento como medianoche UTC del día del evento
 * y la hora por separado. El evento debe considerarse "pasado" recién cuando
 * llega su fecha + hora en hora de Chile (America/Santiago).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esEventoPasado, instanteEvento, hoyEnZona } = require('../src/utils/fechas');

// Evento real de workstation: TestRN, 25-11-2026 a las 14:30 (hora de Chile)
const FECHA_PANEL = '2026-11-25T00:00:00+00:00';
const HORA = '14:30';

test('un evento de mañana no es pasado a las 21:19 del día anterior (hora de Chile)', () => {
  const ahora = new Date('2026-11-25T00:19:00Z'); // 24-11-2026 21:19 en Chile
  assert.equal(esEventoPasado(FECHA_PANEL, HORA, ahora), false);
});

test('el evento sigue vigente un minuto antes de su hora de inicio', () => {
  const ahora = new Date('2026-11-25T17:29:00Z'); // 25-11-2026 14:29 en Chile
  assert.equal(esEventoPasado(FECHA_PANEL, HORA, ahora), false);
});

test('el evento pasa a ser pasado un minuto después de su hora de inicio', () => {
  const ahora = new Date('2026-11-25T17:31:00Z'); // 25-11-2026 14:31 en Chile
  assert.equal(esEventoPasado(FECHA_PANEL, HORA, ahora), true);
});

test('fecha + hora se convierten al instante correcto en hora de Chile (UTC-3 en verano)', () => {
  const instante = instanteEvento(FECHA_PANEL, HORA);
  assert.equal(instante.toISOString(), '2026-11-25T17:30:00.000Z');
});

test('sin hora conocida, el evento se considera vigente hasta el final del día', () => {
  const ahora = new Date('2026-11-25T20:00:00Z'); // 25-11-2026 17:00 en Chile
  assert.equal(esEventoPasado(FECHA_PANEL, null, ahora), false);
});

test('un evento de meses atrás es pasado', () => {
  assert.equal(esEventoPasado('2026-08-30T08:30:00+00:00', '08:30', new Date('2026-11-25T12:00:00Z')), true);
});

test('una fecha inválida no marca el evento como pasado', () => {
  assert.equal(esEventoPasado('no-es-fecha', '10:00'), false);
  assert.equal(esEventoPasado(null, '10:00'), false);
});

test('hoyEnZona entrega el día calendario de Chile, no el de UTC', () => {
  // 25-11-2026 00:19 UTC sigue siendo 24-11-2026 en Chile
  assert.equal(hoyEnZona(new Date('2026-11-25T00:19:00Z')), '2026-11-24');
});
