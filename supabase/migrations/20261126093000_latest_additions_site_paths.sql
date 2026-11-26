-- Keep visitors on the site: two items pointed at an external host; use site paths instead.
update public.latest_additions set url='/#current-courses' where id='3c675043-218e-457f-9db8-b8e98774f301' and url like 'https://files.instinct.com/%';
update public.latest_additions set url='/portal' where id='4cf38bd8-1401-4eec-8339-24439d18188e' and url like 'https://files.instinct.com/%';
