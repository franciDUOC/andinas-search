export type EstadoMaquina = "verde" | "amarillo" | "rojo";
export type Filtro = "todas" | EstadoMaquina;

export const TEXTO_ESTADO: Record<EstadoMaquina, string> = {
  verde: "Operativa",
  amarillo: "En Mantenimiento",
  rojo: "Detenida por falla",
};

export const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "verde", label: "Operativas" },
  { valor: "amarillo", label: "En mantenimiento" },
  { valor: "rojo", label: "Detenidas" },
];

export const ESTADO_PENDIENTE = "Pendiente de revisión";

/** Normaliza el estado guardado; cualquier valor desconocido se trata como verde. */
export function estadoDe(valor: string): EstadoMaquina {
  return valor === "amarillo" || valor === "rojo" ? valor : "verde";
}

export function contarPorFiltro(maquinas: { estado: string }[]): Record<Filtro, number> {
  const c: Record<Filtro, number> = { todas: maquinas.length, verde: 0, amarillo: 0, rojo: 0 };
  for (const m of maquinas) c[estadoDe(m.estado)]++;
  return c;
}

export function filtrarMaquinas<T extends { estado: string }>(maquinas: T[], filtro: Filtro): T[] {
  return filtro === "todas" ? maquinas : maquinas.filter((m) => estadoDe(m.estado) === filtro);
}

export const TEXTO_TIPO: Record<string, string> = {
  ruido: "Ruido",
  vibracion: "Vibración",
  fuga: "Fuga",
  otra: "Otra",
};

/** Órdenes que todavía ocupan al técnico. */
export const ESTADOS_ORDEN_ACTIVA = ["asignada", "en_progreso"] as const;

export function disponibilidad(ordenesActivas: number): "Disponible" | "Ocupado" {
  return ordenesActivas === 0 ? "Disponible" : "Ocupado";
}

export function contarOrdenesActivas(ordenes: { tecnico_id: string; estado: string }[]) {
  const c: Record<string, number> = {};
  for (const o of ordenes) {
    if ((ESTADOS_ORDEN_ACTIVA as readonly string[]).includes(o.estado)) {
      c[o.tecnico_id] = (c[o.tecnico_id] ?? 0) + 1;
    }
  }
  return c;
}

export const TEXTO_ORDEN: Record<string, string> = {
  asignada: "Asignada",
  en_progreso: "En progreso",
  completada: "Completada",
};
