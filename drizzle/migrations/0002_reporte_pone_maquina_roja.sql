CREATE OR REPLACE FUNCTION public.marcar_maquina_detenida()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.machines SET estado = 'rojo' WHERE id = NEW.machine_id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.marcar_maquina_detenida() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reporte_marca_maquina_roja AFTER INSERT ON public.anomaly_reports
FOR EACH ROW EXECUTE FUNCTION public.marcar_maquina_detenida();