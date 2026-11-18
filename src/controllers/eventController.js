const supabase = require('../config/supabase');
const eventStore = require('../data/eventStore');
const {
  consultarCalificacionesBasicas,
  consultarResenasEvento,
  consultarEventosProximosOrganizador
} = require('../services/externalServices');

// Mapeo oficial de campos de Panel Organizador a Catálogo (CONTRATO_PANEL_CATALOGO.md)
function mapearEventoPanel(evPanel) {
  const id = evPanel.id_evento || evPanel.evento_id;
  const nombre = evPanel.nombre_evento || evPanel.titulo || evPanel.evento_titulo;
  const desc = evPanel.descripcion || evPanel.descripcion_evento || '';
  const lugar = evPanel.direccion_evento || evPanel.lugar_evento || evPanel.lugar || 'Por definir';
  const fecha = evPanel.fecha_evento || evPanel.fecha || new Date().toISOString();
  const hora = evPanel.hora_evento || evPanel.hora || '20:00';
  const img = evPanel.imagen || evPanel.imagen_evento || 'https://picsum.photos/seed/' + id + '/800/400';
  const precio = Number(evPanel.precio ?? evPanel.precio_final_evento ?? 0);
  
  let tipo = 'pagado';
  const rawTipo = String(evPanel.tipo_entrada || evPanel.tipo_evento || '').toUpperCase();
  if (rawTipo.includes('GRAT') || precio === 0) {
    tipo = 'gratuito';
  }

  let estado = 'disponible';
  const rawEstado = String(evPanel.estado_disponibilidad || evPanel.estado_gestion || evPanel.estado_evento || '').toUpperCase();
  if (rawEstado.includes('AGOT')) estado = 'agotado';
  else if (rawEstado.includes('PAS')) estado = 'pasado';
  else if (rawEstado.includes('CANC')) estado = 'cancelado';

  return {
    id_evento: id,
    nombre_evento: nombre,
    descripcion_evento: desc,
    lugar_evento: lugar,
    fecha_evento: new Date(fecha).toISOString(),
    hora_evento: hora,
    imagen_evento: img,
    categoria_evento: evPanel.categoria || evPanel.categoria_evento || 'general',
    precio_final_evento: precio,
    tipo_evento: tipo,
    estado_evento: estado,
    stock_actual: Number(evPanel.stock_actual ?? 100),
    promedio_calificacion: Number(evPanel.promedio_calificacion ?? 0),
    total_resenas: Number(evPanel.total_resenas ?? 0)
  };
}

// Sincronización proactiva con Panel Organizador al recibir consultas si la BD tiene pocos eventos
let sincronizacionEjecutada = false;
async function sincronizarConPanelSiEsNecesario() {
  if (sincronizacionEjecutada) return;
  sincronizacionEjecutada = true;
  try {
    const eventosPanel = await consultarEventosProximosOrganizador(10);
    if (Array.isArray(eventosPanel) && eventosPanel.length > 0) {
      for (const ev of eventosPanel) {
        const mapeado = mapearEventoPanel(ev);
        if (mapeado.id_evento) {
          eventStore.events.unshift(mapeado);
          try {
            await supabase.from('eventos').upsert(mapeado, { onConflict: 'id_evento' });
          } catch (e) {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout de base de datos (${ms}ms)`)), ms))
  ]);
};

/**
 * GET /api/catalogo/eventos (y /api/v1/events)
 * Lista eventos con filtros avanzados usando la nomenclatura oficial de Anaís (PostgreSQL)
 * y entrega respuesta dual preservando siempre las estrellas y calificaciones.
 */
const getEvents = async (req, res) => {
  try {
    // Sincronizar proactivamente eventos de Panel si están disponibles
    await sincronizarConPanelSiEsNecesario();

    const {
      search,
      criterio,
      category,
      categoria,
      categorias,
      isFree,
      temporalidad,
      fecha_desde,
      fecha_hasta,
      orden,
      pagina,
      limite
    } = req.query;

    // Validación estricta de isFree (da 400 si no es 'true' ni 'false')
    if (isFree !== undefined && isFree !== 'true' && isFree !== 'false') {
      return res.status(400).json({
        success: false,
        message: "Parámetro 'isFree' inválido. Debe ser 'true' o 'false'."
      });
    }

    // Configuración de paginación
    const page = Math.max(1, parseInt(pagina, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limite, 10) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('eventos').select('*', { count: 'exact' });

    // 1. Búsqueda por palabra clave en nombre, descripción y lugar
    const searchTerm = search || criterio;
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      query = query.or(
        `nombre_evento.ilike.%${term}%,descripcion_evento.ilike.%${term}%,lugar_evento.ilike.%${term}%`
      );
    }

    // 2. Filtro por categorías (columna categoria_evento)
    const categoriesParam = categorias || categoria || category;
    if (categoriesParam) {
      const catList = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (catList.length === 1) {
        query = query.eq('categoria_evento', catList[0]);
      } else if (catList.length > 1) {
        query = query.in('categoria_evento', catList);
      }
    }

    // 3. Filtro por Gratis o Pagado (columna tipo_evento)
    if (isFree !== undefined) {
      const tipo = isFree === 'true' ? 'gratuito' : 'pagado';
      query = query.eq('tipo_evento', tipo);
    }

    // 4. Filtro por temporalidad (columna fecha_evento TIMESTAMP WITH TIME ZONE)
    const nowIso = new Date().toISOString();
    if (temporalidad === 'proximos') {
      query = query.gte('fecha_evento', nowIso);
    } else if (temporalidad === 'pasados') {
      query = query.lt('fecha_evento', nowIso);
    }

    // 5. Filtro por rango de fechas específico
    if (fecha_desde) {
      query = query.gte('fecha_evento', new Date(fecha_desde).toISOString());
    }
    if (fecha_hasta) {
      query = query.lte('fecha_evento', new Date(fecha_hasta).toISOString());
    }

    // 6. Ordenamiento dinámico
    switch (orden) {
      case 'fecha_desc':
        query = query.order('fecha_evento', { ascending: false });
        break;
      case 'valoracion':
        query = query.order('promedio_calificacion', { ascending: false, nullsFirst: false });
        break;
      case 'precio_asc':
        query = query.order('precio_final_evento', { ascending: true });
        break;
      case 'precio_desc':
        query = query.order('precio_final_evento', { ascending: false });
        break;
      case 'fecha_asc':
      default:
        if (temporalidad === 'pasados') {
          query = query.order('fecha_evento', { ascending: false });
        } else {
          query = query.order('fecha_evento', { ascending: true });
        }
        break;
    }

    // 7. Aplicar paginación
    query = query.range(from, to);

    let data;
    let count;

    try {
      const resQuery = await withTimeout(query);
      if (resQuery.error) {
        throw new Error(resQuery.error.message);
      }
      data = resQuery.data || [];
      count = resQuery.count;

      // Fusionar eventos de Panel que estén en memoria si la búsqueda o listado aplica
      const idsExistentes = new Set(data.map(e => e.id_evento));
      const eventosPanelMemoria = eventStore.events.filter(e => !idsExistentes.has(e.id_evento) && !e.id_evento.startsWith('evt-1'));
      if (eventosPanelMemoria.length > 0) {
        // Filtrar según término de búsqueda si existe
        const term = (searchTerm || '').toLowerCase();
        const filtrados = eventosPanelMemoria.filter(e => {
          if (!term) return true;
          return (e.nombre_evento && e.nombre_evento.toLowerCase().includes(term)) ||
                 (e.descripcion_evento && e.descripcion_evento.toLowerCase().includes(term)) ||
                 (e.lugar_evento && e.lugar_evento.toLowerCase().includes(term));
        });
        data = [...filtrados, ...data];
        count = (count || 0) + filtrados.length;
      }
    } catch (dbErr) {
      console.warn(`[ms-catalogo-eventos] Base de datos remota no disponible (${dbErr.message}). Utilizando catálogo local.`);
      const local = eventStore.getAll(req.query);
      data = local.data;
      count = local.count;
    }

    // 8. Integración BE2 y respuesta dual asegurando preservación de calificaciones locales
    const now = new Date();
    const eventIds = (data || []).map(e => e.id_evento || e.evento_id);

    let calificacionesExternas = {};
    if (eventIds.length > 0) {
      calificacionesExternas = await consultarCalificacionesBasicas(eventIds);
    }

    const formattedEvents = (data || []).map(evento => {
      const eventId = evento.id_evento || evento.evento_id;
      const fechaEvento = new Date(evento.fecha_evento || evento.evento_fecha);
      const califExt = calificacionesExternas[eventId];

      // Extraer datos locales de la BD soportando ambas nomenclaturas posibles
      const dbPromedio = evento.promedio_calificacion !== undefined && evento.promedio_calificacion !== null
        ? Number(evento.promedio_calificacion)
        : (evento.resena_calificacion_promedio !== undefined && evento.resena_calificacion_promedio !== null
          ? Number(evento.resena_calificacion_promedio)
          : 0);

      const dbTotal = evento.total_resenas !== undefined && evento.total_resenas !== null
        ? Number(evento.total_resenas)
        : (evento.resena_total !== undefined && evento.resena_total !== null
          ? Number(evento.resena_total)
          : 0);

      // Si Reseñas está disponible (online), usar sus datos frescos; si no, preservar los locales de la BD
      const promCalif = (califExt && califExt.disponible === true && califExt.promedio !== null && califExt.promedio !== undefined)
        ? Number(califExt.promedio)
        : dbPromedio;

      const totResenas = (califExt && califExt.disponible === true && califExt.total_resenas !== null && califExt.total_resenas !== undefined)
        ? Number(califExt.total_resenas)
        : dbTotal;

      const esPasado = fechaEvento < now;

      const id = evento.id_evento || evento.evento_id;
      const nombre = evento.nombre_evento || evento.evento_titulo;
      const desc = evento.descripcion_evento || evento.evento_descripcion;
      const lugar = evento.lugar_evento || evento.evento_lugar;
      const fecha = evento.fecha_evento || evento.evento_fecha;
      const hora = evento.hora_evento || evento.evento_hora;
      const img = evento.imagen_evento || evento.evento_imagen;
      const precio = Number(evento.precio_final_evento ?? evento.evento_precio_final ?? 0);
      const tipo = evento.tipo_evento || evento.evento_tipo;
      const cat = evento.categoria_evento || evento.evento_categoria;
      const est = evento.estado_evento || evento.evento_estado;
      const stock = Number(evento.stock_actual ?? evento.inventario_stock ?? 0);

      return {
        // --- Nomenclatura Oficial BD (Anaís / Rúbrica) ---
        id_evento: id,
        nombre_evento: nombre,
        descripcion_evento: desc,
        lugar_evento: lugar,
        fecha_evento: fecha,
        hora_evento: hora,
        imagen_evento: img,
        precio_final_evento: precio,
        tipo_evento: tipo,
        categoria_evento: cat,
        estado_evento: est,
        stock_actual: stock,
        promedio_calificacion: promCalif,
        total_resenas: totResenas,
        fecha_creacion: evento.fecha_creacion || evento.created_at,
        es_pasado: esPasado,
        resena_estado: totResenas === 0 ? 'Sin calificaciones aún' : 'Con opiniones',

        // --- ALIAS DE COMPATIBILIDAD (Para que el Frontend de Amalia lea las estrellas de inmediato) ---
        evento_id: id,
        evento_titulo: nombre,
        evento_descripcion: desc,
        evento_lugar: lugar,
        evento_fecha: fecha,
        evento_hora: hora,
        evento_imagen: img,
        evento_precio_final: precio,
        evento_tipo: tipo,
        evento_categoria: cat,
        evento_estado: est,
        inventario_stock: stock,
        resena_calificacion_promedio: promCalif,
        resena_total: totResenas
      };
    });

    const totalCount = count !== null ? count : formattedEvents.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.status(200).json({
      success: true,
      count: formattedEvents.length,
      pagination: {
        total: totalCount,
        pagina: page,
        limite: limit,
        total_paginas: totalPages
      },
      data: formattedEvents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error inesperado en el servidor',
      error: error.message
    });
  }
};

/**
 * GET /api/catalogo/eventos/:id (y /api/v1/events/:id)
 * Detalle completo con nueva nomenclatura oficial y alias para el frontend.
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    let data = null;

    try {
      const resQuery = await withTimeout(
        supabase
          .from('eventos')
          .select('*')
          .eq('id_evento', id)
          .single()
      );

      if (resQuery.error) {
        if (resQuery.error.code === 'PGRST116' || (resQuery.error.message && resQuery.error.message.includes('JSON object requested'))) {
          // Si no existe en Supabase, verificar si existe en eventStore
          data = eventStore.getById(id);
        } else {
          throw new Error(resQuery.error.message);
        }
      } else {
        data = resQuery.data;
      }
    } catch (dbErr) {
      console.warn(`[ms-catalogo-eventos] Base de datos remota no disponible (${dbErr.message}). Buscando '${id}' en catálogo local.`);
      data = eventStore.getById(id);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `Evento con ID '${id}' no encontrado`
      });
    }

    const eventId = data.id_evento || data.evento_id;
    const fecha = data.fecha_evento || data.evento_fecha;
    const es_pasado = new Date(fecha) < new Date();

    const dbPromedio = data.promedio_calificacion !== undefined && data.promedio_calificacion !== null
      ? Number(data.promedio_calificacion)
      : Number(data.resena_calificacion_promedio || 0);

    const dbTotal = data.total_resenas !== undefined && data.total_resenas !== null
      ? Number(data.total_resenas)
      : Number(data.resena_total || 0);

    // Integración BE2: Consulta a microservicio de Reseñas con fallback seguro
    const resenasDetalle = await consultarResenasEvento(id);

    const promCalif = (resenasDetalle && resenasDetalle.disponible === true && resenasDetalle.promedio !== null && resenasDetalle.promedio !== undefined)
      ? Number(resenasDetalle.promedio)
      : dbPromedio;

    const totResenas = (resenasDetalle && resenasDetalle.disponible === true && resenasDetalle.total_resenas !== null && resenasDetalle.total_resenas !== undefined)
      ? Number(resenasDetalle.total_resenas)
      : dbTotal;

    const nombre = data.nombre_evento || data.evento_titulo;
    const desc = data.descripcion_evento || data.evento_descripcion;
    const lugar = data.lugar_evento || data.evento_lugar;
    const hora = data.hora_evento || data.evento_hora;
    const img = data.imagen_evento || data.evento_imagen;
    const precio = Number(data.precio_final_evento ?? data.evento_precio_final ?? 0);
    const tipo = data.tipo_evento || data.evento_tipo;
    const cat = data.categoria_evento || data.evento_categoria;
    const est = data.estado_evento || data.evento_estado;
    const stock = Number(data.stock_actual ?? data.inventario_stock ?? 0);

    return res.status(200).json({
      success: true,
      data: {
        // Oficial
        id_evento: eventId,
        nombre_evento: nombre,
        descripcion_evento: desc,
        lugar_evento: lugar,
        fecha_evento: fecha,
        hora_evento: hora,
        imagen_evento: img,
        precio_final_evento: precio,
        tipo_evento: tipo,
        categoria_evento: cat,
        estado_evento: est,
        stock_actual: stock,
        promedio_calificacion: promCalif,
        total_resenas: totResenas,
        fecha_creacion: data.fecha_creacion || data.created_at,
        es_pasado,
        resenas_opiniones: resenasDetalle.resenas || [],
        resena_estado: totResenas === 0 ? 'Sin calificaciones aún' : 'Con opiniones',

        // Alias retrocompatibles
        evento_id: eventId,
        evento_titulo: nombre,
        evento_descripcion: desc,
        evento_lugar: lugar,
        evento_fecha: fecha,
        evento_hora: hora,
        evento_imagen: img,
        evento_precio_final: precio,
        evento_tipo: tipo,
        evento_categoria: cat,
        evento_estado: est,
        inventario_stock: stock,
        resena_calificacion_promedio: promCalif,
        resena_total: totResenas
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error inesperado al obtener detalle del evento',
      error: error.message
    });
  }
};

/**
 * GET /api/catalogo/eventos/:id/resenas (y /api/v1/events/:id/resenas)
 * Endpoint solicitado por Amalia en api.ts para renderizar las estrellas y reseñas del evento.
 */
const getEventReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const limite = Math.max(1, parseInt(req.query.limite, 10) || 3);

    // Consultar el evento en la BD
    let evento = null;
    try {
      const resQuery = await withTimeout(
        supabase
          .from('eventos')
          .select('*')
          .eq('id_evento', id)
          .single()
      );
      if (!resQuery.error && resQuery.data) {
        evento = resQuery.data;
      }
    } catch (e) {
      // ignore
    }

    if (!evento) {
      evento = eventStore.getById(id);
    }

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: `Evento con ID '${id}' no encontrado`
      });
    }

    const dbPromedio = evento?.promedio_calificacion !== undefined && evento?.promedio_calificacion !== null
      ? Number(evento.promedio_calificacion)
      : Number(evento?.resena_calificacion_promedio || 0);

    const dbTotal = evento?.total_resenas !== undefined && evento?.total_resenas !== null
      ? Number(evento.total_resenas)
      : Number(evento?.resena_total || 0);

    // Invocación a Reseñas con fallback seguro
    const resenasExt = await consultarResenasEvento(id);

    const promedio = (resenasExt && resenasExt.disponible === true && resenasExt.promedio !== null)
      ? Number(resenasExt.promedio)
      : dbPromedio;

    const total_resenas = (resenasExt && resenasExt.disponible === true && resenasExt.total_resenas !== null)
      ? Number(resenasExt.total_resenas)
      : dbTotal;

    const resenasList = (resenasExt?.resenas && resenasExt.resenas.length > 0)
      ? resenasExt.resenas.slice(0, limite)
      : [];

    return res.status(200).json({
      success: true,
      data: {
        id_evento: id,
        evento_id: id,
        promedio: promedio > 0 ? promedio : null,
        total_resenas,
        resena_calificacion_promedio: promedio,
        resena_total: total_resenas,
        resenas: resenasList,
        mensaje: total_resenas === 0 ? 'Sin calificaciones aún' : 'Con opiniones'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar reseñas del evento',
      error: error.message
    });
  }
};

/**
 * PUT /api/catalogo/eventos/:id/stock (Contrato Entradas ↔ Catálogo)
 * Actualiza stock_actual y estado_evento en Supabase.
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_stock, token_sesion } = req.body;

    if (!token_sesion || typeof token_sesion !== 'string' || token_sesion.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token de sesión no válido o ausente.'
      });
    }

    if (nuevo_stock === undefined || typeof nuevo_stock !== 'number' || nuevo_stock < 0 || !Number.isInteger(nuevo_stock)) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. El campo nuevo_stock es obligatorio y debe ser un número entero mayor o igual a 0.'
      });
    }

    // Verificar si el evento existe en Catálogo
    let existingEvent = null;
    try {
      const resFind = await withTimeout(
        supabase
          .from('eventos')
          .select('id_evento, estado_evento, stock_actual')
          .eq('id_evento', id)
          .single()
      );
      if (!resFind.error && resFind.data) {
        existingEvent = resFind.data;
      }
    } catch (e) {
      // ignore
    }

    if (!existingEvent) {
      existingEvent = eventStore.getById(id);
    }

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: `Evento con ID '${id}' no existe en la base de datos de Catálogo.`
      });
    }

    let nuevoEstado = existingEvent.estado_evento;
    if (nuevo_stock === 0) {
      nuevoEstado = 'agotado';
    } else if (existingEvent.estado_evento === 'agotado' && nuevo_stock > 0) {
      nuevoEstado = 'disponible';
    }

    let updatedEvent = null;
    try {
      const resUpdate = await withTimeout(
        supabase
          .from('eventos')
          .update({
            stock_actual: nuevo_stock,
            estado_evento: nuevoEstado
          })
          .eq('id_evento', id)
          .select()
          .single()
      );
      if (!resUpdate.error && resUpdate.data) {
        updatedEvent = resUpdate.data;
      }
    } catch (e) {
      // ignore
    }

    // Actualizar también en el store local para mantener consistencia
    const localUpdated = eventStore.updateStock(id, nuevo_stock);
    if (!updatedEvent) {
      updatedEvent = localUpdated;
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Stock de Catálogo actualizado correctamente',
      data: {
        id_evento: updatedEvent.id_evento,
        stock_actual: updatedEvent.stock_actual,
        estado_evento: updatedEvent.estado_evento,
        evento_id: updatedEvent.id_evento,
        inventario_stock: updatedEvent.stock_actual,
        evento_estado: updatedEvent.estado_evento
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno en Catálogo al actualizar.',
      error: error.message
    });
  }
};

/**
 * GET /api/catalogo/eventos/:id/info-servicio (BE3)
 */
const getEventServiceInfo = async (req, res) => {
  try {
    const { id } = req.params;

    let data = null;
    try {
      const resQuery = await withTimeout(
        supabase
          .from('eventos')
          .select('*')
          .eq('id_evento', id)
          .single()
      );
      if (!resQuery.error && resQuery.data) {
        data = resQuery.data;
      }
    } catch (e) {
      // ignore
    }

    if (!data) {
      data = eventStore.getById(id);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `Evento '${id}' no encontrado para información de servicio.`
      });
    }

    const eventId = data.id_evento || data.evento_id;
    const nombre = data.nombre_evento || data.evento_titulo;
    const precio = Number(data.precio_final_evento ?? data.evento_precio_final ?? 0);
    const estado = data.estado_evento || data.evento_estado;
    const fecha = data.fecha_evento || data.evento_fecha;

    return res.status(200).json({
      success: true,
      data: {
        id_evento: eventId,
        nombre_evento: nombre,
        precio_final_evento: precio,
        estado_evento: estado,
        fecha_evento: fecha,
        // Alias
        titulo: nombre,
        precio_final: precio
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar información de servicio.',
      error: error.message
    });
  }
};

/**
 * POST /api/catalogo/eventos
 * Crea o sincroniza un evento nuevo enviado desde Panel Organizador (Integración I2 / BD1).
 * Soporta persistencia real en Supabase con fallback local.
 */
const createEvent = async (req, res) => {
  try {
    const {
      id_evento,
      evento_id,
      nombre_evento,
      titulo,
      evento_titulo,
      descripcion_evento,
      descripcion,
      evento_descripcion,
      lugar_evento,
      lugar,
      evento_lugar,
      fecha_evento,
      fecha,
      evento_fecha,
      hora_evento,
      hora,
      evento_hora,
      imagen_evento,
      imagen,
      evento_imagen,
      precio_final_evento,
      precio_final,
      evento_precio_final,
      tipo_evento,
      evento_tipo,
      categoria_evento,
      categoria,
      evento_categoria,
      estado_evento,
      estado,
      evento_estado,
      stock_actual,
      stock,
      inventario_stock
    } = req.body;

    const id = id_evento || evento_id || ('evt-' + Date.now().toString().slice(-4));
    const title = nombre_evento || titulo || evento_titulo;
    const desc = descripcion_evento || descripcion || evento_descripcion || '';
    const place = lugar_evento || lugar || evento_lugar || 'Por definir';
    const dateVal = fecha_evento || fecha || evento_fecha || new Date().toISOString();
    const timeVal = hora_evento || hora || evento_hora || '20:00';
    const imgVal = imagen_evento || imagen || evento_imagen || 'https://picsum.photos/seed/' + id + '/800/400';
    const priceVal = Number(precio_final_evento ?? precio_final ?? evento_precio_final ?? 0);
    const typeVal = tipo_evento || evento_tipo || (priceVal === 0 ? 'gratuito' : 'pagado');
    const catVal = categoria_evento || categoria || evento_categoria || 'general';
    const statusVal = estado_evento || estado || evento_estado || 'disponible';
    const stockVal = Number(stock_actual ?? stock ?? inventario_stock ?? 100);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'El nombre o título del evento es obligatorio.'
      });
    }

    const newEvent = {
      id_evento: id,
      nombre_evento: title,
      descripcion_evento: desc,
      lugar_evento: place,
      fecha_evento: new Date(dateVal).toISOString(),
      hora_evento: timeVal,
      imagen_evento: imgVal,
      precio_final_evento: priceVal,
      tipo_evento: typeVal,
      categoria_evento: catVal,
      estado_evento: statusVal,
      stock_actual: stockVal,
      promedio_calificacion: 0,
      total_resenas: 0
    };

    let persistedEvent = null;
    try {
      const resInsert = await withTimeout(
        supabase
          .from('eventos')
          .upsert(newEvent, { onConflict: 'id_evento' })
          .select()
          .single()
      );
      if (!resInsert.error && resInsert.data) {
        persistedEvent = resInsert.data;
      }
    } catch (dbErr) {
      console.warn('[ms-catalogo-eventos] No se pudo persistir evento en Supabase (' + dbErr.message + '). Guardando en memoria local.');
    }

    // Guardar en store local para consistencia inmediata
    eventStore.events.unshift(newEvent);

    return res.status(201).json({
      success: true,
      mensaje: 'Evento registrado exitosamente en Catálogo',
      data: persistedEvent || newEvent
    });
  } catch (error) {
/**
 * PATCH /api/catalogo/eventos/:id/estado
 * Permite a Panel Organizador cambiar el estado de un evento (cancelar o finalizar/cerrar)
 */
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_evento, estado } = req.body;
    const nuevoEstado = (estado_evento || estado || 'cancelado').toLowerCase();

    let updatedEvent = null;
    try {
      const resUpdate = await withTimeout(
        supabase
          .from('eventos')
          .update({ estado_evento: nuevoEstado })
          .eq('id_evento', id)
          .select()
          .single()
      );
      if (!resUpdate.error && resUpdate.data) {
        updatedEvent = resUpdate.data;
      }
    } catch (e) {
      // ignore
    }

    // Actualizar en store local
    const local = eventStore.getById(id);
    if (local) {
      local.estado_evento = nuevoEstado;
      local.evento_estado = nuevoEstado;
      if (!updatedEvent) updatedEvent = local;
    }

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: `Evento con ID '${id}' no encontrado.`
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: `Estado del evento actualizado a '${nuevoEstado}'.`,
      data: updatedEvent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del evento en Catálogo.',
      error: error.message
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getEventReviews,
  updateStock,
  getEventServiceInfo,
  createEvent,
  updateEventStatus
};
