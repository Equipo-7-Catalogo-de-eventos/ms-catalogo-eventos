"use client";

import { useState, useMemo } from "react";
import type { Evento } from "../types";
import EventoCard from "./EventoCard";
import FiltrosMenu, {
    FILTROS_MENU_INICIALES,
    type FiltrosMenuState,
} from "./FiltrosMenu";
import { poppins, inter } from "../styles/fonts";
import styles from "../styles/catalogo.module.css";

interface CatalogoVistaProps {
    eventos: Evento[];
}

const EVENTOS_POR_PAGINA = 6;

function normalizarTexto(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export default function CatalogoVista({ eventos }: CatalogoVistaProps) {
    const [busqueda, setBusqueda] = useState("");
    const [filtros, setFiltros] = useState<FiltrosMenuState>(FILTROS_MENU_INICIALES);
    const [pagina, setPagina] = useState(1);

    const handleBusquedaChange = (nuevoTexto: string) => {
        setBusqueda(nuevoTexto);
        setPagina(1);
    };

    const handleFiltrosChange = (nuevosFiltros: FiltrosMenuState) => {
        setFiltros(nuevosFiltros);
        setPagina(1);
    };

    const handleLimpiarTodo = () => {
        setBusqueda("");
        setFiltros(FILTROS_MENU_INICIALES);
        setPagina(1);
    };

    // Orden de aplicación: búsqueda → filtros → orden "mejor valorados"
    const eventosFiltrados = useMemo(() => {
        const termino = normalizarTexto(busqueda.trim());

        let resultado = eventos.filter((evento) => {
            // 1. Filtro por búsqueda
            if (termino) {
                const titulo = normalizarTexto(evento.evento_titulo);
                if (!titulo.includes(termino)) {
                    return false;
                }
            }

            // 2. Filtros de menú
            // a / b: Estado temporal
            if (filtros.estadoTemporal === "proximos" && evento.evento_estado === "pasado") {
                return false;
            }
            if (filtros.estadoTemporal === "pasados" && evento.evento_estado !== "pasado") {
                return false;
            }

            // c: Gratuitos
            if (filtros.gratuitos && evento.evento_tipo !== "gratuito") {
                return false;
            }

            // d: Rango de precio
            if (filtros.rangoPrecioActivo) {
                const min = filtros.precioMin.trim();
                const max = filtros.precioMax.trim();
                if (min !== "" && evento.evento_precio_final < Number(min)) {
                    return false;
                }
                if (max !== "" && evento.evento_precio_final > Number(max)) {
                    return false;
                }
            }

            return true;
        });

        // 3. Orden "mejor valorados" (los con resena_total === 0 van al final)
        if (filtros.mejorValorados) {
            resultado = [...resultado].sort((a, b) => {
                const aSinResenas = a.resena_total === 0;
                const bSinResenas = b.resena_total === 0;
                if (aSinResenas && !bSinResenas) return 1;
                if (!aSinResenas && bSinResenas) return -1;
                if (aSinResenas && bSinResenas) return 0;
                return b.resena_calificacion_promedio - a.resena_calificacion_promedio;
            });
        }

        return resultado;
    }, [eventos, busqueda, filtros]);

    // 4. Paginación
    const totalPaginas = Math.ceil(eventosFiltrados.length / EVENTOS_POR_PAGINA);
    const eventosPaginados = useMemo(() => {
        const inicio = (pagina - 1) * EVENTOS_POR_PAGINA;
        return eventosFiltrados.slice(inicio, inicio + EVENTOS_POR_PAGINA);
    }, [eventosFiltrados, pagina]);

    const textoContador =
        eventosFiltrados.length === 1 ? "1 evento" : `${eventosFiltrados.length} eventos`;

    return (
        <div className={`${styles.catalogo} ${poppins.variable} ${inter.variable}`}>
            <h1 className={styles.titulo}>Catálogo de eventos</h1>

            {/* Barra superior con FiltrosMenu y Buscador */}
            <div className={styles.barraSuperior}>
                <FiltrosMenu filtros={filtros} onChange={handleFiltrosChange} />

                <div className={styles.buscadorContenedor}>
                    <span className={styles.buscadorIcono}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="8.5" cy="8.5" r="5.5" />
                            <line x1="12.5" y1="12.5" x2="17" y2="17" />
                        </svg>
                    </span>
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => handleBusquedaChange(e.target.value)}
                        placeholder="Buscar eventos por nombre…"
                        aria-label="Buscar eventos"
                        className={styles.buscadorInput}
                    />
                </div>
            </div>

            {/* Contador de eventos */}
            <p className={styles.contadorEventos}>{textoContador}</p>

            {/* Grilla de eventos o Bloque sin resultados */}
            {eventosFiltrados.length === 0 ? (
                <div className={styles.sinResultados}>
                    <p className={styles.textoSinResultados}>
                        No encontramos eventos con esos filtros.
                    </p>
                    <button
                        type="button"
                        onClick={handleLimpiarTodo}
                        className={styles.botonReset}
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.grilla}>
                        {eventosPaginados.map((evento) => (
                            <EventoCard key={evento.evento_id} evento={evento} />
                        ))}
                    </div>

                    {/* Paginación (oculta si hay 1 sola página o menos) */}
                    {totalPaginas > 1 && (
                        <div className={styles.paginacion}>
                            <button
                                type="button"
                                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                                disabled={pagina <= 1}
                                aria-label="Página anterior"
                                className={styles.botonPaginacion}
                            >
                                ←
                            </button>
                            <span className={styles.textoPaginacion}>
                                Página {pagina} de {totalPaginas}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                                disabled={pagina >= totalPaginas}
                                aria-label="Página siguiente"
                                className={styles.botonPaginacion}
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
