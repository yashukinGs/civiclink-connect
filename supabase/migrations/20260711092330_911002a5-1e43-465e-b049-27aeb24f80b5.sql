
-- Enforce that citizens cannot change status or assigned_officer_id on their own issues.
-- Admins and the assigned officer keep full update rights via their existing policies.

CREATE OR REPLACE FUNCTION public.enforce_issue_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  is_assigned_officer boolean;
BEGIN
  is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  is_assigned_officer := EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = OLD.assigned_officer_id
      AND s.user_id = auth.uid()
  );

  IF is_admin OR is_assigned_officer THEN
    RETURN NEW;
  END IF;

  -- Owner (citizen) path: reject changes to workflow-controlled columns.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins or the assigned officer can change status';
  END IF;
  IF NEW.assigned_officer_id IS DISTINCT FROM OLD.assigned_officer_id THEN
    RAISE EXCEPTION 'Only admins can reassign officers';
  END IF;
  IF NEW.ticket_id IS DISTINCT FROM OLD.ticket_id THEN
    RAISE EXCEPTION 'Ticket id cannot be changed';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Issue owner cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_issue_update_scope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_issue_update_scope_trg ON public.issues;
CREATE TRIGGER enforce_issue_update_scope_trg
BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.enforce_issue_update_scope();
