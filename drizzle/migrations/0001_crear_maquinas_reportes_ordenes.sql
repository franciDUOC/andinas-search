CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  ubicacion TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'verde' CHECK (estado IN ('verde','amarillo','rojo')),
  manual_url TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven maquinas" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisor gestiona maquinas" ON public.machines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'supervisor')) WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

CREATE TABLE public.anomaly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ruido','vibracion','fuga','otra')),
  descripcion TEXT,
  reportado_por UUID NOT NULL REFERENCES public.profiles(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'Pendiente de revisión'
);
GRANT SELECT, INSERT, UPDATE ON public.anomaly_reports TO authenticated;
GRANT ALL ON public.anomaly_reports TO service_role;
ALTER TABLE public.anomaly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven reportes" ON public.anomaly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios crean reportes" ON public.anomaly_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reportado_por);
CREATE POLICY "Supervisor actualiza reportes" ON public.anomaly_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'supervisor')) WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_report_id UUID NOT NULL REFERENCES public.anomaly_reports(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES public.profiles(id),
  asignado_por UUID NOT NULL REFERENCES public.profiles(id),
  estado TEXT NOT NULL DEFAULT 'asignada' CHECK (estado IN ('asignada','en_progreso','completada')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  completado_en TIMESTAMPTZ,
  causa_falla TEXT
);
GRANT SELECT, INSERT, UPDATE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven ordenes" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisor crea ordenes" ON public.work_orders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Tecnico o supervisor actualizan ordenes" ON public.work_orders FOR UPDATE TO authenticated USING (auth.uid() = tecnico_id OR public.has_role(auth.uid(), 'supervisor')) WITH CHECK (auth.uid() = tecnico_id OR public.has_role(auth.uid(), 'supervisor'));