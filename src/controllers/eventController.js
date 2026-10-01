const supabase = require('../config/supabase');
const {
  consultarCalificacionesBasicas,
  consultarResenasEvento
} = require('../services/externalServices');

/**
 * GET /api/catalogo/eventos (y /api/v1/events)
 * Lista eventos con filtros avanzados usando la nomenclatura oficial de Anaís (PostgreSQL)
 * y entrega respuesta dual para compatibilidad inmediata con el Frontend de Amalia.
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

    // 1. Búsqueda por palabra clave en nombre, descripción y lugar (Nueva columna Anaís)
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

    // 8. Integración BE2 y respuesta dual (Oficial Anaís + Alias para Amalia)
    const now = new Date();
    const eventIds = (data || []).map(e => e.id_evento);

    let calificacionesExternas = {};
    if (eventIds.length > 0) {
      calificacionesExternas = await consultarCalificacionesBasicas(eventIds);
    }

    const formattedEvents = (data || []).map(evento => {
      const fechaEvento = new Date(evento.fecha_evento);
      const califExt = calificacionesExternas[evento.id_evento];

      const promCalif = califExt?.promedio !== undefined && califExt.promedio !== null
        ? califExt.promedio
        : Number(evento.promedio_calificacion || 0);

      const totResenas = califExt?.total_resenas !== undefined
        ? califExt.total_resenas
        : Number(evento.total_resenas || 0);

      const esPasado = fechaEvento < now;

      return {
        // --- Nomenclatura Oficial BD (Anaís / Rúbrica) ---
        id_evento: evento.id_evento,
        nombre_evento: evento.nombre_evento,
        descripcion_evento: evento.descripcion_evento,
        lugar_evento: evento.lugar_evento,
        fecha_evento: evento.fecha_evento,
        hora_evento: evento.hora_evento,
        imagen_evento: evento.imagen_evento,
        precio_final_evento: Number(evento.precio_final_evento),
        tipo_evento: evento.tipo_evento,
        categoria_evento: evento.categoria_evento,
        estado_evento: evento.estado_evento,
        stock_actual: evento.stock_actual,
        promedio_calificacion: promCalif,
        total_resenas: totResenas,
        fecha_creacion: evento.fecha_creacion,
        es_pasado: esPasado,
        resena_estado: califExt?.mensaje || (totResenas === 0 ? 'Sin calificaciones aún' : 'Con opiniones'),

        // --- ALIAS DE COMPATIBILIDAD (Para que el Frontend de Amalia no se caiga mientras migra) ---
        evento_id: evento.id_evento,
        evento_titulo: evento.nombre_evento,
        evento_descripcion: evento.descripcion_evento,
        evento_lugar: evento.lugar_evento,
        evento_fecha: evento.fecha_evento,
        evento_hora: evento.hora_evento,
        evento_imagen: evento.imagen_evento,
        evento_precio_final: Number(evento.precio_final_evento),
        evento_tipo: evento.tipo_evento,
        evento_categoria: evento.categoria_evento,
        evento_estado: evento.estado_evento,
        inventario_stock: evento.stock_actual,
        resena_calificacion_promedio: promCalif
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

    const es_pasado = new Date(data.fecha_evento) < new Date();
    const resenasDetalle = await consultarResenasEvento(id);

    return res.status(200).json({
      success: true,
      data: {
        // Oficial
        id_evento: data.id_evento,
        nombre_evento: data.nombre_evento,
        descripcion_evento: data.descripcion_evento,
        lugar_evento: data.lugar_evento,
        fecha_evento: data.fecha_evento,
        hora_evento: data.hora_evento,
        imagen_evento: data.imagen_evento,
        precio_final_evento: Number(data.precio_final_evento),
        tipo_evento: data.tipo_evento,
        categoria_evento: data.categoria_evento,
        estado_evento: data.estado_evento,
        stock_actual: data.stock_actual,
        promedio_calificacion: Number(data.promedio_calificacion || 0),
        total_resenas: Number(data.total_resenas || 0),
        fecha_creacion: data.fecha_creacion,
        es_pasado,
        resenas_opiniones: resenasDetalle.resenas || [],
        resena_estado: resenasDetalle.estado_resenas || (resenasDetalle.resenas?.length === 0 ? 'Sin calificaciones aún' : 'Disponible'),

        // Alias retrocompatibles
        evento_id: data.id_evento,
        evento_titulo: data.nombre_evento,
        evento_descripcion: data.descripcion_evento,
        evento_lugar: data.lugar_evento,
        evento_fecha: data.fecha_evento,
        evento_hora: data.hora_evento,
        evento_imagen: data.imagen_evento,
        evento_precio_final: Number(data.precio_final_evento),
        evento_tipo: data.tipo_evento,
        evento_categoria: data.categoria_evento,
        evento_estado: data.estado_evento,
        inventario_stock: data.stock_actual,
        resena_calificacion_promedio: Number(data.promedio_calificacion || 0)
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
        // Alias
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
      .select('id_evento, nombre_evento, precio_final_evento, estado_evento, fecha_evento')
      .eq('id_evento', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Evento '${id}' no encontrado para información de servicio.`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id_evento: data.id_evento,
        nombre_evento: data.nombre_evento,
        precio_final_evento: Number(data.precio_final_evento),
        estado_evento: data.estado_evento,
        fecha_evento: data.fecha_evento,
        // Alias
        titulo: data.nombre_evento,
        precio_final: Number(data.precio_final_evento)
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
  updateStock,
  getEventServiceInfo
};
