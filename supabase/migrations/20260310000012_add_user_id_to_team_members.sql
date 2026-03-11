-- Add user_id to team_members to break infinite RLS recursion
--
-- Previously, checking team membership required joining member_profiles,
-- which triggered member_profiles SELECT RLS, which called is_member_of_team,
-- which joined member_profiles again → infinite recursion.
--
-- By storing user_id directly on team_members, all membership-check functions
-- can be rewritten without referencing member_profiles at all.

-- 1. Add user_id column (nullable first for backfill)
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill from member_profiles
UPDATE public.team_members tm
SET user_id = mp.user_id
FROM public.member_profiles mp
WHERE mp.id = tm.member_profile_id;

-- 3. Make NOT NULL after backfill
ALTER TABLE public.team_members
  ALTER COLUMN user_id SET NOT NULL;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_team_id_user_id_idx ON public.team_members(team_id, user_id);

-- 5. Rewrite is_member_of_team without referencing member_profiles
CREATE OR REPLACE FUNCTION public.is_member_of_team(tid uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = tid
      AND (
        user_id = auth.uid()
        OR member_profile_id IN (
          SELECT member_profile_id FROM public.member_profile_access
          WHERE user_id = auth.uid()
        )
      )
  );
$$;

-- 6. Rewrite is_admin_of_team without referencing member_profiles
CREATE OR REPLACE FUNCTION public.is_admin_of_team(tid uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = tid
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 7. Rewrite get_my_team_id without referencing member_profiles
CREATE OR REPLACE FUNCTION public.get_my_team_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT team_id FROM public.team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 8. Add trigger to keep user_id in sync when member_profile_id changes
CREATE OR REPLACE FUNCTION public.sync_team_member_user_id()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.user_id := (SELECT user_id FROM public.member_profiles WHERE id = NEW.member_profile_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_team_member_user_id_trigger ON public.team_members;
CREATE TRIGGER sync_team_member_user_id_trigger
  BEFORE INSERT OR UPDATE OF member_profile_id ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_team_member_user_id();

-- 9. Helper function: check member profile ownership without triggering RLS on member_profiles
--    Used by member_profile_access policies to avoid recursive RLS evaluation.
CREATE OR REPLACE FUNCTION public.owns_member_profile_by_id(profile_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE id = profile_id AND user_id = auth.uid()
  );
$$;

-- 10. Rewrite member_profiles SELECT policy to use team_members.user_id directly
--     (avoids calling is_member_of_team which previously caused recursion via member_profiles JOIN)
DROP POLICY IF EXISTS "Users can view member profiles in shared teams" ON public.member_profiles;

CREATE POLICY "Users can view member profiles in shared teams"
  ON public.member_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.member_profile_access mpa
      WHERE mpa.member_profile_id = member_profiles.id
        AND mpa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.member_profile_id = member_profiles.id
        AND tm.team_id IN (
          SELECT team_id FROM public.team_members
          WHERE user_id = auth.uid()
        )
    )
  );

-- 11. Rewrite member_profile_access policies to use owns_member_profile_by_id (SECURITY DEFINER)
--     instead of directly referencing member_profiles, which caused recursive RLS evaluation.
DROP POLICY IF EXISTS "Users can view their profile access" ON public.member_profile_access;
DROP POLICY IF EXISTS "Profile owners or self can revoke access" ON public.member_profile_access;
DROP POLICY IF EXISTS "Profile owners can grant access" ON public.member_profile_access;

CREATE POLICY "Users can view their profile access"
  ON public.member_profile_access
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR owns_member_profile_by_id(member_profile_id)
  );

CREATE POLICY "Profile owners or self can revoke access"
  ON public.member_profile_access
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR owns_member_profile_by_id(member_profile_id)
  );

CREATE POLICY "Profile owners can grant access"
  ON public.member_profile_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owns_member_profile_by_id(member_profile_id)
    AND granted_by = auth.uid()
  );
