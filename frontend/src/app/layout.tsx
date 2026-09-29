import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

// ANDAMIAJE LOCAL: copia del layout del repo común. NO se migra.

export const metadata = {
  title: "Plataforma de Eventos",
  description: "Proyecto universitario — plataforma de gestión de eventos",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main style={{ minHeight: "70vh", padding: "1rem 2rem" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
