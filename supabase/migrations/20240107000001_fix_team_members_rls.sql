-- Fix infinite recursion in team_members RLS policy
-- The original policy "Team members can view members of their team" caused
-- infinite recursion because it queried team_members from within a team_members policy.

-- Drop the recursive policy
DROP POLICY IF EXISTS "Team members can view members of their team" ON public.team_members;

-- Policy 1: Users can always see their own membership record (no self-reference)
CREATE POLICY "Users can view own membership" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Helper function using SECURITY DEFINER to bypass RLS when checking team membership
-- This breaks the recursion: the inner query runs as the function owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_member_of_team(tid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = tid AND user_id = auth.uid()
  );
$$;

-- Policy 2: Users can see all members of teams they belong to (uses SECURITY DEFINER function)
CREATE POLICY "Team members can view teammates" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.is_member_of_team(team_id));
