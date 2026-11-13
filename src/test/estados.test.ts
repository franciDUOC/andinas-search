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
