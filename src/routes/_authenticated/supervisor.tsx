import { createFileRoute } from "@tanstack/react-router";
import { exigirRol } from "@/lib/guard";

export const Route = createFileRoute("/_authenticated/supervisor")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "supervisor"),
  head: () => ({ meta: [{ title: "Panel de máquinas · Andinas Search" }] }),
  component: () => <h1 className="text-3xl font-bold text-foreground">Panel de máquinas</h1>,
});
