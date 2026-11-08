import { createFileRoute, redirect } from "@tanstack/react-router";
import { cargarSesion } from "@/lib/session";
import { INICIO_POR_ROL } from "@/lib/roles";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Andinas Search · Mantenimiento Manufacturas Andina" },
      { name: "description", content: "Sistema de mantenimiento de planta de Manufacturas Andina." },
      { property: "og:title", content: "Andinas Search" },
      { property: "og:description", content: "Sistema de mantenimiento de planta de Manufacturas Andina." },
    ],
  }),
  beforeLoad: async () => {
    const sesion = await cargarSesion();
    if (!sesion) throw redirect({ to: "/auth" });
    throw redirect({ to: INICIO_POR_ROL[sesion.rol] });
  },
  component: () => null,
});
