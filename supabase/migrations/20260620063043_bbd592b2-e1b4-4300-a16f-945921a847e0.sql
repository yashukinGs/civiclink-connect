-- Leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (name text, reports integer, resolved integer, points integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(p.name, 'Citizen') AS name,
    count(i.*)::int AS reports,
    count(i.*) FILTER (WHERE i.status IN ('Resolved','Closed'))::int AS resolved,
    (count(i.*) * 50 + count(i.*) FILTER (WHERE i.status IN ('Resolved','Closed')) * 100)::int AS points
  FROM public.issues i
  LEFT JOIN public.profiles p ON p.id = i.user_id
  GROUP BY p.name
  ORDER BY points DESC
  LIMIT 10;
$$;

-- Recently resolved feed
CREATE OR REPLACE FUNCTION public.get_recent_resolved()
RETURNS TABLE (ticket_id text, title text, location text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ticket_id, title, location, created_at, updated_at
  FROM public.issues
  WHERE status IN ('Resolved','Closed')
  ORDER BY updated_at DESC
  LIMIT 8;
$$;

-- Category counts
CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE (name text, value integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT category AS name, count(*)::int AS value
  FROM public.issues
  GROUP BY category
  ORDER BY value DESC;
$$;

-- Monthly trend (last 6 months)
CREATE OR REPLACE FUNCTION public.get_monthly_trend()
RETURNS TABLE (month text, reported integer, resolved integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH months AS (
    SELECT date_trunc('month', now()) - (interval '1 month' * g) AS m
    FROM generate_series(0,5) g
  )
  SELECT
    to_char(m, 'Mon') AS month,
    (SELECT count(*) FROM public.issues WHERE date_trunc('month', created_at) = m)::int AS reported,
    (SELECT count(*) FROM public.issues WHERE date_trunc('month', created_at) = m AND status IN ('Resolved','Closed'))::int AS resolved
  FROM months
  ORDER BY m;
$$;

-- Average resolution time per month (days)
CREATE OR REPLACE FUNCTION public.get_resolution_trend()
RETURNS TABLE (month text, days numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH months AS (
    SELECT date_trunc('month', now()) - (interval '1 month' * g) AS m
    FROM generate_series(0,5) g
  )
  SELECT
    to_char(m, 'Mon') AS month,
    COALESCE(round(avg(EXTRACT(EPOCH FROM (i.updated_at - i.created_at)) / 86400.0)::numeric, 1), 0) AS days
  FROM months
  LEFT JOIN public.issues i
    ON date_trunc('month', i.updated_at) = m
   AND i.status IN ('Resolved','Closed')
  GROUP BY m
  ORDER BY m;
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_recent_resolved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_category_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_monthly_trend() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_resolution_trend() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_resolved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resolution_trend() TO authenticated;