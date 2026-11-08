import { redirect } from "@tanstack/react-router";
import { INICIO_POR_ROL, type Rol } from "./roles";
import type { Sesion } from "./session";

/** Si el usuario no tiene el rol requerido, lo envía a su propio inicio. */
export function exigirRol(sesion: Sesion, rol: Rol) {
  if (sesion.rol !== rol) throw redirect({ to: INICIO_POR_ROL[sesion.rol] });
}
