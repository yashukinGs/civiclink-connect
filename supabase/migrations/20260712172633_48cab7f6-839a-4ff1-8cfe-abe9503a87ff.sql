
-- Revoke default PUBLIC EXECUTE on SECURITY DEFINER functions and grant explicit access only where needed.

-- Trigger / internal-only functions: no client role should call them.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_issue_ticket_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_issue_update_scope() FROM PUBLIC, anon, authenticated;

-- has_role: used by RLS policies executing as authenticated; keep authenticated EXECUTE, revoke anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Authenticated-only reporting functions
REVOKE ALL ON FUNCTION public.get_issue_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_stats() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_issue_by_ticket(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_by_ticket(text) TO authenticated, service_role;

-- Public community/analytics endpoints: allow anon + authenticated
REVOKE ALL ON FUNCTION public.get_category_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_recent_resolved() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recent_resolved() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_resolution_trend() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_resolution_trend() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_monthly_trend() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_trend() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_all_issues_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_issues_public() TO anon, authenticated, service_role;
