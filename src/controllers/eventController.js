const supabase = require('../config/supabase');
const {
  consultarCalificacionesBasicas,
  consultarResenasEvento
} = require('../services/externalServices');

/**
 * GET /api/catalogo/eventos (y /api/v1/events)
 * Lista eventos con filtros avanzados (temporalidad, rango de fechas, categorías múltiples,
 * ordenamiento, paginación y búsqueda multivariable) y agrega el campo calculado es_pasado.
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

    // Validación estricta de isFree (Corrección 5: dar 400 si no es 'true' ni 'false')
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

    // 1. Búsqueda por palabra clave en título, descripción y lugar (Rúbrica punto 3 / HU2)
    const searchTerm = search || criterio;
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      query = query.or(
        `evento_titulo.ilike.%${term}%,evento_descripcion.ilike.%${term}%,evento_lugar.ilike.%${term}%`
      );
    }

    // 2. Filtro por categorías (soporta una o varias categorías separadas por coma)
    const categoriesParam = categorias || categoria || category;
    if (categoriesParam) {
      const catList = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (catList.length === 1) {
        query = query.eq('evento_categoria', catList[0]);
      } else if (catList.length > 1) {
        query = query.in('evento_categoria', catList);
      }
    }

    // 3. Filtro por Gratis o Pagado
    if (isFree !== undefined) {
      const tipo = isFree === 'true' ? 'gratuito' : 'pagado';
      query = query.eq('evento_tipo', tipo);
    }

    // 4. Filtro por temporalidad (próximos / pasados según evento_fecha TIMESTAMP)
    const nowIso = new Date().toISOString();
    if (temporalidad === 'proximos') {
      query = query.gte('evento_fecha', nowIso);
    } else if (temporalidad === 'pasados') {
      query = query.lt('evento_fecha', nowIso);
    }

    // 5. Filtro por rango de fechas específico
    if (fecha_desde) {
      query = query.gte('evento_fecha', new Date(fecha_desde).toISOString());
    }
    if (fecha_hasta) {
      query = query.lte('evento_fecha', new Date(fecha_hasta).toISOString());
    }

    // 6. Ordenamiento dinámico
    switch (orden) {
      case 'fecha_desc':
        query = query.order('evento_fecha', { ascending: false });
        break;
      case 'valoracion':
        query = query.order('resena_calificacion_promedio', { ascending: false, nullsFirst: false });
        break;
      case 'precio_asc':
        query = query.order('evento_precio_final', { ascending: true });
        break;
      case 'precio_desc':
        query = query.order('evento_precio_final', { ascending: false });
        break;
      case 'fecha_asc':
      default:
        // Si se pide pasados explícitamente y no se indicó orden, mostrar los más recientes primero
        if (temporalidad === 'pasados') {
          query = query.order('evento_fecha', { ascending: false });
        } else {
          query = query.order('evento_fecha', { ascending: true });
        }
        break;
    }

    // 7. Aplicar paginación
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al consultar eventos',
        error: error.message
      });
    }

    // 8. Agregar campo calculado 'es_pasado' a cada evento (Rúbrica punto 2)
    const now = new Date();
    const eventIds = (data || []).map(e => e.evento_id);

    // Integración BE2: Consultar calificaciones frescas de Reseñas con fallback seguro
    let calificacionesExternas = {};
    if (eventIds.length > 0) {
      calificacionesExternas = await consultarCalificacionesBasicas(eventIds);
    }

    const formattedEvents = (data || []).map(evento => {
      const fechaEvento = new Date(evento.evento_fecha);
      const califExt = calificacionesExternas[evento.evento_id];

      return {
        ...evento,
        es_pasado: fechaEvento < now,
        // Si Reseñas entrega un promedio más reciente, se combina con Graceful Degradation
        resena_calificacion_promedio: califExt?.disponible === true
          ? califExt.promedio
          : Number(evento.resena_calificacion_promedio || 0),
        resena_total: califExt?.disponible === true
          ? califExt.total_resenas
          : Number(evento.resena_total || 0),
        resena_estado: califExt?.mensaje || (Number(evento.resena_total) === 0 ? 'Sin calificaciones aún' : 'Con opiniones')
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
 * Obtiene el detalle completo de un evento con campo 'es_pasado',
 * diferenciando 404 (no encontrado) de 500 (error de BD),
 * e integrando reseñas completas desde el módulo de Reseñas (BE2).
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('evento_id', id)
      .single();

    // Diferenciación de errores (Corrección 4: 404 vs 500)
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

    // Campo calculado 'es_pasado'
    const es_pasado = new Date(data.evento_fecha) < new Date();

    // Integración BE2: Consulta a microservicio de Reseñas con Graceful Degradation
    const resenasDetalle = await consultarResenasEvento(id);

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        resena_calificacion_promedio: resenasDetalle.disponible === true 
          ? resenasDetalle.promedio 
          : Number(data.resena_calificacion_promedio || 0),
        resena_total: resenasDetalle.disponible === true 
          ? resenasDetalle.total_resenas 
          : Number(data.resena_total || 0),
        es_pasado,
        resenas_opiniones: resenasDetalle.resenas || [],
        resena_estado: resenasDetalle.estado_resenas || (resenasDetalle.resenas?.length === 0 ? 'Sin calificaciones aún' : 'Disponible')
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
 * PUT /api/catalogo/eventos/:id/stock (Alineado al contrato con Entradas / Inventario)
 * Recibe nuevo_stock y token_sesion.
 * Si nuevo_stock === 0, actualiza automáticamente evento_estado = 'agotado'.
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_stock, token_sesion } = req.body;

    // Validación de token de sesión exigido por contrato para trazabilidad
    if (!token_sesion || typeof token_sesion !== 'string' || token_sesion.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token de sesión no válido o ausente.'
      });
    }

    // Validación de nuevo_stock según contrato (entero >= 0)
    if (nuevo_stock === undefined || typeof nuevo_stock !== 'number' || nuevo_stock < 0 || !Number.isInteger(nuevo_stock)) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. El campo nuevo_stock es obligatorio y debe ser un número entero mayor o igual a 0.'
      });
    }

    // Verificar si el evento existe en Catálogo
    const { data: existingEvent, error: findError } = await supabase
      .from('eventos')
      .select('evento_id, evento_estado, inventario_stock')
      .eq('evento_id', id)
      .single();

    if (findError || !existingEvent) {
      return res.status(404).json({
        success: false,
        message: `Evento con ID '${id}' no existe en la base de datos de Catálogo.`
      });
    }

    // Regla de negocio: Si el stock llega a 0, marcar agotado automáticamente.
    // Si tenía stock 0 y ahora se añade stock (> 0), reactivar como disponible.
    let nuevoEstado = existingEvent.evento_estado;
    if (nuevo_stock === 0) {
      nuevoEstado = 'agotado';
    } else if (existingEvent.evento_estado === 'agotado' && nuevo_stock > 0) {
      nuevoEstado = 'disponible';
    }

    // Actualizar en base de datos
    const { data: updatedEvent, error: updateError } = await supabase
      .from('eventos')
      .update({
        inventario_stock: nuevo_stock,
        evento_estado: nuevoEstado
      })
      .eq('evento_id', id)
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
        evento_id: updatedEvent.evento_id,
        inventario_stock: updatedEvent.inventario_stock,
        evento_estado: updatedEvent.evento_estado
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
 * Endpoint de consulta ligera para que otros microservicios obtengan
 * datos esenciales: id y nombre para Reseñas, precio para Promociones.
 */
const getEventServiceInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('eventos')
      .select('evento_id, evento_titulo, evento_precio_final, evento_estado, evento_fecha')
      .eq('evento_id', id)
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
        id_evento: data.evento_id,
        titulo: data.evento_titulo,
        precio_final: Number(data.evento_precio_final),
        estado: data.evento_estado,
        fecha: data.evento_fecha
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
