// SIMULACIÓN LOCAL: el componente real lo entrega el Grupo de Promociones. NO se migra.

import { poppins, inter } from "@/modules/catalogo/styles/fonts";

export default function PromocionPlaceholder({ eventoId }: { eventoId: string }) {
  void eventoId;

  return (
    <div
      className={`${poppins.variable} ${inter.variable}`}
      style={{
        background: "#F8F9FA",
        border: "1px solid #D8DFF0",
        borderRadius: 12,
        padding: 16,
        boxSizing: "border-box" as const,
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "#2F4374",
          margin: "0 0 8px",
        }}
      >
        Promociones
      </h3>
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 14,
          color: "#6B7A9A",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Promociones del evento próximamente.
      </p>
    </div>
  );
}
