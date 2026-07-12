
-- 1. Attach enforce_issue_update_scope trigger to prevent citizens from changing workflow columns
DROP TRIGGER IF EXISTS enforce_issue_update_scope_trg ON public.issues;
CREATE TRIGGER enforce_issue_update_scope_trg
BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.enforce_issue_update_scope();

-- 2. Lock down SECURITY DEFINER functions that are not meant to be called directly from the API
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_issue_update_scope() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_issue_ticket_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. get_issue_by_ticket requires an authenticated user (RLS check inside relies on auth.uid())
REVOKE ALL ON FUNCTION public.get_issue_by_ticket(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_by_ticket(text) TO authenticated;
