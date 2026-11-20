import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";
import { TEXTO_ORDEN, TEXTO_TIPO } from "@/lib/estados";
import { maquinaQuery } from "./maquina.$codigo";

const historialQuery = (machineId: string) =>
  queryOptions({
    queryKey: ["historial", machineId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("historial_maquina", { _machine_id: machineId });
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_authenticated/maquina/$codigo_/historial")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  loader: async ({ context, params }) => {
    const m = await context.queryClient.ensureQueryData(maquinaQuery(params.codigo));
    if (m) await context.queryClient.ensureQueryData(historialQuery(m.id));
  },
  head: () => ({
    meta: [
      { title: "Historial de máquina · Andinas Search" },
      { name: "description", content: "Intervenciones registradas de la máquina." },
    ],
  }),
  component: Historial,
});

const fecha = (v: string) => new Date(v).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

function Historial() {
  const { codigo } = Route.useParams();
  const { data: m } = useSuspenseQuery(maquinaQuery(codigo));
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/maquina/$codigo" params={{ codigo }} aria-label="Volver a la ficha">
            <ArrowLeft className="size-7" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">Historial</h1>
          <p className="text-lg text-muted-foreground">{m ? `${m.codigo} · ${m.nombre}` : codigo}</p>
        </div>
      </div>
      {m ? <Lista machineId={m.id} /> : <Vacio texto="No existe esa máquina." />}
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border-2 border-dashed p-8 text-center text-xl text-muted-foreground">{texto}</p>
  );
}

function Lista({ machineId }: { machineId: string }) {
  const { data } = useSuspenseQuery(historialQuery(machineId));
  if (data.length === 0) return <Vacio texto="Sin intervenciones registradas" />;
  return (
    <ol className="space-y-4">
      {data.map((o) => (
        <li key={o.id} className="space-y-2 rounded-2xl border-2 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-bold text-foreground">{fecha(o.creado_en)}</p>
            <span className="rounded-full bg-muted px-3 py-1 text-base font-bold">
              {TEXTO_ORDEN[o.estado] ?? o.estado}
            </span>
          </div>
          <p className="text-lg"><span className="font-bold">Falla: </span>{TEXTO_TIPO[o.tipo] ?? o.tipo}</p>
          <p className="text-lg"><span className="font-bold">Técnico: </span>{o.tecnico}</p>
          <p className="text-lg"><span className="font-bold">Causa: </span>{o.causa_falla ?? "Aún sin registrar"}</p>
          {o.completado_en && <p className="text-base text-muted-foreground">Terminada: {fecha(o.completado_en)}</p>}
        </li>
      ))}
    </ol>
  );
}
