/**
 * Servicio de comunicación HTTP con microservicios externos (BE2).
 * Implementa SLAs, timeouts y resiliencia (Graceful Degradation / Fallback).
 */

const RESENAS_SERVICE_URL = process.env.RESENAS_URL || 'http://localhost:4002';
const PANEL_ORGANIZADOR_URL = process.env.PANEL_ORGANIZADOR_URL || 'http://localhost:4001';
const REQUEST_TIMEOUT_MS = 500; // SLA acordado en contratos < 500ms

/**
 * Consulta calificaciones básicas en bloque a Reseñas.
 * Si Reseñas no responde o falla, aplica Graceful Degradation.
 * @param {string[]} eventIds Lista de IDs de eventos
 * @returns {Promise<Object>} Mapa con id_evento y sus notas/promedios
 */
async function consultarCalificacionesBasicas(eventIds) {
  if (!eventIds || eventIds.length === 0) return {};

  try {
    const response = await fetch(`${RESENAS_SERVICE_URL}/api/v1/resenas/calificaciones-basicas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_id_eventos: eventIds }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (response.ok) {
      const data = await response.json();
      return data.calificaciones || {};
    }
  } catch (error) {
    console.warn(`[BE2] Reseñas no disponible para calificaciones básicas (${error.message}). Aplicando fallback.`);
  }

  // Fallback: Retorna estructura por defecto sin calificaciones
  const fallback = {};
  for (const id of eventIds) {
    fallback[id] = { promedio: null, total_resenas: 0, mensaje: 'Sin calificaciones aún' };
  }
  return fallback;
}

/**
 * Consulta las opiniones detalladas de un evento a Reseñas.
 * Si Reseñas falla, entrega fallback seguro sin interrumpir la vista de detalle.
 * @param {string} idEvento
 * @returns {Promise<Object>}
 */
async function consultarResenasEvento(idEvento) {
  try {
    const response = await fetch(`${RESENAS_SERVICE_URL}/api/v1/resenas/evento/${idEvento}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`[BE2] Reseñas no disponible para evento ${idEvento} (${error.message}). Mostrando fallback.`);
  }

  // Fallback seguro requerido por contrato
  return {
    id_evento: idEvento,
    promedio: null,
    total_resenas: 0,
    resenas: [],
    estado_resenas: 'Sin calificaciones aún'
  };
}

/**
 * Consulta eventos próximos a Panel Organizador.
 * @param {number} limite
 * @returns {Promise<Array|null>}
 */
async function consultarEventosProximosOrganizador(limite = 6) {
  try {
    const response = await fetch(`${PANEL_ORGANIZADOR_URL}/api/v1/organizador/eventos/proximos?limite=${limite}`, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (response.ok) {
      const data = await response.json();
      return data.eventos || null;
    }
  } catch (error) {
    console.warn(`[BE2] Panel Organizador no disponible para eventos próximos (${error.message}).`);
  }
  return null;
}

module.exports = {
  consultarCalificacionesBasicas,
  consultarResenasEvento,
  consultarEventosProximosOrganizador
};
