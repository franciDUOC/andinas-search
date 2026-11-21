import { describe, expect, it, vi } from "vitest";

const { filas, filtros } = vi.hoisted(() => ({
  filas: [
    { id: "activa", tecnico_id: "tecnico-a", estado: "asignada" },
    { id: "iniciada", tecnico_id: "tecnico-a", estado: "en_progreso" },
    { id: "terminada", tecnico_id: "tecnico-a", estado: "completada", causa_falla: "Rodamiento desgastado" },
    { id: "otro-tecnico", tecnico_id: "tecnico-b", estado: "asignada" },
  ],
  filtros: [] as { campo: string; valores: string[] }[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      filtros.length = 0;
      const consulta = {
        select: () => consulta,
        eq: (campo: string, valor: string) => { filtros.push({ campo, valores: [valor] }); return consulta; },
        in: (campo: string, valores: string[]) => { filtros.push({ campo, valores }); return consulta; },
        order: async () => ({
          data: filas.filter((fila) => filtros.every((filtro) => filtro.valores.includes(fila[filtro.campo as keyof typeof fila] ?? ""))),
          error: null,
        }),
      };
      return consulta;
    },
  },
}));

import { ordenesQuery, registroOrdenesQuery } from "@/lib/ordenes";
import { exigirRol } from "@/lib/guard";

describe("Registro de órdenes completadas", () => {
  it("el técnico ve sus órdenes asignadas y en progreso, nunca las completadas ni las de otro técnico", async () => {
    const queryFn = ordenesQuery("tecnico-a").queryFn;
    if (typeof queryFn !== "function") throw new Error("Falta consulta de órdenes");
    const resultado = await queryFn({} as Parameters<typeof queryFn>[0]);
    expect(resultado.map((o) => o.id)).toEqual(["activa", "iniciada"]);
    expect(filtros).toContainEqual({ campo: "estado", valores: ["asignada", "en_progreso"] });
  });

  it("el registro conserva la orden completada y su causa, excluyendo las activas", async () => {
    const queryFn = registroOrdenesQuery.queryFn;
    if (typeof queryFn !== "function") throw new Error("Falta consulta del registro");
    const resultado = await queryFn({} as Parameters<typeof queryFn>[0]);
    expect(resultado).toEqual([expect.objectContaining({ id: "terminada", causa_falla: "Rodamiento desgastado" })]);
    expect(filas).toHaveLength(4);
  });

  it("solo el supervisor puede acceder a la pantalla del registro", () => {
    expect(() => exigirRol({ userId: "s", email: "", nombre: "Supervisor", rol: "supervisor" }, "supervisor")).not.toThrow();
    for (const rol of ["tecnico", "operario", "bodega"] as const) {
      expect(() => exigirRol({ userId: "u", email: "", nombre: "Usuario", rol }, "supervisor")).toThrow();
    }
  });
});