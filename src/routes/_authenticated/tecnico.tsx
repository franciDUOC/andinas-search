import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";
import { useOrdenesNuevas } from "@/lib/avisos";

export const Route = createFileRoute("/_authenticated/tecnico")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  head: () => ({ meta: [{ title: "Inicio Técnico · Andinas Search" }] }),
  component: InicioTecnico,
});

function InicioTecnico() {
  const nuevas = useOrdenesNuevas();
  return (
    <div className="flex flex-col gap-5 pt-4">
      <Button asChild size="tile">
        <Link to="/mis-ordenes" className="relative">
          <ClipboardList /> Mis órdenes
          {nuevas > 0 && (
            <span
              aria-label={`${nuevas} órdenes nuevas`}
              className="absolute right-4 top-4 size-6 rounded-full border-2 border-card bg-destructive"
            />
          )}
        </Link>
      </Button>
      <Button size="tile" variant="secondary">
        <QrCode /> Escanear QR
      </Button>
    </div>
  );
}
