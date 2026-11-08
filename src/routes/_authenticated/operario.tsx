import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/operario")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "operario"),
  head: () => ({ meta: [{ title: "Inicio Operario · Andinas Search" }] }),
  component: () => (
    <div className="flex min-h-[70vh] items-center">
      <Button variant="alert" size="huge" className="min-h-[50vh]">
        <TriangleAlert />
        Reportar anomalía
      </Button>
    </div>
  ),
});
