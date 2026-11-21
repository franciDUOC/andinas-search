import { createFileRoute, Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/operario")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "operario"),
  head: () => ({ meta: [{ title: "Inicio Operario · Andinas Search" }, { name: "description", content: "Inicio del operario para reportar anomalías de la planta." }, { property: "og:title", content: "Inicio Operario · Andinas Search" }, { property: "og:description", content: "Inicio del operario para reportar anomalías de la planta." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <div className="flex min-h-[70vh] items-center">
      <Button asChild variant="alert" size="huge" className="min-h-[50vh]">
        <Link to="/reportar">
          <TriangleAlert />
          Reportar anomalía
        </Link>
      </Button>
    </div>
  ),
});
