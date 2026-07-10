-- ISSUES TABLE
CREATE SEQUENCE IF NOT EXISTS public.issue_ticket_seq;

CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  description text NOT NULL,
  location text,
  image_url text,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT ALL ON public.issues TO service_role;

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own issues"
ON public.issues FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all issues"
ON public.issues FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own issues"
ON public.issues FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issues"
ON public.issues FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all issues"
ON public.issues FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own issues"
ON public.issues FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ticket id + updated_at triggers
CREATE OR REPLACE FUNCTION public.set_issue_ticket_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_id IS NULL OR NEW.ticket_id = '' THEN
    NEW.ticket_id := 'CC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.issue_ticket_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_issue_ticket_id_trigger
BEFORE INSERT ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.set_issue_ticket_id();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CONTACT MESSAGES TABLE
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PLATFORM STATS (security definer so the homepage can show real global numbers)
CREATE OR REPLACE FUNCTION public.get_issue_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total', count(*),
    'pending', count(*) FILTER (WHERE status = 'Pending'),
    'in_progress', count(*) FILTER (WHERE status IN ('Verified','Assigned','In Progress')),
    'resolved', count(*) FILTER (WHERE status IN ('Resolved','Closed')),
    'today', count(*) FILTER (WHERE created_at >= date_trunc('day', now()))
  )
  FROM public.issues;
$$;

-- TRACK A COMPLAINT BY TICKET (security definer, safe columns only)
CREATE OR REPLACE FUNCTION public.get_issue_by_ticket(_ticket text)
RETURNS TABLE (
  ticket_id text,
  title text,
  category text,
  priority text,
  description text,
  location text,
  image_url text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ticket_id, title, category, priority, description, location, image_url, status, created_at, updated_at
  FROM public.issues
  WHERE upper(ticket_id) = upper(trim(_ticket))
  LIMIT 1;
$$;

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;