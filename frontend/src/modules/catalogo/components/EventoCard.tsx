import Link from "next/link";
import type { Evento } from "../types";
import { formatearFecha, formatearPrecio, esPasado } from "../formato";
import ImagenEvento from "./ImagenEvento";
import styles from "../styles/catalogo.module.css";

interface EventoCardProps {
    evento: Evento;
}

export default function EventoCard({ evento }: EventoCardProps) {
    const eventoEsPasado = esPasado(evento);
    const esAgotado = evento.evento_estado === "agotado";
    const esCancelado = evento.evento_estado === "cancelado";
    const esAtenuada = esAgotado || esCancelado || eventoEsPasado;

    const estadoCardClass =
        esAgotado
            ? styles.cardAgotado
            : esCancelado
            ? styles.cardCancelado
            : eventoEsPasado
            ? styles.cardPasado
            : styles.cardDisponible;

    const precioTexto = formatearPrecio(evento.evento_precio_final);
    const esGratis = precioTexto === "Gratis";

    return (
        <Link
            href={`/catalogo/${evento.evento_id}`}
            className={`${styles.card} ${estadoCardClass}`}
        >
            <div className={styles.imagenContenedor}>
                <ImagenEvento
                    src={evento.evento_imagen}
                    alt={evento.evento_titulo}
                    alto={160}
                    radio={8}
                    apagada={esAtenuada}
                />

                {/* Badge de estado en esquina superior izquierda (solo si NO es disponible) */}
                {(esAgotado || esCancelado || eventoEsPasado) && (
                    <span
                        className={`${styles.badgeEstado} ${
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

                {/* Calificación y total reseñas en esquina inferior derecha (solo si resena_total > 0) */}
                {evento.resena_total > 0 && (
                    <span className={styles.pillCalificacion}>
                        ★ {evento.resena_calificacion_promedio.toFixed(1)} ({evento.resena_total})
                    </span>
                )}
            </div>

            <div className={styles.tarjetaInfo}>
                <h3 className={styles.tarjetaTitulo}>{evento.evento_titulo}</h3>
                <p className={styles.tarjetaDetalle}>
                    {evento.evento_lugar} · {formatearFecha(evento.evento_fecha)}, {evento.evento_hora}
                </p>
                <span className={`${styles.tarjetaPrecio} ${esGratis ? styles.precioGratis : ""}`}>
                    {precioTexto}
                </span>
            </div>
        </Link>
    );
}
