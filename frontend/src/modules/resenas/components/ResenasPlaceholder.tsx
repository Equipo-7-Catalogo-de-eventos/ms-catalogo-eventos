// SIMULACIÓN LOCAL: el componente real lo entrega el Grupo de Reseñas. NO se migra.

import { poppins, inter } from "@/modules/catalogo/styles/fonts";

export default function ResenasPlaceholder({ eventoId }: { eventoId: string }) {
  void eventoId;

  return (
    <div
      className={`${poppins.variable} ${inter.variable}`}
      style={{
        maxWidth: 800,
        margin: "0 auto 48px",
        background: "#F8F9FA",
        border: "1px solid #D8DFF0",
        borderRadius: 12,
        padding: 24,
        boxSizing: "border-box" as const,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#2F4374",
          margin: "0 0 8px",
        }}
      >
        Reseñas
      </h2>
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 14,
          color: "#6B7A9A",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Pronto podrás leer y escribir reseñas de este evento.
      </p>
    </div>
  );
}
