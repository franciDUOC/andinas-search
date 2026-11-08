import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/tecnico")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  head: () => ({ meta: [{ title: "Inicio Técnico · Andinas Search" }] }),
  component: () => (
    <div className="flex flex-col gap-5 pt-4">
      <Button size="tile">
        <ClipboardList /> Mis órdenes
      </Button>
      <Button size="tile" variant="secondary">
        <QrCode /> Escanear QR
      </Button>
    </div>
  ),
});
