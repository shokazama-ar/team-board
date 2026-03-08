-- Public function to get team name by ID (for unauthenticated contact form)
-- SECURITY DEFINER bypasses RLS, so we only expose the team name (not sensitive data)
CREATE OR REPLACE FUNCTION public.get_team_name(tid uuid)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  SELECT name INTO result
  FROM public.teams
  WHERE id = tid;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon role so unauthenticated users can call it
GRANT EXECUTE ON FUNCTION public.get_team_name(uuid) TO anon;
