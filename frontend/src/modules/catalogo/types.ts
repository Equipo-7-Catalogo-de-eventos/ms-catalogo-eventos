// Estructura real de la tabla `eventos` (schema_db.sql)
export type TipoEvento = "gratuito" | "pagado";
export type EstadoEvento = "disponible" | "agotado" | "pasado" | "cancelado";

export interface Evento {
    evento_id: string;
    evento_titulo: string;
    evento_descripcion: string;
    evento_lugar: string;
    evento_fecha: string;          // timestamp ISO, ej. "2026-10-15T10:00:00+00:00"
    evento_hora: string;           // "10:00"
    evento_imagen: string;         // URL
    evento_precio_final: number;   // 0 = gratuito
    evento_tipo: TipoEvento;
    evento_categoria: string | null;
    evento_estado: EstadoEvento;
    inventario_stock: number;
    resena_calificacion_promedio: number; // 0 si no hay reseñas
    resena_total: number;
    metrica_clics?: number;
    created_at?: string;
}

export interface FiltrosEventos {
    search?: string;
    category?: string;
    isFree?: boolean;
}

// Formato en que responde el backend
export interface RespuestaLista {
    success: boolean;
    count: number;
    data: Evento[];
}

export interface RespuestaDetalle {
    success: boolean;
    data: Evento;
}

export interface Resena {
  usuario_id: string;
  nombre_usuario: string;   // TODO: acordar con Reseñas; su contrato v1 no lo incluye
  calificacion: number;     // entero 1 a 5
  comentario?: string;
  fecha: string;            // ISO 8601
}
export interface ResumenResenas {
  id_evento: string;
  promedio: number | null;
  total_resenas: number;
  resenas: Resena[];        // las más recientes primero
}
export interface RespuestaResenas { success: boolean; data: ResumenResenas; }