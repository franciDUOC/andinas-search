create or replace function public.iniciar_orden(_orden_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.work_orders set estado = 'en_progreso'
   where id = _orden_id and tecnico_id = auth.uid() and estado = 'asignada';
  if not found then raise exception 'No se puede iniciar esta orden'; end if;
end $$;

create or replace function public.terminar_orden(_orden_id uuid, _causa text) returns void
language plpgsql security definer set search_path = public as $$
declare _maquina uuid;
begin
  if coalesce(trim(_causa), '') = '' then raise exception 'Falta la causa de la falla'; end if;
  update public.work_orders
     set estado = 'completada', causa_falla = trim(_causa), completado_en = now()
   where id = _orden_id and tecnico_id = auth.uid() and estado = 'en_progreso'
   returning machine_id into _maquina;
  if _maquina is null then raise exception 'No se puede terminar esta orden'; end if;
  update public.machines set estado = 'verde' where id = _maquina;
end $$;

revoke all on function public.iniciar_orden(uuid) from public, anon;
revoke all on function public.terminar_orden(uuid, text) from public, anon;
grant execute on function public.iniciar_orden(uuid) to authenticated;
grant execute on function public.terminar_orden(uuid, text) to authenticated;