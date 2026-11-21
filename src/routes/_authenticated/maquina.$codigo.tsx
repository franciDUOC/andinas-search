import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, History, MapPin, QrCode, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { exigirRol } from "@/lib/guard";
import { estadoDe, TEXTO_ESTADO, type EstadoMaquina } from "@/lib/estados";
import { cn } from "@/lib/utils";

export const maquinaQuery = (codigo: string) =>
  queryOptions({
    queryKey: ["maquina", codigo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id,codigo,nombre,ubicacion,estado,manual_url")
        .eq("codigo", codigo)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_authenticated/maquina/$codigo")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(maquinaQuery(params.codigo)),
  head: () => ({
    meta: [
      { title: "Ficha de máquina · Andinas Search" }, { property: "og:title", content: "Ficha de máquina · Andinas Search" }, { property: "og:description", content: "Ficha de la máquina escaneada." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Ficha de la máquina escaneada." },
    ],
  }),
  component: Ficha,
});

const COLOR: Record<EstadoMaquina, string> = {
  verde: "bg-estado-operativa text-primary-foreground",
  amarillo: "bg-estado-mantenimiento text-foreground",
  rojo: "bg-estado-detenida text-primary-foreground",
};

function Ficha() {
  const { codigo } = Route.useParams();
  const { data: m } = useSuspenseQuery(maquinaQuery(codigo));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/escanear" aria-label="Volver a escanear">
            <ArrowLeft className="size-7" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Ficha de máquina</h1>
      </div>

      {!m ? (
        <div className="space-y-4 rounded-2xl border-2 border-destructive bg-card p-6 text-center">
          <SearchX className="mx-auto size-14 text-destructive" />
          <p className="text-2xl font-bold text-foreground">No existe ninguna máquina con el código "{codigo}"</p>
          <p className="text-lg text-muted-foreground">Revisa el código o vuelve a escanear el QR.</p>
          <Button asChild size="lg" className="h-16 w-full text-xl">
            <Link to="/escanear">
              <QrCode /> Volver a escanear
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border-2 bg-card p-5">
          <div>
            <p className="text-lg font-bold tracking-wide text-muted-foreground">{m.codigo}</p>
            <h2 className="text-3xl font-bold text-foreground">{m.nombre}</h2>
            {m.ubicacion && (
              <p className="mt-1 flex items-center gap-1 text-xl text-muted-foreground">
                <MapPin className="size-6 shrink-0" /> {m.ubicacion}
              </p>
            )}
          </div>
          <p className={cn("rounded-xl px-4 py-4 text-center text-2xl font-bold", COLOR[estadoDe(m.estado)])}>
            {TEXTO_ESTADO[estadoDe(m.estado)]}
          </p>
          <Button asChild size="tile">
            <Link to="/maquina/$codigo/historial" params={{ codigo: m.codigo }}>
              <History /> Ver historial
            </Link>
          </Button>
          {m.manual_url ? (
            <Button asChild size="tile" variant="secondary">
              <a href={m.manual_url} target="_blank" rel="noopener noreferrer">
                <BookOpen /> Ver manual
              </a>
            </Button>
          ) : (
            <Button size="tile" variant="secondary" disabled>
              <BookOpen /> Ver manual (no disponible)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
