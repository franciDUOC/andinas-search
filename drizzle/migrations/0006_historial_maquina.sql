create or replace function public.historial_maquina(_machine_id uuid)
returns table(id uuid, creado_en timestamptz, completado_en timestamptz, estado text, tipo text, tecnico text, causa_falla text)
language sql stable security definer set search_path = public as $$
  select w.id, w.creado_en, w.completado_en, w.estado, r.tipo,
         coalesce(nullif(p.nombre_completo, ''), 'Técnico sin nombre'), w.causa_falla
  from public.work_orders w
  join public.anomaly_reports r on r.id = w.anomaly_report_id
  left join public.profiles p on p.id = w.tecnico_id
  where w.machine_id = _machine_id and auth.uid() is not null
  order by w.creado_en desc
$$;
revoke all on function public.historial_maquina(uuid) from public, anon;
grant execute on function public.historial_maquina(uuid) to authenticated;
create index if not exists work_orders_machine_creado_idx on public.work_orders (machine_id, creado_en desc);