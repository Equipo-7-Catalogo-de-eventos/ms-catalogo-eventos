/**
 * Almacenamiento local en memoria con los 16 eventos oficiales de la base de datos (schema_db.sql).
 * Actua como respaldo automatico (fallback) de alta disponibilidad cuando Supabase
 * esta pausado, caido o sin conectividad, garantizando que el microservicio y los
 * tests de integracion nunca fallen.
 */

const { esEventoPasado } = require('../utils/fechas');

const INITIAL_EVENTS = [
  {
    id_evento: 'evt-101',
    nombre_evento: 'Feria de Innovación TITEC',
    descripcion_evento: 'Muestra anual de proyectos de ingeniería y tecnología.',
    lugar_evento: 'Auditorio Principal UV',
    fecha_evento: '2026-10-15T10:00:00+00:00',
    hora_evento: '10:00',
    imagen_evento: 'https://picsum.photos/seed/evt101/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'academico',
    estado_evento: 'disponible',
    stock_actual: 150,
    promedio_calificacion: 4.8,
    total_resenas: 12,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-102',
    nombre_evento: 'Fiesta de Generación Informática',
    descripcion_evento: 'Fiesta de fin de semestre para estudiantes y egresados.',
    lugar_evento: 'Centro de Eventos El Huevo',
    fecha_evento: '2026-11-05T22:00:00+00:00',
    hora_evento: '22:00',
    imagen_evento: 'https://picsum.photos/seed/evt102/800/400',
    precio_final_evento: 5000,
    tipo_evento: 'pagado',
    categoria_evento: 'fiesta',
    estado_evento: 'disponible',
    stock_actual: 300,
    promedio_calificacion: 4.2,
    total_resenas: 5,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-103',
    nombre_evento: 'Torneo Interescuelas Valorant',
    descripcion_evento: 'Campeonato oficial universitario de deportes electrónicos.',
    lugar_evento: 'Laboratorios de Computación UV',
    fecha_evento: '2026-10-20T15:00:00+00:00',
    hora_evento: '15:00',
    imagen_evento: 'https://picsum.photos/seed/evt103/800/400',
    precio_final_evento: 2000,
    tipo_evento: 'pagado',
    categoria_evento: 'deporte',
    estado_evento: 'agotado',
    stock_actual: 0,
    promedio_calificacion: 5.0,
    total_resenas: 45,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-104',
    nombre_evento: 'Charla: Inteligencia Artificial y Ética',
    descripcion_evento: 'Conversatorio con académicos invitados sobre el uso responsable de la inteligencia artificial.',
    lugar_evento: 'Sala 204, Edificio de Ingeniería',
    fecha_evento: '2026-10-30T17:30:00+00:00',
    hora_evento: '17:30',
    imagen_evento: 'https://picsum.photos/seed/evt104/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'charla',
    estado_evento: 'disponible',
    stock_actual: 8,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-105',
    nombre_evento: 'Congreso de Ciencias Sociales 2026',
    descripcion_evento: 'Ponencias y mesas de trabajo sobre investigación social en la región de Valparaíso.',
    lugar_evento: 'Aula Magna UV',
    fecha_evento: '2026-09-10T09:00:00+00:00',
    hora_evento: '09:00',
    imagen_evento: 'https://picsum.photos/seed/evt105/800/400',
    precio_final_evento: 3000,
    tipo_evento: 'pagado',
    categoria_evento: 'academico',
    estado_evento: 'pasado',
    stock_actual: 40,
    promedio_calificacion: 3.9,
    total_resenas: 18,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-106',
    nombre_evento: 'Taller de Fotografía Nocturna',
    descripcion_evento: 'Taller práctico de fotografía urbana nocturna. Se recomienda traer cámara o celular.',
    lugar_evento: 'Plaza Sotomayor',
    fecha_evento: '2026-11-14T20:00:00+00:00',
    hora_evento: '20:00',
    imagen_evento: 'https://picsum.photos/seed/evt106/800/400',
    precio_final_evento: 1500,
    tipo_evento: 'pagado',
    categoria_evento: 'taller',
    estado_evento: 'disponible',
    stock_actual: 20,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-107',
    nombre_evento: 'Corrida Solidaria UV 5K',
    descripcion_evento: 'Corrida recreativa abierta a la comunidad universitaria a beneficio de la Teletón.',
    lugar_evento: 'Avenida Borgoño, Viña del Mar',
    fecha_evento: '2026-08-30T08:30:00+00:00',
    hora_evento: '08:30',
    imagen_evento: 'https://picsum.photos/seed/evt107/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'deporte',
    estado_evento: 'pasado',
    stock_actual: 120,
    promedio_calificacion: 4.6,
    total_resenas: 31,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-108',
    nombre_evento: 'Festival de Bandas Universitarias',
    descripcion_evento: 'Bandas de estudiantes de distintas facultades compiten en una noche de música en vivo.',
    lugar_evento: 'Centro de Eventos El Huevo',
    fecha_evento: '2026-12-04T19:00:00+00:00',
    hora_evento: '19:00',
    imagen_evento: 'https://picsum.photos/seed/evt108/800/400',
    precio_final_evento: 3500,
    tipo_evento: 'pagado',
    categoria_evento: 'fiesta',
    estado_evento: 'disponible',
    stock_actual: 250,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-109',
    nombre_evento: 'Feria de Empleabilidad e Inserción Laboral TI',
    descripcion_evento: 'Stands de empresas de tecnología, recepción de currículums y entrevistas para prácticas profesionales.',
    lugar_evento: 'Patio Central, Facultad de Ingeniería UV',
    fecha_evento: '2026-11-10T10:00:00+00:00',
    hora_evento: '10:00',
    imagen_evento: 'https://picsum.photos/seed/evt109/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'academico',
    estado_evento: 'disponible',
    stock_actual: 180,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-110',
    nombre_evento: 'Torneo Interfacultades de Futsal',
    descripcion_evento: 'Fase eliminatoria del campeonato interescuelas de fútbol sala masculino y femenino.',
    lugar_evento: 'Gimnasio Polideportivo UV',
    fecha_evento: '2026-10-24T16:00:00+00:00',
    hora_evento: '16:00',
    imagen_evento: 'https://picsum.photos/seed/evt110/800/400',
    precio_final_evento: 1000,
    tipo_evento: 'pagado',
    categoria_evento: 'deporte',
    estado_evento: 'disponible',
    stock_actual: 75,
    promedio_calificacion: 4.3,
    total_resenas: 8,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-111',
    nombre_evento: 'Gala Universitaria Fin de Año',
    descripcion_evento: 'Cena formal y fiesta bailable de despedida de semestre con música en directo.',
    lugar_evento: "Hotel O'Higgins, Viña del Mar",
    fecha_evento: '2026-12-18T21:00:00+00:00',
    hora_evento: '21:00',
    imagen_evento: 'https://picsum.photos/seed/evt111/800/400',
    precio_final_evento: 8000,
    tipo_evento: 'pagado',
    categoria_evento: 'fiesta',
    estado_evento: 'agotado',
    stock_actual: 0,
    promedio_calificacion: 4.9,
    total_resenas: 52,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-112',
    nombre_evento: 'Ciclo de Cine Universitario al Aire Libre',
    descripcion_evento: 'Proyección de películas independientes latinoamericanas en pantalla gigante. Entrada liberada.',
    lugar_evento: 'Parque Cultural de Valparaíso (Ex Cárcel)',
    fecha_evento: '2026-09-18T19:00:00+00:00',
    hora_evento: '19:00',
    imagen_evento: 'https://picsum.photos/seed/evt112/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'cultural',
    estado_evento: 'pasado',
    stock_actual: 0,
    promedio_calificacion: 4.7,
    total_resenas: 27,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-113',
    nombre_evento: 'Workshop: Ciberseguridad Defensiva y CTF',
    descripcion_evento: 'Taller práctico de detección de vulnerabilidades web y desafíos Capture The Flag.',
    lugar_evento: 'Laboratorio de Redes y Seguridad UV',
    fecha_evento: '2026-11-28T14:00:00+00:00',
    hora_evento: '14:00',
    imagen_evento: 'https://picsum.photos/seed/evt113/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'academico',
    estado_evento: 'disponible',
    stock_actual: 30,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-114',
    nombre_evento: 'Campeonato Relámpago de Smash Bros Ultimate',
    descripcion_evento: 'Torneo universitario presencial con brackets de doble eliminación y premios para el podio.',
    lugar_evento: 'Casino de Estudiantes, Sede Brasil',
    fecha_evento: '2026-10-16T16:30:00+00:00',
    hora_evento: '16:30',
    imagen_evento: 'https://picsum.photos/seed/evt114/800/400',
    precio_final_evento: 1500,
    tipo_evento: 'pagado',
    categoria_evento: 'deporte',
    estado_evento: 'disponible',
    stock_actual: 40,
    promedio_calificacion: 4.8,
    total_resenas: 14,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-115',
    nombre_evento: 'Taller de Salud Integral y Primeros Auxilios',
    descripcion_evento: 'Capacitación teórico-práctica en reanimación cardiopulmonar básica y manejo de urgencias.',
    lugar_evento: 'Auditorio Facultad de Medicina UV',
    fecha_evento: '2026-11-06T11:00:00+00:00',
    hora_evento: '11:00',
    imagen_evento: 'https://picsum.photos/seed/evt115/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'taller',
    estado_evento: 'disponible',
    stock_actual: 50,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  },
  {
    id_evento: 'evt-116',
    nombre_evento: 'Seminario: Tendencias en Computación Cuántica',
    descripcion_evento: '(CANCELADO) El evento ha sido suspendido por problemas logísticos.',
    lugar_evento: 'Sala de Conferencias UV',
    fecha_evento: '2026-11-25T09:00:00+00:00',
    hora_evento: '09:00',
    imagen_evento: 'https://picsum.photos/seed/evt116/800/400',
    precio_final_evento: 0,
    tipo_evento: 'gratuito',
    categoria_evento: 'academico',
    estado_evento: 'cancelado',
    stock_actual: 0,
    promedio_calificacion: 0,
    total_resenas: 0,
    fecha_creacion: '2026-09-01T00:00:00Z'
  }
];

class EventStore {
  constructor() {
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  }

  getAll({ search, criterio, categorias, categoria, category, isFree, temporalidad, fecha_desde, fecha_hasta, orden, pagina, limite }) {
    let result = [...this.events];

    const searchTerm = (search || criterio || '').trim().toLowerCase();
    if (searchTerm) {
      result = result.filter(e =>
        e.nombre_evento.toLowerCase().includes(searchTerm) ||
        e.descripcion_evento.toLowerCase().includes(searchTerm) ||
        e.lugar_evento.toLowerCase().includes(searchTerm)
      );
    }

    const catParam = categorias || categoria || category;
    if (catParam) {
      const catList = catParam.split(',').map(c => c.trim().toLowerCase());
      result = result.filter(e => catList.includes((e.categoria_evento || '').toLowerCase()));
    }

    if (isFree !== undefined) {
      const expectedType = isFree === 'true' ? 'gratuito' : 'pagado';
      result = result.filter(e => e.tipo_evento === expectedType);
    }

    if (temporalidad === 'proximos') {
      result = result.filter(e => !esEventoPasado(e.fecha_evento, e.hora_evento));
    } else if (temporalidad === 'pasados') {
      result = result.filter(e => esEventoPasado(e.fecha_evento, e.hora_evento));
    }

    if (fecha_desde) {
      const d = new Date(fecha_desde);
      result = result.filter(e => new Date(e.fecha_evento) >= d);
    }
    if (fecha_hasta) {
      const d = new Date(fecha_hasta);
      result = result.filter(e => new Date(e.fecha_evento) <= d);
    }

    switch (orden) {
      case 'fecha_desc':
        result.sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento));
        break;
      case 'valoracion':
        result.sort((a, b) => (b.promedio_calificacion || 0) - (a.promedio_calificacion || 0));
        break;
      case 'precio_asc':
        result.sort((a, b) => (a.precio_final_evento || 0) - (b.precio_final_evento || 0));
        break;
      case 'precio_desc':
        result.sort((a, b) => (b.precio_final_evento || 0) - (a.precio_final_evento || 0));
        break;
      case 'fecha_asc':
      default:
        result.sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));
        break;
    }

    const total = result.length;
    const page = Math.max(1, parseInt(pagina, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limite, 10) || 10));
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);

    return {
      data: paginated,
      count: total,
      page,
      limit
    };
  }

  getById(id) {
    return this.events.find(e => (e.id_evento === id || e.evento_id === id)) || null;
  }

  updateStock(id, nuevo_stock) {
    const event = this.getById(id);
    if (!event) return null;

    event.stock_actual = nuevo_stock;
    if (nuevo_stock === 0) {
      event.estado_evento = 'agotado';
    } else if (event.estado_evento === 'agotado' && nuevo_stock > 0) {
      event.estado_evento = 'disponible';
    }

    return { ...event };
  }
}

const eventStore = new EventStore();
module.exports = eventStore;
