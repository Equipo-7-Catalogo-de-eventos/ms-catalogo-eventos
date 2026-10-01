const supabase = require('../config/supabase');
const {
  consultarCalificacionesBasicas,
  consultarResenasEvento
} = require('../services/externalServices');

/**
 * GET /api/catalogo/eventos (y /api/v1/events)
 * Lista eventos con filtros avanzados usando la nomenclatura oficial de Anaís (PostgreSQL)
 * y entrega respuesta dual preservando siempre las estrellas y calificaciones.
 */
const getEvents = async (req, res) => {
  try {
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

    const { data, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al consultar eventos en la base de datos',
        error: error.message
      });
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

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_evento', id)
      .single();

    // Manejo de errores (404 vs 500)
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        return res.status(404).json({
          success: false,
          message: `Evento con ID '${id}' no encontrado`
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error al consultar la base de datos',
        error: error.message
      });
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

    // Consultar el evento en la BD local
    const { data: evento, error: eventError } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_evento', id)
      .single();

    if (eventError || !evento) {
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
    const { data: existingEvent, error: findError } = await supabase
      .from('eventos')
      .select('id_evento, estado_evento, stock_actual')
      .eq('id_evento', id)
      .single();

    if (findError || !existingEvent) {
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

    const { data: updatedEvent, error: updateError } = await supabase
      .from('eventos')
      .update({
        stock_actual: nuevo_stock,
        estado_evento: nuevoEstado
      })
      .eq('id_evento', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Error interno en Catálogo al actualizar el stock.',
        error: updateError.message
      });
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

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_evento', id)
      .single();

    if (error || !data) {
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

module.exports = {
  getEvents,
  getEventById,
  getEventReviews,
  updateStock,
  getEventServiceInfo
};
