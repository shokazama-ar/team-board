-- Migration: Player Profile Sharing
-- Adds share_code to member_profiles, creates member_profile_access table,
-- and updates RLS policies and SQL functions for profile sharing.

-- 1. Add share_code column to member_profiles
ALTER TABLE public.member_profiles
  ADD COLUMN share_code text UNIQUE
  DEFAULT left(replace(gen_random_uuid()::text, '-', ''), 10);

-- Populate existing rows (DEFAULT does not apply retroactively)
UPDATE public.member_profiles
  SET share_code = left(replace(gen_random_uuid()::text, '-', ''), 10)
  WHERE share_code IS NULL;

ALTER TABLE public.member_profiles
  ALTER COLUMN share_code SET NOT NULL;

-- 2. Create member_profile_access table
CREATE TABLE public.member_profile_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_profile_id, user_id)
);

ALTER TABLE public.member_profile_access ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for member_profile_access

-- View: profile owner or the access holder themselves
CREATE POLICY "Users can view their profile access"
  ON public.member_profile_access FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = member_profile_id AND mp.user_id = auth.uid()
    )
  );

-- Insert: profile owner only
CREATE POLICY "Profile owners can grant access"
  ON public.member_profile_access FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = member_profile_id AND mp.user_id = auth.uid()
    )
    AND granted_by = auth.uid()
  );

-- Delete: profile owner or self-revoke
CREATE POLICY "Profile owners or self can revoke access"
  ON public.member_profile_access FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = member_profile_id AND mp.user_id = auth.uid()
    )
  );

-- 4. Update owns_member_profile() to include shared access
CREATE OR REPLACE FUNCTION public.owns_member_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE id = profile_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.member_profile_access
    WHERE member_profile_id = profile_id AND user_id = auth.uid()
  );
$$;

-- 5. Update is_member_of_team() to include shared access
CREATE OR REPLACE FUNCTION public.is_member_of_team(tid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.member_profiles mp ON mp.id = tm.member_profile_id
    WHERE tm.team_id = tid
      AND (
        mp.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.member_profile_access mpa
          WHERE mpa.member_profile_id = mp.id AND mpa.user_id = auth.uid()
        )
      )
  );
$$;

-- 6. Sharing SQL functions

-- link_profile_by_share_code: links current user to a profile via share code
CREATE OR REPLACE FUNCTION public.link_profile_by_share_code(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_profile_id uuid;
  found_name text;
  found_team_id uuid;
  found_owner_id uuid;
BEGIN
  SELECT id, name, user_id
    INTO found_profile_id, found_name, found_owner_id
    FROM public.member_profiles
   WHERE share_code = code
   LIMIT 1;

  IF found_profile_id IS NULL THEN
    RAISE EXCEPTION 'Invalid share code';
  END IF;

  IF found_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'You already own this profile';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.member_profile_access
    WHERE member_profile_id = found_profile_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already linked to this profile';
  END IF;

  INSERT INTO public.member_profile_access (member_profile_id, user_id, granted_by)
  VALUES (found_profile_id, auth.uid(), found_owner_id);

  SELECT team_id INTO found_team_id
    FROM public.team_members
   WHERE member_profile_id = found_profile_id
   LIMIT 1;

  RETURN jsonb_build_object(
    'member_profile_id', found_profile_id,
    'name', found_name,
    'team_id', found_team_id
  );
END;
$$;

-- revoke_profile_access: removes a user's access to a profile
CREATE OR REPLACE FUNCTION public.revoke_profile_access(
  target_profile_id uuid,
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE id = target_profile_id AND user_id = auth.uid()
  ) AND target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  DELETE FROM public.member_profile_access
   WHERE member_profile_id = target_profile_id AND user_id = target_user_id;
END;
$$;

-- regenerate_profile_share_code: generates a new share code for a profile (owner only)
CREATE OR REPLACE FUNCTION public.regenerate_profile_share_code(target_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.member_profiles
    WHERE id = target_profile_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  new_code := left(replace(gen_random_uuid()::text, '-', ''), 10);

  UPDATE public.member_profiles
     SET share_code = new_code
   WHERE id = target_profile_id;

  RETURN new_code;
END;
$$;

-- 7. Update member_profiles RLS policies

-- View: owner OR shared access user OR same-team member
DROP POLICY IF EXISTS "Users can view member profiles in shared teams" ON public.member_profiles;

CREATE POLICY "Users can view member profiles in shared teams"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.member_profile_access mpa
      WHERE mpa.member_profile_id = member_profiles.id AND mpa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.member_profile_id = member_profiles.id
        AND public.is_member_of_team(tm.team_id)
    )
  );

-- Update: owner OR shared access user
DROP POLICY IF EXISTS "Users can update own member profiles" ON public.member_profiles;

CREATE POLICY "Users can update own member profiles"
  ON public.member_profiles FOR UPDATE TO authenticated
  USING (public.owns_member_profile(id))
  WITH CHECK (public.owns_member_profile(id));
