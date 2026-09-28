const supabase = require('../config/supabase');

// GET /api/v1/events
const getEvents = async (req, res) => {
  try {
    const { search, category, isFree } = req.query;

    // Apuntamos a la tabla 'eventos' de Anais
    let query = supabase.from('eventos').select('*');

    // Filtro por búsqueda de texto
    if (search) {
      query = query.ilike('evento_titulo', `%${search}%`);
    }

    // Filtro por categoría
    if (category) {
      query = query.eq('evento_categoria', category);
    }

    // Filtro por Gratis o Pagado usando 'evento_tipo' de Anais
    if (isFree !== undefined) {
      const tipo = isFree === 'true' ? 'gratuito' : 'pagado';
      query = query.eq('evento_tipo', tipo);
    }

    // Nota: El filtro de eventos pasados/futuros está desactivado temporalmente
    // hasta que Anais cambie 'evento_hora' a un formato TIMESTAMP válido.

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/events/:id
const getEventById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('evento_id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Evento no encontrado" });
    }

    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/events
const createEvent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .insert([req.body]) // Amalia/Panel deberán enviar el JSON coincidiendo con las columnas de Anais
      .select();

    if (error) throw error;

    return res.status(201).json({ success: true, data: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/events/:id/stock (Actualización desde Entradas)
const updateStock = async (req, res) => {
  try {
    const { inventario_stock, evento_estado } = req.body;
    
    const { data, error } = await supabase
      .from('eventos')
      .update({ inventario_stock, evento_estado })
      .eq('evento_id', req.params.id)
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Funciones dummy temporales para editar y cancelar para no romper las rutas
const updateEvent = async (req, res) => res.status(200).json({ message: "Pendiente implementar con BD real" });
const cancelEvent = async (req, res) => res.status(200).json({ message: "Pendiente implementar con BD real" });

module.exports = {
  getEvents, getEventById, createEvent, updateEvent, cancelEvent, updateStock
};