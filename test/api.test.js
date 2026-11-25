/**
 * Pruebas de funcionalidad de la API del Catálogo de Eventos.
 *
 * Levantan el servidor Express en un puerto libre y validan, mediante HTTP,
 * las funcionalidades instaladas: listado, filtros, paginación, detalle,
 * precio para Promociones, información para Reseñas, reseñas, actualización
 * de stock, registro de eventos y CORS.
 *
 * Las pruebas solo leen datos o envían solicitudes inválidas: no crean
 * eventos ni modifican el stock. La única escritura reenvía al evento su
 * mismo stock actual, por lo que el dato no cambia.
 *
 * Panel Organizador y Reseñas se apuntan a una dirección sin servicio para
 * comprobar que el catálogo sigue respondiendo cuando una contraparte falla
 * (respaldo con datos locales). La base de datos es la configurada en .env
 * o, si no existe, la de Supabase del proyecto; si no responde, el catálogo
 * usa sus datos en memoria y las pruebas igual deben pasar.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dcujewthkanzjlvrhedd.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_SpGlcEWkJolywphsoEL5EA_JBCu6w6t';
process.env.ORGANIZADOR_SERVICE_URL = 'http://127.0.0.1:9';
process.env.RESENAS_SERVICE_URL = 'http://127.0.0.1:9';

const app = require('../src/index');

let server;
let base;
let evento; // un evento real tomado del listado

const get = (ruta, headers = {}) => fetch(`${base}${ruta}`, { headers });
const send = (metodo, ruta, body) => fetch(`${base}${ruta}`, {
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  const res = await get('/api/catalogo/eventos?limite=50');
  const json = await res.json();
  evento = json.data[0];
});

after(() => new Promise(resolve => server.close(resolve)));

// ---------------------------------------------------------------- Sistema

test('GET /health responde que el servicio está operativo', async () => {
  const res = await get('/health');
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'OK');
  assert.equal(json.service, 'ms-catalogo-eventos');
});

// ------------------------------------------------- HU1 y HU3: listado y filtros

test('HU1: el listado entrega eventos con los campos que usa el front', async () => {
  const res = await get('/api/catalogo/eventos');
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length > 0, 'debe haber al menos un evento');
  for (const e of json.data) {
    assert.ok(e.id_evento, 'cada evento tiene id_evento');
    assert.ok(e.nombre_evento, 'cada evento tiene nombre_evento');
    assert.equal(typeof e.es_pasado, 'boolean');
    assert.equal(typeof e.precio_final_evento, 'number');
    assert.equal(typeof e.stock_actual, 'number');
  }
});

test('HU3: la paginación respeta el límite y entrega sus metadatos', async () => {
  const res = await get('/api/catalogo/eventos?limite=2&pagina=1');
  const json = await res.json();
  assert.ok(json.count <= 2, `count (${json.count}) no debe superar el límite`);
  assert.equal(json.data.length, json.count);
  assert.equal(json.pagination.limite, 2);
  assert.equal(json.pagination.pagina, 1);
  assert.ok(json.pagination.total_paginas >= 1);
});

test('HU3: la segunda página también respeta el límite y no excede el total', async () => {
  const p1 = await (await get('/api/catalogo/eventos?limite=2&pagina=1')).json();
  const p2 = await (await get('/api/catalogo/eventos?limite=2&pagina=2')).json();
  assert.equal(p2.pagination.pagina, 2);
  assert.ok(p2.count <= 2, `count (${p2.count}) no debe superar el límite`);
  assert.ok(p1.count + p2.count <= p1.pagination.total,
    'las dos primeras páginas no pueden sumar más eventos que el total');
});

test('HU3: el filtro de próximos no incluye eventos pasados', async () => {
  const json = await (await get('/api/catalogo/eventos?temporalidad=proximos&limite=50')).json();
  assert.equal(json.success, true);
  for (const e of json.data) assert.equal(e.es_pasado, false, `${e.id_evento} es pasado`);
});

test('HU3: el filtro de pasados solo incluye eventos pasados', async () => {
  const json = await (await get('/api/catalogo/eventos?temporalidad=pasados&limite=50')).json();
  assert.equal(json.success, true);
  for (const e of json.data) assert.equal(e.es_pasado, true, `${e.id_evento} no es pasado`);
});

test('HU3: el filtro de gratuitos solo incluye eventos gratuitos', async () => {
  const json = await (await get('/api/catalogo/eventos?isFree=true&limite=50')).json();
  assert.equal(json.success, true);
  for (const e of json.data) assert.equal(e.tipo_evento, 'gratuito');
});

test('HU3: un valor inválido de isFree responde 400', async () => {
  const res = await get('/api/catalogo/eventos?isFree=quizas');
  assert.equal(res.status, 400);
});

test('HU3: una fecha inválida en fecha_desde responde 400 y no 500', async () => {
  const res = await get('/api/catalogo/eventos?fecha_desde=no-es-fecha');
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
});

// ------------------------------------------------------------ HU2: búsqueda

test('HU2: la búsqueda por nombre encuentra el evento buscado', async () => {
  const palabra = evento.nombre_evento.split(' ')[0];
  const json = await (await get(`/api/catalogo/eventos?search=${encodeURIComponent(palabra)}&limite=50`)).json();
  assert.equal(json.success, true);
  assert.ok(json.data.some(e => e.id_evento === evento.id_evento),
    `la búsqueda de "${palabra}" debe incluir a ${evento.id_evento}`);
});

// ------------------------------------------------------------- HU4: detalle

test('HU4: el detalle de un evento existente responde 200 con su información', async () => {
  const res = await get(`/api/catalogo/eventos/${evento.id_evento}`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.id_evento, evento.id_evento);
  assert.equal(json.data.nombre_evento, evento.nombre_evento);
  assert.equal(typeof json.data.es_pasado, 'boolean');
});

test('HU4: el detalle de un evento inexistente responde 404', async () => {
  const res = await get('/api/catalogo/eventos/evento-que-no-existe-123');
  assert.equal(res.status, 404);
});

// -------------------------------------------- HU6 y BE2: reseñas con respaldo

test('HU6: si Reseñas no responde, el catálogo entrega igual la información del evento', async () => {
  const res = await get(`/api/catalogo/eventos/${evento.id_evento}/resenas`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(typeof json.data.total_resenas, 'number');
  assert.ok(Array.isArray(json.data.resenas));
});

// ------------------------------------------------- BE3: servicios para otros

test('BE3 (Promociones): GET /:id/precio entrega el precio del evento', async () => {
  const res = await get(`/api/catalogo/eventos/${evento.id_evento}/precio`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.id_evento, evento.id_evento);
  assert.equal(typeof json.precio_base, 'number');
  assert.equal(json.precio_base, evento.precio_final_evento);
  assert.ok(['gratuito', 'pagado'].includes(json.tipo_evento));
});

test('BE3 (Promociones): el precio de un evento inexistente responde 404', async () => {
  const res = await get('/api/catalogo/eventos/evento-que-no-existe-123/precio');
  assert.equal(res.status, 404);
});

test('BE3 (Reseñas): GET /:id/info-servicio entrega identificador y nombre del evento', async () => {
  const res = await get(`/api/catalogo/eventos/${evento.id_evento}/info-servicio`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.id_evento, evento.id_evento);
  assert.ok(json.data.nombre_evento);
});

test('BE3 (Reseñas): info-servicio de un evento inexistente responde 404', async () => {
  const res = await get('/api/catalogo/eventos/evento-que-no-existe-123/info-servicio');
  assert.equal(res.status, 404);
});

// ------------------------------------------- HU5 e I2: stock desde Entradas

test('HU5: actualizar stock sin token de sesión responde 401', async () => {
  const res = await send('PUT', `/api/catalogo/eventos/${evento.id_evento}/stock`, { nuevo_stock: 5 });
  assert.equal(res.status, 401);
});

test('HU5: un stock negativo responde 400', async () => {
  const res = await send('PUT', `/api/catalogo/eventos/${evento.id_evento}/stock`, { nuevo_stock: -1, token_sesion: 'prueba' });
  assert.equal(res.status, 400);
});

test('HU5: un stock no entero responde 400', async () => {
  const res = await send('PUT', `/api/catalogo/eventos/${evento.id_evento}/stock`, { nuevo_stock: 2.5, token_sesion: 'prueba' });
  assert.equal(res.status, 400);
});

test('HU5: actualizar el stock de un evento inexistente no responde 200', async () => {
  const res = await send('PUT', '/api/catalogo/eventos/evento-que-no-existe-123/stock', { nuevo_stock: 5, token_sesion: 'prueba' });
  // 404 si la base responde; 503 si la base no está disponible para validar
  assert.ok([404, 503].includes(res.status), `respondió ${res.status}`);
});

test('HU5: actualizar con un stock válido responde 200 y conserva el estado coherente', async () => {
  // Se reenvía el mismo stock actual para no alterar los datos reales
  const actual = (await (await get(`/api/catalogo/eventos/${evento.id_evento}`)).json()).data.stock_actual;
  const res = await send('PUT', `/api/catalogo/eventos/${evento.id_evento}/stock`, { nuevo_stock: actual, token_sesion: 'prueba' });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.stock_actual, actual);
  if (actual === 0) assert.equal(json.data.estado_evento, 'agotado');
});

// --------------------------------------------- Registro de eventos (Panel)

test('Panel: registrar un evento sin nombre responde 400', async () => {
  const res = await send('POST', '/api/catalogo/eventos', { lugar_evento: 'Aula Magna' });
  assert.equal(res.status, 400);
});

test('Panel: registrar un evento con fecha inválida responde 400', async () => {
  const res = await send('POST', '/api/catalogo/eventos', { nombre_evento: 'Prueba', fecha_evento: 'no-es-fecha' });
  assert.equal(res.status, 400);
});

// -------------------------------------------------------------------- CORS

test('CORS: en acceso directo se responde con el origen de la solicitud', async () => {
  const res = await get('/health', { Origin: 'http://localhost:3000' });
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
});

test('CORS: si la solicitud viene del API Gateway, el catálogo no agrega cabeceras propias', async () => {
  const res = await get('/health', { Origin: 'http://localhost:3000', 'X-Forwarded-For': '172.19.0.1' });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});
