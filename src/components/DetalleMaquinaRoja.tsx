import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ESTADO_PENDIENTE,
  ESTADOS_ORDEN_ACTIVA,
  TEXTO_TIPO,
  contarOrdenesActivas,
  disponibilidad,
} from "@/lib/estados";
import { cn } from "@/lib/utils";

type Maquina = { id: string; codigo: string; nombre: string };
type Reporte = {
  id: string;
  tipo: string;
  descripcion: string | null;
  creado_en: string;
  reportante: { nombre_completo: string } | null;
};
type Tecnico = { id: string; nombre: string; activas: number };

async function cargarReporte(maquinaId: string): Promise<Reporte | null> {
  const { data } = await supabase
    .from("anomaly_reports")
    .select("id,tipo,descripcion,creado_en,reportante:profiles!anomaly_reports_reportado_por_fkey(nombre_completo)")
    .eq("machine_id", maquinaId)
    .eq("estado", ESTADO_PENDIENTE)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Reporte | null) ?? null;
}

async function cargarTecnicos(): Promise<Tecnico[]> {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "tecnico");
  const ids = (roles ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const [{ data: perfiles }, { data: ordenes }] = await Promise.all([
    supabase.from("profiles").select("id,nombre_completo").in("id", ids),
    supabase
      .from("work_orders")
      .select("tecnico_id,estado")
      .in("tecnico_id", ids)
      .in("estado", [...ESTADOS_ORDEN_ACTIVA]),
  ]);
  const activas = contarOrdenesActivas(ordenes ?? []);
  return ids
    .map((id) => ({
      id,
      nombre: perfiles?.find((p) => p.id === id)?.nombre_completo || "Técnico sin nombre",
      activas: activas[id] ?? 0,
    }))
    .sort((a, b) => a.activas - b.activas || a.nombre.localeCompare(b.nombre));
}

export function DetalleMaquinaRoja({ maquina, onClose }: { maquina: Maquina | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reporte, setReporte] = useState<Reporte | null | undefined>(undefined);
  const [tecnicos, setTecnicos] = useState<Tecnico[] | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);
  const [faltaTecnico, setFaltaTecnico] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asignado, setAsignado] = useState<string | null>(null);

  useEffect(() => {
    setReporte(undefined);
    setTecnicos(null);
    setEligiendo(false);
    setTecnicoId(null);
    setFaltaTecnico(false);
    setError(null);
    setAsignado(null);
    if (maquina) cargarReporte(maquina.id).then(setReporte);
  }, [maquina]);

  async function abrirTecnicos() {
    setEligiendo(true);
    setTecnicos(await cargarTecnicos());
  }

  async function confirmar() {
    if (!reporte) return;
    if (!tecnicoId) return setFaltaTecnico(true);
    setGuardando(true);
    setError(null);
    const { error } = await supabase.rpc("asignar_tecnico", {
      _reporte_id: reporte.id,
      _tecnico_id: tecnicoId,
    });
    setGuardando(false);
    if (error) return setError("No se pudo asignar el técnico. Intenta de nuevo.");
    setAsignado(tecnicos?.find((t) => t.id === tecnicoId)?.nombre ?? "el técnico");
    queryClient.invalidateQueries({ queryKey: ["panel"] });
  }

  return (
    <Dialog open={!!maquina} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="text-2xl font-bold">
            {maquina?.codigo} · {maquina?.nombre}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {eligiendo ? "Elige el técnico que atenderá la falla." : "Reporte de anomalía"}
          </DialogDescription>
        </DialogHeader>

        {asignado ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-estado-operativa p-6 text-center text-primary-foreground">
            <CheckCircle2 className="size-14" />
            <p className="text-2xl font-bold">Técnico asignado</p>
            <p className="text-lg">La orden quedó asignada a {asignado}. La máquina pasa a En Mantenimiento.</p>
            <Button variant="secondary" size="lg" className="w-full" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : reporte === undefined ? (
          <p className="py-6 text-center text-lg text-muted-foreground">Cargando reporte…</p>
        ) : reporte === null ? (
          <p className="rounded-xl border-2 border-dashed border-border p-6 text-center text-lg text-muted-foreground">
            Esta máquina no tiene reportes pendientes de revisión.
          </p>
        ) : !eligiendo ? (
          <div className="space-y-4">
            <dl className="space-y-3 rounded-xl border-2 border-estado-detenida bg-card p-4 text-lg">
              <div>
                <dt className="text-base text-muted-foreground">Tipo</dt>
                <dd className="text-2xl font-bold">{TEXTO_TIPO[reporte.tipo] ?? reporte.tipo}</dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">Descripción</dt>
                <dd>{reporte.descripcion || "Sin descripción"}</dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">Reportado por</dt>
                <dd>{reporte.reportante?.nombre_completo || "Operario"}</dd>
              </div>
              <div>
                <dt className="text-base text-muted-foreground">Fecha</dt>
                <dd>{new Date(reporte.creado_en).toLocaleString("es-CL")}</dd>
              </div>
            </dl>
            <Button size="lg" className="w-full" onClick={abrirTecnicos}>
              <UserCog /> Asignar técnico
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tecnicos === null ? (
              <p className="py-6 text-center text-lg text-muted-foreground">Cargando técnicos…</p>
            ) : tecnicos.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-border p-6 text-center text-lg text-muted-foreground">
                No hay técnicos registrados.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Técnicos"
                className={cn("space-y-3 rounded-xl", faltaTecnico && "ring-4 ring-destructive ring-offset-2")}
              >
                {tecnicos.map((t) => {
                  const estado = disponibilidad(t.activas);
                  const elegido = tecnicoId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={elegido}
                      onClick={() => {
                        setTecnicoId(t.id);
                        setFaltaTecnico(false);
                      }}
                      className={cn(
                        "flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                        elegido ? "border-primary bg-secondary" : "border-border bg-card hover:bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xl font-bold">{t.nombre}</span>
                        <span className="text-base text-muted-foreground">
                          {t.activas} {t.activas === 1 ? "orden activa" : "órdenes activas"}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-base font-bold",
                          estado === "Disponible"
                            ? "bg-estado-operativa text-primary-foreground"
                            : "bg-estado-mantenimiento text-foreground",
                        )}
                      >
                        {estado}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {faltaTecnico && <p className="text-lg font-bold text-destructive">Elige un técnico para continuar.</p>}
            {error && <p className="text-lg font-bold text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" onClick={() => setEligiendo(false)} disabled={guardando}>
                Volver
              </Button>
              <Button size="lg" onClick={confirmar} disabled={guardando || !tecnicos?.length}>
                {guardando ? "Asignando…" : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
