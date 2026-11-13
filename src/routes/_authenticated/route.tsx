import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
  return (
    <div className="min-h-screen bg-background">
      <EncabezadoApp sesion={sesion} amplio={ANCHO_AMPLIO.includes(sesion.rol)} />
      <main className={cn("mx-auto w-full px-4 py-6", ANCHO_AMPLIO.includes(sesion.rol) ? "max-w-6xl" : "max-w-3xl")}>
        <Outlet />
      </main>
    </div>
  );
}
