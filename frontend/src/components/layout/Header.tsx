// ANDAMIAJE LOCAL: simula el componente compartido del repo común. NO se migra.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { poppins, inter } from "@/modules/catalogo/styles/fonts";
import styles from "./layout.module.css";

export const NOMBRE_MARCA = "TICKET-U";

const LINKS_NAVEGACION = [
    { nombre: "INICIO", href: "/catalogo" },
    { nombre: "MIS EVENTOS", href: "/mis-eventos" },
    { nombre: "PROMOCIONES", href: "/promociones" },
    { nombre: "CONFIGURACIÓN", href: "/configuracion" },
    { nombre: "MI CUENTA", href: "/mi-cuenta" },
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
            {/* Fila Superior */}
            <div className={styles.filaSuperior}>
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

                {/* Derecha: Avatar */}
                <div className={styles.filaSuperiorDerecha}>
                    <button
                        type="button"
                        className={styles.avatarBoton}
                        aria-label="Mi cuenta"
                    >
                        MC
                    </button>
                </div>
            </div>

            {/* Fila de Navegación */}
            <div className={styles.filaNavegacion}>
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
            </div>
        </header>
    );
}
