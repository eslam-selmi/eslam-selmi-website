-- DRAFT. Not executed anywhere. Server-side scoring; the client never supplies a score.
create table if not exists public.exam_questions (   -- server only, no client policies
  id text primary key, domain text not null, standard text, stem text not null,
  options jsonb not null, correct int not null, explanation text, approved boolean not null default false,
  standard_title text, weight_pct numeric, difficulty text, refs jsonb, source_status text, official_item boolean not null default false
);
alter table public.exam_questions enable row level security;
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_ids text[] not null, option_orders jsonb not null,   -- fixed server-side at start
  count int not null, duration_s int not null,
  started_at timestamptz not null default now(), submitted_at timestamptz,
  score int, domain_scores jsonb, standard_scores jsonb  -- {std:{ok,total}} for weakness analysis
);
create table if not exists public.exam_answers (
  attempt_id uuid references public.exam_attempts(id) on delete cascade,
  question_id text, chosen int, flagged boolean default false, primary key(attempt_id,question_id)
);
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
create policy att_own_read on public.exam_attempts for select using (user_id=auth.uid() and public.has_tool_access('exam'));
create policy ans_own_read on public.exam_answers for select
  using (public.has_tool_access('exam') and exists(select 1 from exam_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
-- All writes go through RPCs below (no insert/update policies).

create or replace function public.start_exam(p_count int, p_duration_s int, p_domains text[] default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare ids text[]; orders jsonb; aid uuid; res jsonb;
begin
  if not public.has_tool_access('exam') then raise exception 'forbidden'; end if;
  if p_count not between 5 and 200 or p_duration_s not between 300 and 14400 then raise exception 'bad config'; end if;
  select array_agg(id) into ids from (select id from exam_questions where approved
     and (p_domains is null or domain=any(p_domains)) order by random() limit p_count) s;
  if ids is null then raise exception 'no approved questions'; end if;
  select jsonb_object_agg(id,(select jsonb_agg(i-1 order by random()) from generate_series(1,jsonb_array_length(options)) i))
    into orders from exam_questions where id=any(ids);
  insert into exam_attempts(user_id,question_ids,option_orders,count,duration_s)
    values (auth.uid(),ids,orders,cardinality(ids),p_duration_s) returning id into aid;
  select jsonb_build_object('attempt_id',aid,'duration_s',p_duration_s,'questions',
    (select jsonb_agg(jsonb_build_object('id',q.id,'domain',q.domain,'stem',q.stem,
       'options',(select jsonb_agg(q.options->(o::int)) from jsonb_array_elements_text(orders->q.id) o)))
     from exam_questions q where q.id=any(ids))) into res;
  return res;  -- 'correct' and 'explanation' are never returned here
end $$;

create or replace function public.submit_exam(p_attempt uuid, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare a exam_attempts; q record; pos int; tot int:=0; ok int:=0; ds jsonb:='{}'; ss jsonb:='{}'; review jsonb:='[]';
begin
  if not public.has_tool_access('exam') then raise exception 'forbidden'; end if;
  select * into a from exam_attempts where id=p_attempt and user_id=auth.uid() for update;
  if a.id is null then raise exception 'forbidden'; end if;
  if a.submitted_at is not null then raise exception 'already submitted'; end if;
  -- time limit enforced with server clock (30 s grace); late answers rejected, never trusted from client
  if now()>a.started_at+make_interval(secs=>a.duration_s+30) then raise exception 'time expired'; end if;
  for q in select * from exam_questions where id=any(a.question_ids) loop
    pos := (p_answers->>q.id)::int;   -- index in the shuffled order shown to the user; null = unanswered
    tot:=tot+1;
    ss:=jsonb_set(ss,array[q.standard],jsonb_build_object('ok',coalesce((ss->q.standard->>'ok')::int,0),'total',coalesce((ss->q.standard->>'total')::int,0)+1));
    if pos is not null and (a.option_orders->q.id->>pos)::int=q.correct then ok:=ok+1;
      ss:=jsonb_set(ss,array[q.standard,'ok'],to_jsonb((ss->q.standard->>'ok')::int+1));
      ds:=jsonb_set(ds,array[q.domain],to_jsonb(coalesce((ds->>q.domain)::int,0)+1)); end if;
    insert into exam_answers(attempt_id,question_id,chosen) values (p_attempt,q.id,
      case when pos is null then null else (a.option_orders->q.id->>pos)::int end);
    review:=review||jsonb_build_object('id',q.id,'domain',q.domain,'standard',q.standard,
      'correct_shown_index',(select i-1 from generate_series(1,jsonb_array_length(q.options)) i
         where (a.option_orders->q.id->>(i-1))::int=q.correct limit 1),'explanation',q.explanation);
  end loop;
  update exam_attempts set submitted_at=now(),score=ok,domain_scores=ds,standard_scores=ss where id=p_attempt;
  return jsonb_build_object('score',ok,'total',tot,'domain_scores',ds,'standard_scores',ss,'review',review);
end $$;
revoke all on function public.start_exam(int,int,text[]), public.submit_exam(uuid,jsonb) from public;
grant execute on function public.start_exam(int,int,text[]), public.submit_exam(uuid,jsonb) to authenticated;
-- Reviewed bug check: correct_shown_index lookup uses order position whose original index = q.correct.
