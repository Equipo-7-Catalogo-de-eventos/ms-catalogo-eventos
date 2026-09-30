// ANDAMIAJE LOCAL: simula el componente compartido del repo común. NO se migra.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { poppins, inter } from "@/modules/catalogo/styles/fonts";
import styles from "./layout.module.css";

export const NOMBRE_MARCA = "TICKET-U";

const NOTIFICACIONES_SIN_LEER = 1;

const LINKS_NAVEGACION = [
    { nombre: "Inicio", href: "/catalogo" },
    { nombre: "Mis eventos", href: "/mis-eventos" },
    { nombre: "Promociones", href: "/promociones" },
    { nombre: "Configuración", href: "/configuracion" },
    { nombre: "Mi cuenta", href: "/mi-cuenta" },
];

export default function Header() {
    const pathname = usePathname() || "";

    const esActivo = (href: string) => {
        if (href === "/catalogo") {
            return pathname === "/" || pathname.startsWith("/catalogo");
        }
        return pathname.startsWith(href);
    };

    return (
        <header className={`${styles.header} ${poppins.variable} ${inter.variable}`}>
            {/* Izquierda: Logotipo y Marca */}
            <Link href="/catalogo" className={styles.logoLink} aria-label={NOMBRE_MARCA}>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6z" />
                    <line x1="9" y1="4" x2="9" y2="20" strokeDasharray="2 2" />
                </svg>
                <span className={styles.logoTexto}>{NOMBRE_MARCA}</span>
            </Link>

            {/* Navegación principal */}
            <nav aria-label="Navegación principal" className={styles.nav}>
                {LINKS_NAVEGACION.map((link) => {
                    const activo = esActivo(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${activo ? styles.navLinkActivo : ""}`}
                            aria-current={activo ? "page" : undefined}
                        >
                            {link.nombre}
                        </Link>
                    );
                })}
            </nav>

            {/* Derecha: Notificaciones y Avatar */}
            <div className={styles.headerDerecha}>
                <button
                    type="button"
                    className={styles.botonNotificaciones}
                    aria-label={
                        NOTIFICACIONES_SIN_LEER > 0
                            ? `Notificaciones, ${NOTIFICACIONES_SIN_LEER} sin leer`
                            : "Notificaciones"
                    }
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
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {NOTIFICACIONES_SIN_LEER > 0 && (
                        <span className={styles.notificacionesGlobo} aria-hidden="true">
                            {NOTIFICACIONES_SIN_LEER > 9 ? "9+" : NOTIFICACIONES_SIN_LEER}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    className={styles.avatarBoton}
                    aria-label="Mi cuenta"
                >
                    MC
                </button>
            </div>
        </header>
    );
}
