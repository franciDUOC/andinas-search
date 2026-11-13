CREATE POLICY "Supervisor ve roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'));

CREATE OR REPLACE FUNCTION public.asignar_tecnico(_reporte_id uuid, _tecnico_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _maquina uuid;
  _orden uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'supervisor') THEN
    RAISE EXCEPTION 'Solo el supervisor puede asignar técnicos' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_role(_tecnico_id, 'tecnico') THEN
    RAISE EXCEPTION 'El usuario elegido no es técnico';
  END IF;

  SELECT machine_id INTO _maquina FROM public.anomaly_reports
  WHERE id = _reporte_id AND estado = 'Pendiente de revisión'
  FOR UPDATE;
  IF _maquina IS NULL THEN
    RAISE EXCEPTION 'El reporte ya fue atendido o no existe';
  END IF;

  INSERT INTO public.work_orders (anomaly_report_id, machine_id, tecnico_id, asignado_por, estado)
  VALUES (_reporte_id, _maquina, _tecnico_id, auth.uid(), 'asignada')
  RETURNING id INTO _orden;

  UPDATE public.machines SET estado = 'amarillo' WHERE id = _maquina;
  UPDATE public.anomaly_reports SET estado = 'En atención' WHERE id = _reporte_id;
  RETURN _orden;
END $$;

REVOKE EXECUTE ON FUNCTION public.asignar_tecnico(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.asignar_tecnico(uuid, uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;