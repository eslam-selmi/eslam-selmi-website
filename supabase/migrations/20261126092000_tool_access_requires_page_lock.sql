create or replace function public.has_tool_access(_tool text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.tool_access a
    join public.profiles p on p.id = a.user_id
    where a.user_id = auth.uid() and a.tool = _tool and p.activation_status = 'active'
  ) and public.extra_lock_ok('page.' || _tool || '_tool')
$$;
