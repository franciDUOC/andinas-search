export type Rol = "operario" | "tecnico" | "supervisor" | "bodega";

export const INICIO_POR_ROL = {
  operario: "/operario",
  tecnico: "/tecnico",
  supervisor: "/supervisor",
  bodega: "/bodega",
} as const satisfies Record<Rol, string>;

export const NOMBRE_ROL: Record<Rol, string> = {
  operario: "Operario",
  tecnico: "Técnico",
  supervisor: "Supervisor",
  bodega: "Bodega",
};
