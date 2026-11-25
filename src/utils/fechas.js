/**
 * Utilidades de fecha para eventos.
 *
 * Panel Organizador envía fecha_evento como medianoche UTC del día calendario
 * (ej. "2026-11-25T00:00:00+00:00") y la hora por separado en hora_evento ("14:30").
 * Comparar solo fecha_evento contra la hora actual marcaba como "pasados" los eventos
 * del día siguiente desde las 21:00 de Chile (UTC-3). Aquí se combinan fecha + hora
 * en la zona horaria de la universidad.
 */

const ZONA_HORARIA = process.env.ZONA_HORARIA_EVENTOS || 'America/Santiago';

/** Devuelve 'YYYY-MM-DD' del día calendario guardado en fecha_evento. */
function diaCalendario(fecha) {
    if (!fecha) return null;
    const texto = String(fecha);
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Diferencia (ms) entre la hora local de la zona y UTC para un instante dado. */
function offsetZona(instante) {
    const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: ZONA_HORARIA,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(instante).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    const comoUTC = Date.UTC(
        Number(partes.year), Number(partes.month) - 1, Number(partes.day),
        Number(partes.hour), Number(partes.minute), Number(partes.second)
    );
    return comoUTC - instante.getTime();
}

/** Instante real (Date) en que ocurre el evento: día de fecha_evento + hora_evento en hora de Chile. */
function instanteEvento(fecha, hora) {
    const dia = diaCalendario(fecha);
    if (!dia) return null;
    const [y, m, d] = dia.split('-').map(Number);
    const match = /^(\d{1,2}):(\d{2})/.exec(String(hora || ''));
    // Sin hora conocida, el evento se considera vigente hasta el final del día
    const hh = match ? Number(match[1]) : 23;
    const mm = match ? Number(match[2]) : 59;
    const supuesto = new Date(Date.UTC(y, m - 1, d, hh, mm));
    return new Date(supuesto.getTime() - offsetZona(supuesto));
}

/** true si el evento ya comenzó (fecha + hora en hora de Chile). */
function esEventoPasado(fecha, hora, ahora = new Date()) {
    const instante = instanteEvento(fecha, hora);
    if (!instante) return false;
    return instante.getTime() < ahora.getTime();
}

/** 'YYYY-MM-DD' de hoy en hora de Chile. */
function hoyEnZona(ahora = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(ahora);
}

module.exports = { esEventoPasado, instanteEvento, hoyEnZona, diaCalendario, ZONA_HORARIA };
