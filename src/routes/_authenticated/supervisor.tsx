import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exigirRol } from "@/lib/guard";
import {
  ESTADO_PENDIENTE,
  FILTROS,
  TEXTO_ESTADO,
  contarPorFiltro,
  estadoDe,
  filtrarMaquinas,
  type EstadoMaquina,
  type Filtro,
} from "@/lib/estados";
import { cn } from "@/lib/utils";
import { DetalleMaquinaRoja } from "@/components/DetalleMaquinaRoja";

const maquinasQuery = queryOptions({
  queryKey: ["panel", "maquinas"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("machines")
      .select("id,codigo,nombre,ubicacion,estado")
      .order("codigo");
    if (error) throw error;
    return data;
  },
});

const pendientesQuery = queryOptions({
  queryKey: ["panel", "pendientes"],
  queryFn: async () => {
    const { count, error } = await supabase
      .from("anomaly_reports")
      .select("id", { count: "exact", head: true })
      .eq("estado", ESTADO_PENDIENTE);
    if (error) throw error;
    return count ?? 0;
  },
});

export const Route = createFileRoute("/_authenticated/supervisor")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "supervisor"),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(maquinasQuery),
      context.queryClient.ensureQueryData(pendientesQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Panel de máquinas · Andinas Search" },
      { name: "description", content: "Estado en tiempo real de las máquinas de la planta." },
    ],
  }),
  component: PanelMaquinas,
});

const COLOR_ESTADO: Record<EstadoMaquina, string> = {
  verde: "bg-estado-operativa text-primary-foreground",
  amarillo: "bg-estado-mantenimiento text-foreground",
  rojo: "bg-estado-detenida text-primary-foreground",
};

const BORDE_ESTADO: Record<EstadoMaquina, string> = {
  verde: "border-estado-operativa",
  amarillo: "border-estado-mantenimiento",
  rojo: "border-estado-detenida",
};

function PanelMaquinas() {
  const queryClient = useQueryClient();
  const { data: maquinas } = useSuspenseQuery(maquinasQuery);
  const { data: pendientes } = useSuspenseQuery(pendientesQuery);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [seleccionada, setSeleccionada] = useState<(typeof maquinas)[number] | null>(null);

  useEffect(() => {
    const canal = supabase
      .channel(`panel-maquinas-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "machines" }, () =>
        queryClient.invalidateQueries({ queryKey: maquinasQuery.queryKey }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "anomaly_reports" }, () => {
        queryClient.invalidateQueries({ queryKey: pendientesQuery.queryKey });
        queryClient.invalidateQueries({ queryKey: maquinasQuery.queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [queryClient]);

  const contadores = contarPorFiltro(maquinas);
  const visibles = filtrarMaquinas(maquinas, filtro);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Panel de máquinas</h1>
        <div
          role="status"
          aria-label={`${pendientes} anomalías pendientes de revisión`}
          title="Anomalías pendientes de revisión"
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card"
        >
          <Bell className="size-7 text-foreground" />
          {pendientes > 0 && (
            <span className="absolute -right-2 -top-2 flex min-h-8 min-w-8 items-center justify-center rounded-full bg-estado-detenida px-2 text-base font-bold text-primary-foreground">
              {pendientes}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FILTROS.map((f) => {
          const activo = filtro === f.valor;
          return (
            <button
              key={f.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.valor)}
              className={cn(
                "flex min-h-14 items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left text-lg font-bold transition-colors",
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-base",
                  activo ? "bg-primary-foreground text-primary" : "bg-muted text-foreground",
                )}
              >
                {contadores[f.valor]}
              </span>
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-border p-8 text-center text-xl text-muted-foreground">
          {maquinas.length === 0
            ? "Aún no hay máquinas registradas."
            : "No hay máquinas en este estado."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((m) => {
            const estado = estadoDe(m.estado);
            return (
              <li key={m.id} className="flex">
                <Tarjeta
                  onClick={estado === "rojo" ? () => setSeleccionada(m) : undefined}
                  className={cn(
                    "flex w-full flex-col gap-4 rounded-2xl border-2 border-l-8 bg-card p-5 text-left",
                    BORDE_ESTADO[estado],
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-base font-bold tracking-wide text-muted-foreground">
                      {m.codigo}
                    </p>
                    <h2 className="text-2xl font-bold text-foreground">{m.nombre}</h2>
                    {m.ubicacion && (
                      <p className="mt-1 flex items-center gap-1 text-lg text-muted-foreground">
                        <MapPin className="size-5 shrink-0" /> {m.ubicacion}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "mt-auto flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-xl font-bold",
                      COLOR_ESTADO[estado],
                    )}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full border-2 border-current"
                      aria-hidden
                    />
                    {TEXTO_ESTADO[estado]}
                  </div>
                  {estado === "rojo" && (
                    <span className="text-lg font-bold text-estado-detenida underline underline-offset-4">
                      Ver reporte y asignar técnico
                    </span>
                  )}
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}

      <DetalleMaquinaRoja maquina={seleccionada} onClose={() => setSeleccionada(null)} />
    </div>
  );
}

/** Las máquinas en rojo se pueden tocar para ver su reporte; las demás son solo informativas. */
function Tarjeta({
  onClick,
  className,
  children,
}: {
  onClick?: (() => void) | undefined;
  className: string;
  children: ReactNode;
}) {
  if (!onClick) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
      )}
    >
      {children}
    </button>
  );
}
