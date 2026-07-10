DROP POLICY IF EXISTS "Authenticated can view staff" ON public.staff;

CREATE POLICY "Admins can view staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own record"
  ON public.staff FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);