import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { cargarSesion } from "@/lib/session";
import { EncabezadoApp } from "@/components/EncabezadoApp";

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
      <EncabezadoApp sesion={sesion} />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
