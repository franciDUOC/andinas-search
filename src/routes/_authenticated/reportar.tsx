import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Droplets, HelpCircle, Search, Volume2, Activity, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { exigirRol } from "@/lib/guard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reportar")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "operario"),
  head: () => ({ meta: [{ title: "Reportar anomalía · Andinas Search" }] }),
  component: Reportar,
});

type Maquina = { id: string; codigo: string; nombre: string; ubicacion: string };

const TIPOS = [
  { valor: "ruido", label: "Ruido", Icono: Volume2 },
  { valor: "vibracion", label: "Vibración", Icono: Activity },
  { valor: "fuga", label: "Fuga", Icono: Droplets },
  { valor: "otra", label: "Otra", Icono: HelpCircle },
] as const;

function Reportar() {
  const { sesion } = Route.useRouteContext();
  const [paso, setPaso] = useState(1);
  const [maquinas, setMaquinas] = useState<Maquina[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [maquinaId, setMaquinaId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [faltante, setFaltante] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    supabase
      .from("machines")
      .select("id,codigo,nombre,ubicacion")
      .order("codigo")
      .then(({ data }) => setMaquinas(data ?? []));
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (maquinas ?? []).filter(
      (m) => !q || m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q),
    );
  }, [maquinas, busqueda]);

  const maquina = maquinas?.find((m) => m.id === maquinaId);

  function siguiente() {
    if ((paso === 1 && !maquinaId) || (paso === 2 && !tipo)) return setFaltante(true);
    setFaltante(false);
    setPaso(paso + 1);
  }

  async function enviar() {
    if (!maquinaId || !tipo) return;
    setEnviando(true);
    setError(null);
    const { error } = await supabase.from("anomaly_reports").insert({
      machine_id: maquinaId,
      tipo,
      descripcion: descripcion.trim() || null,
      reportado_por: sesion.userId,
      estado: "Pendiente de revisión",
    });
    setEnviando(false);
    if (error) return setError("No se pudo enviar el reporte. Intenta de nuevo.");
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 rounded-2xl bg-estado-operativa p-8 text-center text-primary-foreground">
        <CheckCircle2 className="size-24" />
        <h1 className="text-4xl font-bold">Reporte enviado</h1>
        <p className="text-xl">
          {maquina?.codigo} · {maquina?.nombre} quedó marcada como detenida por falla.
        </p>
        <Button asChild size="lg" variant="secondary" className="w-full">
          <Link to="/operario">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-lg font-semibold">Paso {paso} de 3</p>
        <div className="flex gap-2" aria-label={`Paso ${paso} de 3`}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={cn("h-3 flex-1 rounded-full", n <= paso ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>

      {paso === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">¿Qué máquina?</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código"
              className="h-14 pl-12 text-xl"
            />
          </div>
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl p-1",
              faltante && "ring-4 ring-destructive",
            )}
          >
            {maquinas === null && <p className="text-lg">Cargando máquinas…</p>}
            {maquinas && filtradas.length === 0 && (
              <p className="text-lg text-muted-foreground">No hay máquinas que coincidan.</p>
            )}
            {filtradas.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMaquinaId(m.id);
                  setFaltante(false);
                }}
                className={cn(
                  "min-h-16 rounded-xl border-2 bg-card px-5 py-3 text-left",
                  maquinaId === m.id ? "border-primary bg-secondary" : "border-border",
                )}
              >
                <span className="block text-xl font-bold">{m.codigo} · {m.nombre}</span>
                {m.ubicacion && <span className="text-base text-muted-foreground">{m.ubicacion}</span>}
              </button>
            ))}
          </div>
          {faltante && <p className="text-lg font-semibold text-destructive">Elige una máquina para continuar.</p>}
        </section>
      )}

      {paso === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">¿Qué pasa?</h1>
          <div className={cn("grid grid-cols-2 gap-4 rounded-2xl p-1", faltante && "ring-4 ring-destructive")}>
            {TIPOS.map(({ valor, label, Icono }) => (
              <button
                key={valor}
                type="button"
                onClick={() => {
                  setTipo(valor);
                  setFaltante(false);
                }}
                className={cn(
                  "flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-4 bg-card text-2xl font-bold",
                  tipo === valor ? "border-primary bg-secondary" : "border-border",
                )}
              >
                <Icono className="size-12" />
                {label}
              </button>
            ))}
          </div>
          {faltante && <p className="text-lg font-semibold text-destructive">Elige el tipo de anomalía.</p>}
        </section>
      )}

      {paso === 3 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Descripción (opcional)</h1>
          <p className="text-lg text-muted-foreground">
            {maquina?.codigo} · {TIPOS.find((t) => t.valor === tipo)?.label}
          </p>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuenta brevemente lo que notaste"
            className="min-h-40 text-xl"
          />
          {error && <p className="text-lg font-semibold text-destructive">{error}</p>}
          <Button variant="alert" size="tile" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar Reporte"}
          </Button>
        </section>
      )}

      <div className="flex gap-3">
        {paso > 1 ? (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => { setFaltante(false); setPaso(paso - 1); }}>
            <ArrowLeft /> Atrás
          </Button>
        ) : (
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to="/operario"><ArrowLeft /> Cancelar</Link>
          </Button>
        )}
        {paso < 3 && (
          <Button size="lg" className="flex-1" onClick={siguiente}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
