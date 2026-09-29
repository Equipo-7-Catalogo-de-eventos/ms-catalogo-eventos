// ============================================================================
// modules/catalogo/api.ts
// Recordatorio de alcance: el catálogo SOLO busca/lista/consulta eventos.
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";
import type { Evento, FiltrosEventos, RespuestaLista, RespuestaDetalle } from "./types";
import { eventosPrueba } from "./datosPrueba";

// Cambiar a false cuando el backend esté funcionando.
const USAR_DATOS_PRUEBA = false;

// TODO: el repo común usa "/api/catalogo/eventos" vía Gateway. Confirmar path final.
const BASE_PATH = "/api/v1/events";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function buscarEventos(filtros: FiltrosEventos = {}): Promise<Evento[]> {
    if (USAR_DATOS_PRUEBA) {
        await esperar(500);
        return eventosPrueba.filter((e) => {
            if (filtros.search && !e.evento_titulo.toLowerCase().includes(filtros.search.toLowerCase())) return false;
            if (filtros.category && e.evento_categoria !== filtros.category) return false;
            if (filtros.isFree !== undefined && (e.evento_tipo === "gratuito") !== filtros.isFree) return false;
            return true;
        });
    }

    const params = new URLSearchParams();
    if (filtros.search) params.set("search", filtros.search);
    if (filtros.category) params.set("category", filtros.category);
    if (filtros.isFree !== undefined) params.set("isFree", String(filtros.isFree));

    const res = await fetch(`${GATEWAY_URL}${BASE_PATH}?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Error al conectar con el módulo de catálogo");
    const json: RespuestaLista = await res.json();
    return json.data;
}

export async function obtenerEventoPorId(eventoId: string): Promise<Evento> {
    if (USAR_DATOS_PRUEBA) {
        await esperar(500);
        const evento = eventosPrueba.find((e) => e.evento_id === eventoId);
        if (!evento) throw new Error("Error al obtener el evento del catálogo");
        return evento;
    }

    const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/${encodeURIComponent(eventoId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Error al obtener el evento del catálogo");
    const json: RespuestaDetalle = await res.json();
    return json.data;
}