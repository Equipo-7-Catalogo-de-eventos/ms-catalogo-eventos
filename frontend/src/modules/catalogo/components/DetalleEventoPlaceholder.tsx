// ============================================================================
// modules/catalogo/components/DetalleEventoPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 2 — Detalle de un evento específico dentro del catálogo.
//
// Este componente muestra datos generales del evento y, además, inserta
// tres bloques de OTROS módulos (cada uno responsable de su propio
// contenido y lógica interna):
//   - Disponibilidad de entradas -> modules/entradas/  (Grupo 3)
//   - Promociones activas        -> modules/promociones/ (Grupo 9)
//   - Reseñas del evento         -> ruta anidada /catalogo/[eventoId]/resenas (Grupo 6)
//
// El Grupo 2 decide DÓNDE se posicionan estos bloques en la página; el
// contenido y comportamiento de cada uno es responsabilidad de su propio
// grupo. Ver README.md sección 4/5 para más detalle sobre estas integraciones.
// ============================================================================

import Link from "next/link";
import { obtenerEventoPorId, obtenerResenasEvento } from "../api";
import type { Evento } from "../types";
import { formatearFechaLarga, formatearPrecio, formatearNumero, esPasado } from "../formato";
import ImagenEvento from "./ImagenEvento";
import Estrellas from "./Estrellas";
import ResumenResenas from "./ResumenResenas";
import { poppins, inter } from "../styles/fonts";
import styles from "../styles/catalogo.module.css";

export default async function DetalleEventoPlaceholder({
    eventoId,
}: {
    eventoId: string;
}) {
    let evento: Evento;
    let resumenResenas;

    try {
        [evento, resumenResenas] = await Promise.all([
            obtenerEventoPorId(eventoId),
            obtenerResenasEvento(eventoId)
        ]);
    } catch (error) {
        console.error("Error en detalle:", error);
        return (
            <div
                className={`${styles.catalogo} ${styles.detalleContenedor} ${poppins.variable} ${inter.variable}`}
            >
                <div className={styles.errorDetalle}>
                    <p className={styles.errorDetalleTexto}>
                        No encontramos este evento o no pudimos cargarlo.
                    </p>
                    <Link href="/catalogo" className={styles.linkVolverError}>
                        ← Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    const eventoEsPasado = esPasado(evento);
    const esAgotado = evento.evento_estado === "agotado";
    const esCancelado = evento.evento_estado === "cancelado";
    const esAtenuada = esAgotado || esCancelado || eventoEsPasado;
    const precioTexto = formatearPrecio(evento.evento_precio_final);
    const precioEsGratis = precioTexto === "Gratis";

    return (
        <div
            className={`${styles.catalogo} ${styles.detalleContenedor} ${poppins.variable} ${inter.variable}`}
        >
            {/* a. Link de volver */}
            <Link
                href="/catalogo"
                className={styles.linkVolver}
                aria-label="Volver al catálogo"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Volver al catálogo</span>
            </Link>

            {/* b. Imagen banner */}
            <ImagenEvento
                src={evento.evento_imagen}
                alt={evento.evento_titulo}
                alto={320}
                apagada={esAtenuada}
                className={styles.bannerImagen}
            />

            {/* c. Título h1 centrado, badge de estado y categoría */}
            <div className={styles.cabeceraDetalle}>
                <h1 className={styles.tituloDetalle}>{evento.evento_titulo}</h1>

                {(esAgotado || esCancelado || eventoEsPasado) && (
                    <span
                        className={`${styles.badgeEstadoDetalle} ${
                            esAgotado
                                ? styles.badgeAgotado
                                : esCancelado
                                ? styles.badgeCancelado
                                : styles.badgePasado
                        }`}
                    >
                        {esAgotado 
                            ? "Agotado" 
                            : esCancelado 
                            ? "Cancelado" 
                            : "Pasado"}
                    </span>
                )}

                {evento.evento_categoria && (
                    <span className={styles.categoriaDetalle}>
                        {evento.evento_categoria.charAt(0).toUpperCase() +
                            evento.evento_categoria.slice(1)}
                    </span>
                )}

                {/* Resumen de calificación */}
                {evento.resena_total > 0 ? (
                    <div
                        className={styles.calificacionDetalle}
                        role="img"
                        aria-label={`Calificación ${evento.resena_calificacion_promedio.toFixed(1)} de 5, basada en ${evento.resena_total} ${evento.resena_total === 1 ? "reseña" : "reseñas"}`}
                    >
                        <span className={styles.estrellasContenedor}>
                            <Estrellas valor={evento.resena_calificacion_promedio} tamano={20} />
                        </span>
                        <span className={styles.calificacionPromedio}>
                            {evento.resena_calificacion_promedio.toFixed(1)}
                        </span>
                        <span className={styles.calificacionTotal}>
                            ({evento.resena_total} {evento.resena_total === 1 ? "reseña" : "reseñas"})
                        </span>
                    </div>
                ) : (
                    <span className={styles.sinCalificaciones}>Sin calificaciones aún</span>
                )}
            </div>

            {/* d. Recuadro de información */}
            <section className={styles.panelInfo} aria-label="Información del evento">
                <h2 className={styles.subtituloDetalle}>Descripción</h2>
                <p className={styles.descripcionTexto}>{evento.evento_descripcion}</p>

                <hr className={styles.separadorPanel} />

                <dl className={styles.listaDatos}>
                    <div className={styles.filaDato}>
                        <span className={styles.iconoDato}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </span>
                        <dt className={styles.etiquetaDato}>Lugar:</dt>
                        <dd className={styles.valorDato}>{evento.evento_lugar}</dd>
                    </div>

                    <div className={styles.filaDato}>
                        <span className={styles.iconoDato}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </span>
                        <dt className={styles.etiquetaDato}>Fecha:</dt>
                        <dd className={styles.valorDato}>
                            {formatearFechaLarga(evento.evento_fecha)}
                        </dd>
                    </div>

                    <div className={styles.filaDato}>
                        <span className={styles.iconoDato}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </span>
                        <dt className={styles.etiquetaDato}>Horario:</dt>
                        <dd className={styles.valorDato}>{evento.evento_hora} hrs</dd>
                    </div>

                    <div className={styles.filaDato}>
                        <span className={styles.iconoDato}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                        </span>
                        <dt className={styles.etiquetaDato}>Precio:</dt>
                        <dd
                            className={`${styles.valorDato} ${
                                precioEsGratis ? styles.precioGratis : ""
                            }`}
                        >
                            {precioTexto}
                        </dd>
                    </div>

                    {!eventoEsPasado && !esCancelado && (
                        <div className={styles.filaDato}>
                            <span className={styles.iconoDato}>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M15 5v2" />
                                    <path d="M15 11v2" />
                                    <path d="M15 17v2" />
                                    <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
                                </svg>
                            </span>
                            <dt className={styles.etiquetaDato}>Entradas disponibles:</dt>
                            <dd
                                className={`${styles.valorDato} ${
                                    evento.inventario_stock === 0 ? styles.badgeAgotado : ""
                                }`}
                                style={evento.inventario_stock === 0 ? { color: "var(--color-peligro-texto)", fontWeight: 600 } : {}}
                            >
                                {evento.inventario_stock === 0 ? "Agotadas" : formatearNumero(evento.inventario_stock)}
                            </dd>
                        </div>
                    )}
                </dl>
            </section>

            {/* El bloque de Reseñas NO se importa acá: vive en su propia ruta
          anidada /catalogo/[eventoId]/resenas (Grupo 6), no como componente
          embebido, porque incluye un formulario de creación/edición completo. */}

            {/* f. Sección de compra */}
            <section className={styles.seccionCompra} aria-label="Comprar entradas">
                {!esCancelado && (
                    <p className={styles.textoCompraEncabezado}>¡Consigue tu entrada aquí!</p>
                )}

                {!esAgotado && !esCancelado && !eventoEsPasado ? (
                    // TODO: confirmar con el Grupo 3 (Entradas) la ruta y el parámetro del flujo de compra.
                    <Link
                        href={`/entradas?eventoId=${encodeURIComponent(evento.evento_id)}`}
                        className={styles.botonCompra}
                    >
                        {evento.evento_tipo === "gratuito" ? "Reservar" : "Comprar"}
                    </Link>
                ) : esCancelado ? (
                    <>
                        <div className={styles.etiquetaCanceladoPill}>
                            Evento cancelado
                        </div>
                        <p className={styles.textoEstadoAviso}>
                            Este evento fue cancelado por el organizador.
                        </p>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            disabled
                            className={`${styles.botonCompra} ${styles.botonCompraDeshabilitado}`}
                        >
                            {evento.evento_tipo === "gratuito" ? "Reservar" : "Comprar"}
                        </button>
                        <p className={styles.textoEstadoAviso}>
                            {esAgotado
                                ? "Las entradas para este evento están agotadas."
                                : "Este evento ya se realizó."}
                        </p>
                    </>
                )}
            </section>

            {/* g. Resumen de reseñas (HU6) */}
            <div style={{ marginTop: 48, marginBottom: 48 }}>
                <ResumenResenas 
                    resumen={resumenResenas} 
                    eventoId={eventoId} 
                    imagenEvento={evento.evento_imagen} 
                    tituloEvento={evento.evento_titulo} 
                />
            </div>
        </div>
    );
}