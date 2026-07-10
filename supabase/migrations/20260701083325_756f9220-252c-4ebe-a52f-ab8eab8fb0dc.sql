-- 1. Fix ticket-lookup bypass: enforce ownership / admin inside the function
CREATE OR REPLACE FUNCTION public.get_issue_by_ticket(_ticket text)
 RETURNS TABLE(ticket_id text, title text, category text, priority text, description text, location text, image_url text, attachments jsonb, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ticket_id, title, category, priority, description, location, image_url, attachments, status, created_at, updated_at
  FROM public.issues
  WHERE upper(ticket_id) = upper(trim(_ticket))
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  LIMIT 1;
$function$;

-- 2. Tighten storage: only owners (by folder path) or admins can view issue files
DROP POLICY IF EXISTS "Authenticated users can view issue images" ON storage.objects;
CREATE POLICY "Owners or admins can view issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 3. Lock down function execution.
-- Remove the default PUBLIC/anon EXECUTE from every SECURITY DEFINER function so
-- unauthenticated callers can no longer invoke them through the API.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_issue_ticket_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_recent_resolved() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_category_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_monthly_trend() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_resolution_trend() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_issue_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_issue_by_ticket(text) FROM PUBLIC, anon;

-- Keep EXECUTE for signed-in users only where the app / RLS actually needs it.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_resolved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resolution_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_issue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_issue_by_ticket(text) TO authenticated;