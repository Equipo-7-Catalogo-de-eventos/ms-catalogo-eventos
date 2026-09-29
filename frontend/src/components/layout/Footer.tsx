// ANDAMIAJE LOCAL: simula el componente compartido del repo común. NO se migra.

import Link from "next/link";
import { NOMBRE_MARCA } from "./Header";
import { poppins, inter } from "@/modules/catalogo/styles/fonts";
import styles from "./layout.module.css";

export default function Footer() {
    return (
        <footer className={`${styles.footer} ${poppins.variable} ${inter.variable}`}>
            <div className={styles.footerCentro}>
                <span className={styles.footerMarca}>{NOMBRE_MARCA} © 2026</span>
                <span className={styles.footerSeparador} aria-hidden="true" />
                <Link href="#" className={styles.footerLink}>
                    Centro de Ayuda
                </Link>
                <span className={styles.footerSeparador} aria-hidden="true" />
                <Link href="#" className={styles.footerLink}>
                    Términos de Servicio
                </Link>
            </div>

            <button
                type="button"
                className={styles.botonAyuda}
                aria-label="Ayuda"
            >
                ?
            </button>
        </footer>
    );
}
