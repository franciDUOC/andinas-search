import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS_ORDEN_ACTIVA } from "@/lib/estados";

export const ordenesQuery = (tecnicoId: string) =>
  queryOptions({
    queryKey: ["mis-ordenes", tecnicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("id,estado,creado_en,machines(codigo,nombre,ubicacion),anomaly_reports(tipo,descripcion)")
        .eq("tecnico_id", tecnicoId)
        .in("estado", [...ESTADOS_ORDEN_ACTIVA])
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const registroOrdenesQuery = queryOptions({
  queryKey: ["registro-ordenes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("work_orders")
      .select("id,creado_en,completado_en,causa_falla,machines(codigo,nombre,ubicacion),anomaly_reports(tipo,descripcion),profiles!work_orders_tecnico_id_fkey(nombre_completo)")
      .eq("estado", "completada")
      .order("completado_en", { ascending: false });
    if (error) throw error;
    return data;
  },
});