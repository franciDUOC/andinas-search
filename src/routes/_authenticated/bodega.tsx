import { createFileRoute } from "@tanstack/react-router";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/bodega")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "bodega"),
  head: () => ({ meta: [{ title: "Solicitudes de repuestos · Andinas Search" }, { name: "description", content: "Solicitudes de repuestos de la planta Manufacturas Andina." }, { property: "og:title", content: "Solicitudes de repuestos · Andinas Search" }, { property: "og:description", content: "Solicitudes de repuestos de la planta Manufacturas Andina." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <div>
      <h1 className="text-3xl font-bold text-foreground">Solicitudes de repuestos</h1>
      <p className="mt-10 rounded-2xl border-2 border-dashed border-border p-10 text-center text-2xl text-muted-foreground">
        Próximamente
      </p>
    </div>
  ),
});
