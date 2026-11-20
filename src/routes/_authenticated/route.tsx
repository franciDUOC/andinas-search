import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sumarOrdenNueva, useOrdenesNuevas } from "@/lib/avisos";
import { cargarSesion } from "@/lib/session";
import { EncabezadoApp } from "@/components/EncabezadoApp";
import { cn } from "@/lib/utils";
import type { Rol } from "@/lib/roles";

// Supervisor y bodega usan PC/tablet: pantallas más anchas.
const ANCHO_AMPLIO: Rol[] = ["supervisor", "bodega"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const sesion = await cargarSesion();
    if (!sesion) throw redirect({ to: "/auth" });
    return { sesion };
  },
  component: Layout,
});

function Layout() {
  const { sesion } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const nuevas = useOrdenesNuevas();
  const esTecnico = sesion.rol === "tecnico";

  useEffect(() => {
    if (!esTecnico) return;
    const canal = supabase
      .channel(`avisos-tecnico-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_orders", filter: `tecnico_id=eq.${sesion.userId}` },
        () => {
          sumarOrdenNueva();
          queryClient.invalidateQueries({ queryKey: ["mis-ordenes", sesion.userId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [esTecnico, queryClient, sesion.userId]);

  return (
    <div className="min-h-screen bg-background">
      <EncabezadoApp sesion={sesion} amplio={ANCHO_AMPLIO.includes(sesion.rol)} />
      {esTecnico && nuevas > 0 && (
        <Link
          to="/mis-ordenes"
          className="flex min-h-14 items-center justify-center gap-3 bg-destructive px-4 py-3 text-xl font-bold text-destructive-foreground"
        >
          <BellRing className="size-7 shrink-0" />
          {nuevas === 1 ? "Tienes una orden nueva asignada" : `Tienes ${nuevas} órdenes nuevas asignadas`} · Ver
        </Link>
      )}
      <main className={cn("mx-auto w-full px-4 py-6", ANCHO_AMPLIO.includes(sesion.rol) ? "max-w-6xl" : "max-w-3xl")}>
        <Outlet />
      </main>
    </div>
  );
}
