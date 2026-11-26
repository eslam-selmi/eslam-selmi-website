-- Tool files are readable only with the tool grant AND the page lock (if the admin set one) satisfied, decided on the server.
drop policy if exists "granted users read tool assets" on storage.objects;
create policy "granted users read tool assets" on storage.objects for select to authenticated using (
  bucket_id = 'tool-assets' and (
    (split_part(name,'/',1) = 'app' and exists (select 1 from unnest(public.get_my_tools()) t where public.extra_lock_ok('page.' || t || '_tool')))
    or (split_part(name,'/',1) = any (array['tna','perf','exam']) and public.has_tool_access(split_part(name,'/',1)) and public.extra_lock_ok('page.' || split_part(name,'/',1) || '_tool'))
  )
);
