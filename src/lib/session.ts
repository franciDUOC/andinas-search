import { supabase } from "@/integrations/supabase/client";
import type { Rol } from "./roles";

export interface Sesion {
  userId: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export async function cargarSesion(): Promise<Sesion | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [{ data: roles }, { data: perfil }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("nombre_completo").eq("id", user.id).maybeSingle(),
  ]);
  const rol = (roles?.[0]?.role ?? "operario") as Rol;
  return {
    userId: user.id,
    email: user.email ?? "",
    nombre: perfil?.nombre_completo || user.email || "",
    rol,
  };
}
