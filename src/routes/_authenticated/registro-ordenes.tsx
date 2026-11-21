import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { exigirRol } from "@/lib/guard";
import { registroOrdenesQuery } from "@/lib/ordenes";
import { TEXTO_TIPO } from "@/lib/estados";

export const Route = createFileRoute("/_authenticated/registro-ordenes")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "supervisor"),
  loader: ({ context }) => context.queryClient.ensureQueryData(registroOrdenesQuery),
  head: () => ({
    meta: [
      { title: "Registro de órdenes completadas · Andinas Search" },
      { name: "description", content: "Registro de trabajos completados, técnicos y causas de falla de Manufacturas Andina." },
      { property: "og:title", content: "Registro de órdenes completadas · Andinas Search" },
      { property: "og:description", content: "Registro de trabajos completados, técnicos y causas de falla de Manufacturas Andina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegistroOrdenes,
});

const fecha = (valor: string) => new Date(valor).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

function RegistroOrdenes() {
  const queryClient = useQueryClient();
  const { data: ordenes } = useSuspenseQuery(registroOrdenesQuery);

  useEffect(() => {
    const canal = supabase
      .channel(`registro-ordenes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "work_orders" }, () => {
        queryClient.invalidateQueries({ queryKey: registroOrdenesQuery.queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/supervisor" aria-label="Volver al panel de máquinas"><ArrowLeft className="size-7" /></Link>
        </Button>
        <h1 className="min-w-0 text-3xl font-bold text-foreground">Registro de órdenes completadas</h1>
      </div>
      <p className="text-xl text-muted-foreground">{ordenes.length} órdenes completadas</p>
      {ordenes.length === 0 ? (
        <p className="border-2 border-dashed border-border p-8 text-center text-xl text-muted-foreground">Sin órdenes completadas</p>
      ) : (
        <ol className="grid gap-4 lg:grid-cols-2">
          {ordenes.map((o) => (
            <li key={o.id} className="space-y-3 break-words rounded-lg border-2 border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-muted-foreground">{o.machines?.codigo}</p>
                  <h2 className="text-2xl font-bold text-foreground">{o.machines?.nombre}</h2>
                  {o.machines?.ubicacion && <p className="text-lg text-muted-foreground">{o.machines.ubicacion}</p>}
                </div>
                <span className="flex items-center gap-2 text-lg font-bold text-estado-operativa"><CheckCircle2 className="size-6 shrink-0" /> Completada</span>
              </div>
              <p className="text-xl"><span className="font-bold">Técnico: </span>{o.profiles?.nombre_completo || "Técnico sin nombre"}</p>
              <p className="text-xl"><span className="font-bold">Falla: </span>{TEXTO_TIPO[o.anomaly_reports?.tipo ?? ""] ?? o.anomaly_reports?.tipo}</p>
              {o.anomaly_reports?.descripcion && <p className="text-lg">{o.anomaly_reports.descripcion}</p>}
              <p className="whitespace-pre-wrap text-xl"><span className="font-bold">Causa: </span>{o.causa_falla || "Sin causa registrada"}</p>
              <p className="text-lg text-muted-foreground">Asignada: {fecha(o.creado_en)}</p>
              <p className="text-lg text-muted-foreground">Terminada: {o.completado_en ? fecha(o.completado_en) : "Sin fecha registrada"}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}