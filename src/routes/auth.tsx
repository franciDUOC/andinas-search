import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cargarSesion } from "@/lib/session";
import { INICIO_POR_ROL } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Iniciar sesión · Andinas Search" },
      { name: "description", content: "Ingreso al sistema de mantenimiento Andinas Search." },
      { property: "og:title", content: "Iniciar sesión · Andinas Search" },
      { property: "og:description", content: "Ingreso al sistema de mantenimiento Andinas Search." },
    ],
  }),
  beforeLoad: async () => {
    const sesion = await cargarSesion();
    if (sesion) throw redirect({ to: INICIO_POR_ROL[sesion.rol] });
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    const sesion = await cargarSesion();
    navigate({ to: sesion ? INICIO_POR_ROL[sesion.rol] : "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form onSubmit={entrar} className="w-full max-w-md space-y-6 rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wrench className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Andinas Search</h1>
          <p className="text-lg text-muted-foreground">Manufacturas Andina</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg">Correo</Label>
          <Input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className="h-14 text-lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-lg">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className="h-14 text-lg" />
        </div>
        {error && <p role="alert" className="text-lg font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={cargando}>
          {cargando ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}
