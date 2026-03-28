-- Fix handle_new_user: use email local-part as default name when raw_user_meta_data->>'name' is NULL or empty
-- This fixes the issue where invited users appear as "名称未設定" because the invitation flow
-- does not populate raw_user_meta_data->>'name'.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill: update existing profiles where name is NULL or empty
update public.profiles
set name = split_part(email, '@', 1)
where name is null or trim(name) = '';
