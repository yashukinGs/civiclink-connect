CREATE OR REPLACE FUNCTION public.get_all_issues_public()
RETURNS TABLE(ticket_id text, title text, category text, priority text, location text, status text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ticket_id, title, category, priority, location, status, created_at, updated_at
  FROM public.issues
  ORDER BY created_at DESC
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_issues_public() TO anon, authenticated;