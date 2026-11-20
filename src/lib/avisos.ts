import { useSyncExternalStore } from "react";

// Cantidad de órdenes nuevas que el técnico aún no ha visto.
let nuevas = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

export function sumarOrdenNueva() {
  nuevas++;
  avisar();
}
export function limpiarOrdenesNuevas() {
  if (nuevas === 0) return;
  nuevas = 0;
  avisar();
}
export function useOrdenesNuevas() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => nuevas,
    () => 0,
  );
}
