import { describe, expect, it } from "vitest";
import { contarPorFiltro, filtrarMaquinas, TEXTO_ESTADO } from "@/lib/estados";

const maquinas = [
  { id: "1", estado: "verde" },
  { id: "2", estado: "rojo" },
  { id: "3", estado: "amarillo" },
  { id: "4", estado: "rojo" },
];

describe("Panel de máquinas", () => {
  it("cuenta máquinas por filtro", () => {
    expect(contarPorFiltro(maquinas)).toEqual({ todas: 4, verde: 1, amarillo: 1, rojo: 2 });
  });

  it("filtra Detenidas solo con máquinas en rojo", () => {
    expect(filtrarMaquinas(maquinas, "rojo").map((m) => m.id)).toEqual(["2", "4"]);
  });

  it("Todas muestra todas las máquinas", () => {
    expect(filtrarMaquinas(maquinas, "todas")).toHaveLength(4);
  });

  it("verde es Operativa, amarillo En Mantenimiento, rojo Detenida por falla", () => {
    expect(TEXTO_ESTADO).toEqual({
      verde: "Operativa",
      amarillo: "En Mantenimiento",
      rojo: "Detenida por falla",
    });
  });
});

import { contarOrdenesActivas, disponibilidad } from "@/lib/estados";

describe("Asignar técnico", () => {
  it("técnico con 0 órdenes activas está Disponible", () => {
    expect(disponibilidad(0)).toBe("Disponible");
  });

  it("técnico con 1 o más órdenes activas está Ocupado", () => {
    expect(disponibilidad(1)).toBe("Ocupado");
  });

  it("solo cuenta órdenes asignadas o en progreso, no completadas", () => {
    expect(
      contarOrdenesActivas([
        { tecnico_id: "a", estado: "asignada" },
        { tecnico_id: "a", estado: "en_progreso" },
        { tecnico_id: "a", estado: "completada" },
        { tecnico_id: "b", estado: "completada" },
      ]),
    ).toEqual({ a: 2 });
  });
});
