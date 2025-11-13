-- This function will be triggered after a new user is created in the auth.users table.
-- It creates a corresponding profile in the public.profiles table.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert a new profile record for the new user.
  -- The user_id is taken from the new user's id.
  -- The display_name can be initialized from metadata if available, otherwise it will be null.
  -- A default theme_preference is set to 'dark'.
  insert into public.profiles (user_id, display_name, theme_preference)
  values (new.id, new.raw_user_meta_data->>'display_name', 'dark');
  return new;
end;
$$;

-- This trigger calls the handle_new_user function whenever a new row is inserted into auth.users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

