import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NOMBRE_ROL } from "@/lib/roles";
import type { Sesion } from "@/lib/session";

export function EncabezadoApp({ sesion }: { sesion: Sesion }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">{sesion.nombre}</p>
          <p className="text-base text-muted-foreground">{NOMBRE_ROL[sesion.rol]}</p>
        </div>
        <Button variant="outline" size="sm" onClick={cerrarSesion}>
          <LogOut /> Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
