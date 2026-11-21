import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { limpiarOrdenesNuevas } from "@/lib/avisos";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";
import { TEXTO_ORDEN, TEXTO_TIPO } from "@/lib/estados";
import { cn } from "@/lib/utils";
import { ordenesQuery } from "@/lib/ordenes";

export const Route = createFileRoute("/_authenticated/mis-ordenes")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(ordenesQuery(context.sesion.userId)),
  head: () => ({
    meta: [
      { title: "Mis órdenes · Andinas Search" }, { property: "og:title", content: "Mis órdenes · Andinas Search" }, { property: "og:description", content: "Órdenes de trabajo asignadas al técnico." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Órdenes de trabajo asignadas al técnico." },
    ],
  }),
  component: MisOrdenes,
});

const COLOR_ORDEN: Record<string, string> = {
  asignada: "bg-estado-mantenimiento text-foreground",
  en_progreso: "bg-primary text-primary-foreground",
  completada: "bg-estado-operativa text-primary-foreground",
};

function MisOrdenes() {
  const { sesion } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const query = ordenesQuery(sesion.userId);
  const { data: ordenes } = useSuspenseQuery(query);

  useEffect(() => {
    limpiarOrdenesNuevas();
  }, [ordenes]);

  useEffect(() => {
    const canal = supabase
      .channel(`mis-ordenes-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_orders", filter: `tecnico_id=eq.${sesion.userId}` },
        () => queryClient.invalidateQueries({ queryKey: ["mis-ordenes", sesion.userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [queryClient, sesion.userId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/tecnico" aria-label="Volver al inicio">
            <ArrowLeft className="size-7" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Mis órdenes</h1>
      </div>

      {ordenes.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-border p-8 text-center text-xl text-muted-foreground">
          No tienes órdenes pendientes.
        </p>
      ) : (
        <ul className="space-y-4">
          {ordenes.map((o) => (
            <li key={o.id}>
              <Link
                to="/orden/$id"
                params={{ id: o.id }}
                className="block space-y-3 rounded-2xl border-2 bg-card p-5 hover:border-primary"
              >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold tracking-wide text-muted-foreground">
                    {o.machines?.codigo}
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">{o.machines?.nombre}</h2>
                  {o.machines?.ubicacion && (
                    <p className="mt-1 flex items-center gap-1 text-lg text-muted-foreground">
                      <MapPin className="size-5 shrink-0" /> {o.machines.ubicacion}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-4 py-2 text-lg font-bold",
                    COLOR_ORDEN[o.estado] ?? "bg-muted text-foreground",
                  )}
                >
                  {TEXTO_ORDEN[o.estado] ?? o.estado}
                </span>
              </div>
              <p className="text-xl text-foreground">
                <span className="font-bold">Falla: </span>
                {TEXTO_TIPO[o.anomaly_reports?.tipo ?? ""] ?? o.anomaly_reports?.tipo}
              </p>
              {o.anomaly_reports?.descripcion && (
                <p className="text-lg text-foreground">{o.anomaly_reports.descripcion}</p>
              )}
              <p className="text-base text-muted-foreground">
                Hora:{" "}
                {new Date(o.creado_en).toLocaleString("es-CL", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className="flex items-center justify-end gap-1 text-lg font-bold text-primary">
                Ver detalle <ChevronRight className="size-6" />
              </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
