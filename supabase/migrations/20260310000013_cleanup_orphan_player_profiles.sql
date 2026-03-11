-- Remove orphan player profiles that are not linked to any team
-- and have no member_profile_access records.
-- These were created when coach accounts incorrectly created player profiles
-- during team setup flow.

DELETE FROM public.member_profiles mp
WHERE mp.kind = 'player'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.member_profile_id = mp.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.member_profile_access mpa
    WHERE mpa.member_profile_id = mp.id
  );

-- Remove auto-created player profiles where:
--   1. The user has exactly 1 member profile (1-to-1, indicating auto-creation)
--   2. The profile name matches the account name (sign of system-generated placeholder)
-- These are not manually added child profiles, but system-generated ones.

DELETE FROM public.member_profiles mp
WHERE mp.kind = 'player'
  AND (
    SELECT COUNT(*) FROM public.member_profiles mp2
    WHERE mp2.user_id = mp.user_id
  ) = 1
  AND mp.name = (
    SELECT p.name FROM public.profiles p
    WHERE p.id = mp.user_id
  );
