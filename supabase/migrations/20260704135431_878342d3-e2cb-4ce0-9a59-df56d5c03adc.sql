-- =========================================================
-- STAFF / OFFICERS
-- =========================================================
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text NOT NULL,
  designation text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view staff"
  ON public.staff FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert staff"
  ON public.staff FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update staff"
  ON public.staff FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete staff"
  ON public.staff FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- ISSUES: officer assignment + anonymous flag
-- =========================================================
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS assigned_officer_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- Admins can delete any complaint
CREATE POLICY "Admins can delete all issues"
  ON public.issues FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Officers can view complaints assigned to them
CREATE POLICY "Officers can view assigned issues"
  ON public.issues FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = issues.assigned_officer_id
        AND s.user_id = auth.uid()
    )
  );

-- =========================================================
-- ASSIGNMENT HISTORY
-- =========================================================
CREATE TABLE public.issue_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.issue_assignments TO authenticated;
GRANT ALL ON public.issue_assignments TO service_role;

ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assignment history"
  ON public.issue_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view assignments for their issues"
  ON public.issue_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_assignments.issue_id
        AND i.user_id = auth.uid()
    )
  );

-- =========================================================
-- INTERNAL NOTES (admin only)
-- =========================================================
CREATE TABLE public.issue_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.issue_notes TO authenticated;
GRANT ALL ON public.issue_notes TO service_role;

ALTER TABLE public.issue_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage internal notes"
  ON public.issue_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- PROFILES + ROLES admin visibility
-- =========================================================
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- LEADERBOARD anonymity
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(name text, reports integer, resolved integer, points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    CASE WHEN i.is_anonymous THEN 'Anonymous Citizen'
         ELSE COALESCE(p.name, 'Citizen') END AS name,
    count(i.*)::int AS reports,
    count(i.*) FILTER (WHERE i.status IN ('Resolved','Closed'))::int AS resolved,
    (count(i.*) * 50 + count(i.*) FILTER (WHERE i.status IN ('Resolved','Closed')) * 100)::int AS points
  FROM public.issues i
  LEFT JOIN public.profiles p ON p.id = i.user_id
  GROUP BY 1
  ORDER BY points DESC
  LIMIT 10;
$function$;