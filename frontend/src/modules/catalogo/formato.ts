export function formatearPrecio(n: number): string {
    if (n === 0) {
        return "Gratis";
    }
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
    }).format(n);
}

export function formatearFecha(iso: string): string {
    const fecha = new Date(iso);
    const formateador = new Intl.DateTimeFormat("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
    return formateador.format(fecha).replace(".", "");
}

export function formatearFechaLarga(iso: string): string {
    const fecha = new Date(iso);
    const texto = new Intl.DateTimeFormat("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(fecha);

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
