create or replace function public.sync_block_to_auth() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if new.is_blocked is distinct from old.is_blocked then
    if new.is_blocked then
      update auth.users set banned_until = 'infinity' where id = new.id;
      delete from auth.sessions where user_id = new.id;
    else
      update auth.users set banned_until = null where id = new.id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_block_to_auth on public.profiles;
create trigger trg_sync_block_to_auth
after update of is_blocked on public.profiles
for each row execute function public.sync_block_to_auth();

update auth.users u set banned_until = 'infinity'
from public.profiles p where p.id = u.id and p.is_blocked = true;
delete from auth.sessions s using public.profiles p where p.id = s.user_id and p.is_blocked = true;
update auth.users u set banned_until = null
from public.profiles p where p.id = u.id and p.is_blocked = false and u.banned_until = 'infinity';

notify pgrst, 'reload schema';
