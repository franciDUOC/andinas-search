import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, MapPin, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { exigirRol } from "@/lib/guard";
import { TEXTO_ORDEN, TEXTO_TIPO } from "@/lib/estados";
import { cn } from "@/lib/utils";

const ordenQuery = (id: string) =>
  queryOptions({
    queryKey: ["orden", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(
          "id,estado,creado_en,completado_en,causa_falla,machines(codigo,nombre,ubicacion),anomaly_reports(tipo,descripcion)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_authenticated/orden/$id")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(ordenQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Detalle de orden · Andinas Search" }, { property: "og:title", content: "Detalle de orden · Andinas Search" }, { property: "og:description", content: "Detalle de la orden de trabajo del técnico." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Detalle de la orden de trabajo del técnico." },
    ],
  }),
  component: DetalleOrden,
});

const fecha = (v: string) =>
  new Date(v).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

function DetalleOrden() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { sesion } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: o } = useSuspenseQuery(ordenQuery(id));
  const [terminando, setTerminando] = useState(false);
  const [causa, setCausa] = useState("");
  const [faltaCausa, setFaltaCausa] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function refrescar() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["orden", id] }),
      queryClient.invalidateQueries({ queryKey: ["mis-ordenes", sesion.userId] }),
    ]);
  }

  async function iniciar() {
    setEnviando(true);
    setError("");
    const { error } = await supabase.rpc("iniciar_orden", { _orden_id: id });
    setEnviando(false);
    if (error) return setError("No se pudo iniciar la orden. Intenta de nuevo.");
    await refrescar();
  }

  async function terminar() {
    if (!causa.trim()) return setFaltaCausa(true);
    setEnviando(true);
    setError("");
    const { error } = await supabase.rpc("terminar_orden", { _orden_id: id, _causa: causa });
    setEnviando(false);
    if (error) return setError("No se pudo terminar la orden. Intenta de nuevo.");
    setTerminando(false);
    await refrescar();
    await queryClient.invalidateQueries({ queryKey: ["registro-ordenes"] });
    await navigate({ to: "/mis-ordenes", replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/mis-ordenes" aria-label="Volver a mis órdenes">
            <ArrowLeft className="size-7" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Detalle de orden</h1>
      </div>

      {!o ? (
        <p className="rounded-xl border-2 border-dashed p-8 text-center text-xl text-muted-foreground">
          No se encontró la orden.
        </p>
      ) : (
        <div className="space-y-5 rounded-2xl border-2 bg-card p-5">
          <div>
            <p className="text-base font-bold tracking-wide text-muted-foreground">{o.machines?.codigo}</p>
            <h2 className="text-2xl font-bold text-foreground">{o.machines?.nombre}</h2>
            {o.machines?.ubicacion && (
              <p className="mt-1 flex items-center gap-1 text-lg text-muted-foreground">
                <MapPin className="size-5 shrink-0" /> {o.machines.ubicacion}
              </p>
            )}
          </div>
          <p className="text-xl">
            <span className="font-bold">Estado: </span>
            {TEXTO_ORDEN[o.estado] ?? o.estado}
          </p>
          <p className="text-xl">
            <span className="font-bold">Falla: </span>
            {TEXTO_TIPO[o.anomaly_reports?.tipo ?? ""] ?? o.anomaly_reports?.tipo}
          </p>
          {o.anomaly_reports?.descripcion && <p className="text-lg">{o.anomaly_reports.descripcion}</p>}
          <p className="text-lg text-muted-foreground">Asignada: {fecha(o.creado_en)}</p>

          {o.estado === "completada" && (
            <div className="space-y-2 rounded-xl bg-estado-operativa p-4 text-primary-foreground">
              <p className="flex items-center gap-2 text-xl font-bold">
                <CheckCircle2 className="size-7" /> Orden completada
              </p>
              {o.completado_en && <p className="text-lg">Terminada: {fecha(o.completado_en)}</p>}
              <p className="text-lg">Causa: {o.causa_falla}</p>
            </div>
          )}

          {error && <p className="text-lg font-bold text-destructive">{error}</p>}

          {o.estado === "asignada" && (
            <Button size="lg" className="h-16 w-full text-xl" onClick={iniciar} disabled={enviando}>
              <Play /> Iniciar
            </Button>
          )}

          {o.estado === "en_progreso" && !terminando && (
            <Button size="lg" className="h-16 w-full text-xl" onClick={() => setTerminando(true)}>
              <CheckCircle2 /> Terminar
            </Button>
          )}

          {o.estado === "en_progreso" && terminando && (
            <div className="space-y-3">
              <label htmlFor="causa" className="block text-xl font-bold">
                Causa de la falla
              </label>
              <Textarea
                id="causa"
                value={causa}
                onChange={(e) => {
                  setCausa(e.target.value);
                  if (e.target.value.trim()) setFaltaCausa(false);
                }}
                rows={4}
                className={cn("text-lg", faltaCausa && "border-2 border-destructive")}
                placeholder="Ej.: rodamiento desgastado, se reemplazó"
              />
              {faltaCausa && <p className="text-lg font-bold text-destructive">Escribe la causa de la falla.</p>}
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="h-16 flex-1 text-xl" onClick={() => setTerminando(false)}>
                  Cancelar
                </Button>
                <Button size="lg" className="h-16 flex-1 text-xl" onClick={terminar} disabled={enviando}>
                  Confirmar término
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
