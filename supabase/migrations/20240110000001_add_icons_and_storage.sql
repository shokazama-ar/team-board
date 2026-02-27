-- Add icon_url to teams
alter table public.teams add column if not exists icon_url text;

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('team-icons', 'team-icons', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Storage RLS: avatars
create policy "Avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: team-icons
create policy "Team icons are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'team-icons');

create policy "Team admins can upload team icons"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'team-icons'
    and exists (
      select 1 from public.team_members
      where team_members.team_id::text = (storage.foldername(name))[1]
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

create policy "Team admins can update team icons"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'team-icons'
    and exists (
      select 1 from public.team_members
      where team_members.team_id::text = (storage.foldername(name))[1]
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );

create policy "Team admins can delete team icons"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'team-icons'
    and exists (
      select 1 from public.team_members
      where team_members.team_id::text = (storage.foldername(name))[1]
      and team_members.user_id = auth.uid()
      and team_members.role = 'admin'
    )
  );
