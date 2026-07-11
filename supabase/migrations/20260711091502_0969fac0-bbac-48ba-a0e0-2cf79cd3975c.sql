
DROP POLICY IF EXISTS "Authenticated users can view all issues" ON public.issues;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.set_issue_ticket_id() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
