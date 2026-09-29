// Página de detalle de UN evento — GRUPO 2 (Catálogo)
//
// Acá se muestra la info del evento (nombre, fecha, promociones,
// entradas disponibles). El resumen de reseñas lo muestra el Catálogo (HU6),
// pero la página COMPLETA de reseñas vive en la subcarpeta ./resenas
// — ESE archivo es del Grupo 6, no lo editen.

import DetalleEventoPlaceholder from "@/modules/catalogo/components/DetalleEventoPlaceholder";

// Ejemplo de cómo pueden coexistir Catálogo (Grupo 2) y Reseñas (Grupo 6)
// en la misma página: el Grupo 2 es dueño de este archivo page.tsx y
// del componente del detalle donde integra los datos del resumen.
// La página separada para leer y escribir reseñas está delegada al Grupo 6.

export default function DetalleEventoPage({
    params,
}: {
    params: { eventoId: string };
}) {
    return (
        <div>
            <DetalleEventoPlaceholder eventoId={params.eventoId} />
        </div>
    );
}