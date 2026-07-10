-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  mobile text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, mobile, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'mobile', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

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
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Pending',
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own issues" ON public.issues FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all issues" ON public.issues FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own issues" ON public.issues FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update all issues" ON public.issues FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete their own issues" ON public.issues FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all issues" ON public.issues FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_issue_ticket_id()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ticket_id IS NULL OR NEW.ticket_id = '' THEN
    NEW.ticket_id := 'CC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.issue_ticket_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_issue_ticket_id_trigger BEFORE INSERT ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.set_issue_ticket_id();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE POLICY "Anyone can submit a valid contact message" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(trim(name)) > 0 AND char_length(trim(email)) > 0
  AND char_length(trim(subject)) > 0 AND char_length(trim(message)) > 0
  AND char_length(name) <= 100 AND char_length(email) <= 255
  AND char_length(subject) <= 150 AND char_length(message) <= 2000
);
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_issue_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'total', count(*),
    'pending', count(*) FILTER (WHERE status = 'Pending'),
    'in_progress', count(*) FILTER (WHERE status IN ('Verified','Assigned','In Progress')),
    'resolved', count(*) FILTER (WHERE status IN ('Resolved','Closed')),
    'today', count(*) FILTER (WHERE created_at >= date_trunc('day', now()))
  ) FROM public.issues;
$$;

CREATE OR REPLACE FUNCTION public.get_issue_by_ticket(_ticket text)
RETURNS TABLE(ticket_id text, title text, category text, priority text, description text, location text, image_url text, attachments jsonb, status text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ticket_id, title, category, priority, description, location, image_url, attachments, status, created_at, updated_at
  FROM public.issues
  WHERE upper(ticket_id) = upper(trim(_ticket))
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_resolved()
RETURNS TABLE (ticket_id text, title text, location text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ticket_id, title, location, created_at, updated_at
  FROM public.issues WHERE status IN ('Resolved','Closed')
  ORDER BY updated_at DESC LIMIT 8;
$$;

CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE (name text, value integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category AS name, count(*)::int AS value FROM public.issues GROUP BY category ORDER BY value DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_trend()
RETURNS TABLE (month text, reported integer, resolved integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH months AS (SELECT date_trunc('month', now()) - (interval '1 month' * g) AS m FROM generate_series(0,5) g)
  SELECT to_char(m, 'Mon') AS month,
    (SELECT count(*) FROM public.issues WHERE date_trunc('month', created_at) = m)::int AS reported,
    (SELECT count(*) FROM public.issues WHERE date_trunc('month', created_at) = m AND status IN ('Resolved','Closed'))::int AS resolved
  FROM months ORDER BY m;
$$;

CREATE OR REPLACE FUNCTION public.get_resolution_trend()
RETURNS TABLE (month text, days numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH months AS (SELECT date_trunc('month', now()) - (interval '1 month' * g) AS m FROM generate_series(0,5) g)
  SELECT to_char(m, 'Mon') AS month,
    COALESCE(round(avg(EXTRACT(EPOCH FROM (i.updated_at - i.created_at)) / 86400.0)::numeric, 1), 0) AS days
  FROM months LEFT JOIN public.issues i
    ON date_trunc('month', i.updated_at) = m AND i.status IN ('Resolved','Closed')
  GROUP BY m ORDER BY m;
$$;

REVOKE ALL ON FUNCTION public.get_issue_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_issue_by_ticket(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_recent_resolved() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_category_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_monthly_trend() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_resolution_trend() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_issue_by_ticket(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_resolved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resolution_trend() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;