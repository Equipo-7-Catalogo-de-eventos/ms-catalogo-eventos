import { redirect } from "next/navigation";

// ANDAMIAJE LOCAL: la raíz redirige al catálogo. NO se migra.
export default function Home() {
  redirect("/catalogo");
}