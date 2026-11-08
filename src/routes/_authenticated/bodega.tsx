import { createFileRoute } from "@tanstack/react-router";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/bodega")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "bodega"),
  head: () => ({ meta: [{ title: "Solicitudes de repuestos · Andinas Search" }] }),
  component: () => (
    <div>
      <h1 className="text-3xl font-bold text-foreground">Solicitudes de repuestos</h1>
      <p className="mt-10 rounded-2xl border-2 border-dashed border-border p-10 text-center text-2xl text-muted-foreground">
        Próximamente
      </p>
    </div>
  ),
});
