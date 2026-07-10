ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.get_issue_by_ticket(text);

CREATE OR REPLACE FUNCTION public.get_issue_by_ticket(_ticket text)
 RETURNS TABLE(ticket_id text, title text, category text, priority text, description text, location text, image_url text, attachments jsonb, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ticket_id, title, category, priority, description, location, image_url, attachments, status, created_at, updated_at
  FROM public.issues
  WHERE upper(ticket_id) = upper(trim(_ticket))
  LIMIT 1;
$function$;