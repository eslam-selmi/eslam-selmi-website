import {PGlite} from '@electric-sql/pglite';import fs from 'fs';
const dir=new URL('../migrations8',import.meta.url).pathname;
async function freshDB(){
  const db=new PGlite();
  await db.exec(fs.readFileSync(new URL('./stubs3.sql',import.meta.url),'utf8'));
  for(const f of fs.readdirSync(dir).sort()){try{await db.exec(fs.readFileSync(dir+'/'+f,'utf8'));}catch(e){}}
  await db.exec(`grant usage on schema public,auth to anon,authenticated; grant all on all tables in schema public to anon,authenticated; grant all on all sequences in schema public to anon,authenticated; grant execute on all functions in schema public,auth to anon,authenticated; grant select on auth.users to authenticated; grant usage on schema storage to authenticated, anon; grant execute on all functions in schema storage to authenticated, anon; grant all on storage.objects, storage.buckets to authenticated`);
  return db;
}
let pass=0,fail=0;
const t=(name,cond)=>{ if(cond){pass++;console.log('PASS',name);}else{fail++;console.log('FAIL',name);} };
async function as(db,u,sql){const uid=U[u]||u||'';await db.exec("reset role");await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false); select set_config('request.jwt.claim.role','authenticated',false)`);try{const r=await db.query(sql);await db.exec('reset role');return {ok:true,rows:r.rows};}catch(e){await db.exec('reset role');return {ok:false,err:e.message};}
}
const cnt=async(db,u,s)=>{const r=await as(db,u,s);return r.ok?Number(r.rows[0].n):-1};

// ---------- shared seed: owner + one trainer tenant (nora) with course, learner ----------
const U={owner:'00000000-0000-0000-0000-0000000000a1',noraU:'00000000-0000-0000-0000-0000000000b2',l2:'00000000-0000-0000-0000-0000000000c2',legacyTrainer:'00000000-0000-0000-0000-0000000000d1',outsider:'00000000-0000-0000-0000-0000000000d2'};
const db=await freshDB();
for(const [k,v] of Object.entries(U)) await db.exec(`insert into auth.users(id,email) values('${v}','${k}@x.test')`);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin'),('${U.legacyTrainer}','trainer')`);
await as(db,'noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await as(db,'owner',`select approve_tenant_request(id,5,true,true,true) from tenant_requests where user_id='${U.noraU}'`);
const noraT=(await db.query(`select id from tenants where slug='nora'`)).rows[0].id;
await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C1','${noraT}',true)`);
const noraC=(await db.query(`select id from courses where title='Nora C1'`)).rows[0].id;
await as(db,'l2',`select join_tenant_as_learner('nora')`);
await as(db,'noraU',`select set_tenant_learner_status('${noraT}','${U.l2}','approved')`);
await as(db,'l2',`insert into enrollments(user_id,course_id,status) values('${U.l2}','${noraC}','pending')`);
await as(db,'noraU',`update enrollments set status='approved' where user_id='${U.l2}'`);

// ---------- A. legacy (pre-tenant) trainer feature is tenant-blind ----------
{const r=await db.exec(`insert into public.course_trainers(course_id,user_id) values('${noraC}','${U.legacyTrainer}')`).then(()=>({ok:true})).catch(e=>({ok:false,err:e.message}));
 t('A0 legacy trainer link to TENANT course is REFUSED (platform-only trigger)',!r.ok && /platform courses/.test(r.err||''));}
console.log('--- A. legacy trainer row on a tenant course ---');
t('A1 legacy trainer CANNOT read cross-tenant enrollments (disable migration active)',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
{const r=await as(db,'legacyTrainer',`insert into course_modules(course_id,title,order_index) values('${noraC}','hijack module',9)`);const after=(await cnt(db,'legacyTrainer',`select count(*) n from course_modules where course_id='${noraC}'`));t('A2 legacy trainer CANNOT write module in tenant course (disable active)',!r.ok||after===0);}
t('A3 legacy trainer CANNOT read learner profile cross-tenant (policy dropped)',(await cnt(db,'legacyTrainer',`select count(*) n from profiles where id='${U.l2}'`))===0);
t('A4 legacy trainer UPDATE enrollment hits 0 rows (perm-gated)',(await cnt(db,'legacyTrainer',`with u as (update enrollments set status='rejected' where user_id='${U.l2}' returning 1) select count(*) n from u`))===0);
// without the stale user_roles 'trainer' row the same course_trainers row grants nothing
await db.exec(`delete from public.user_roles where user_id='${U.legacyTrainer}' and role='trainer'`);
t('A5 without trainer role row, legacy assignment grants nothing',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.legacyTrainer}','trainer') on conflict do nothing`);

// ---------- B. tenant admin powers over enrollments ----------
// A6: if the old is_trainer_of_course body is ever restored, the hole reopens instantly
await db.exec(`create or replace function public.is_trainer_of_course(_course_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.course_trainers ct join public.user_roles ur on ur.user_id=ct.user_id and ur.role='trainer' where ct.course_id=_course_id and ct.user_id=auth.uid() and ur.is_suspended=false) $$`);
t('A6a restored old body, no link possible: cross-tenant reads stay CLOSED',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
await db.exec(`set session_replication_role='replica'; insert into public.course_trainers(course_id,user_id) values('${noraC}','${U.legacyTrainer}'); set session_replication_role='origin';`);
// FULL-CHAIN VERDICT CHANGE: enrollments stay closed (20260603034821 dropped the trainer SELECT policy;
// trainer_enrollments is a security_invoker view whose inner RLS has no trainer SELECT). The remaining
// trainer-keyed policies need BOTH bodies restored (the disable migration stubbed both; its own comment
// says reversal = restore both bodies). First: only is_trainer_of_course restored (perms still stubbed).
t('A6b1 restored body + stale link: enrollment READS stay CLOSED (full chain)',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
t('A6b2 restored body + stale link: enrollment UPDATE still 0 rows (no SELECT visibility)',(await cnt(db,'legacyTrainer',`with u as (update enrollments set status='rejected' where course_id='${noraC}' returning 1) select count(*) n from u`))===0);
{const r=await as(db,'legacyTrainer',`insert into course_modules(course_id,title,order_index) values('${noraC}','hijack module',9)`);t('A6b3 only is_trainer_of_course restored: module WRITE still CLOSED (trainer_has_perm gate)',!r.ok);}
await db.exec(`insert into course_feedback(user_id,course_id,content_rating) values('${U.outsider}','${noraC}',5)`);
t('A6b4 only is_trainer_of_course restored: course_feedback READ REOPENS (no perm gate on that policy)',(await cnt(db,'legacyTrainer',`select count(*) n from course_feedback where course_id='${noraC}'`))===1);
// Now the full documented reversal: restore trainer_has_perm body too + a default permissions row.
await db.exec(`create or replace function public.trainer_has_perm(_course_id uuid, _perm text) returns boolean language plpgsql stable security definer set search_path = public as $f$ declare _ok boolean; begin execute format('select coalesce(bool_or(tp.%I), false) from public.course_trainers ct join public.trainer_permissions tp on tp.course_trainer_id = ct.id join public.user_roles ur on ur.user_id = ct.user_id and ur.role = ''trainer'' where ct.course_id = $1 and ct.user_id = auth.uid() and ur.is_suspended = false', _perm) into _ok using _course_id; return coalesce(_ok, false); end; $f$`);
await db.exec(`insert into public.trainer_permissions(course_trainer_id) select id from public.course_trainers where course_id='${noraC}' and user_id='${U.legacyTrainer}'`);
{const r=await as(db,'legacyTrainer',`insert into course_modules(course_id,title,order_index) values('${noraC}','hijack module',9)`);t('A6b5 full reversal: module WRITE REOPENS (reused-editor surface)',r.ok);}
{const r=await as(db,'legacyTrainer',`insert into course_sessions(course_id,title,starts_at) values('${noraC}','hijack session',now())`);t('A6b6 full reversal: session WRITE REOPENS',r.ok);}
const hijMod=(await db.query(`select id from course_modules where course_id='${noraC}' limit 1`)).rows[0].id;
{const r=await as(db,'legacyTrainer',`insert into assignments(module_id,course_id,title) values('${hijMod}','${noraC}','hijack hw')`);t('A6b7 full reversal: assignment WRITE REOPENS',r.ok);}
await db.exec(`insert into payments(enrollment_id,amount) select id,1 from enrollments where course_id='${noraC}' limit 1`);
const payEnr=(await db.query(`select id from enrollments where course_id='${noraC}' limit 1`)).rows[0].id;
// policy EXISTS subquery on enrollments is RLS-filtered for the trainer (no enrollments SELECT left) -> stays closed
t('A6b8 full reversal: payments READ stays CLOSED (policy subquery is RLS-filtered on enrollments)',(await cnt(db,'legacyTrainer',`select count(*) n from payments where enrollment_id='${payEnr}'`))===0);
t('A6b9 full reversal, default perms: course ARCHIVE 0 rows (can_archive_course defaults false)',(await cnt(db,'legacyTrainer',`with u as (update courses set active=false where id='${noraC}' returning 1) select count(*) n from u`))===0);
const hijAsg=(await db.query(`select id from assignments where course_id='${noraC}' and title='hijack hw'`)).rows[0].id;
await db.exec(`insert into assignment_submissions(assignment_id,user_id,content) values('${hijAsg}','${U.l2}','w')`);
{const r=await as(db,'legacyTrainer',`update assignment_submissions set score=10, graded_at=now() where assignment_id='${hijAsg}'`);const sc=(await db.query(`select score from assignment_submissions where assignment_id='${hijAsg}'`)).rows[0].score;t('A6b11 full reversal: submission GRADING REOPENS (can_grade_assignments default true)',r.ok&&Number(sc)===10);await db.exec(`update assignment_submissions set score=null, graded_at=null where assignment_id='${hijAsg}'`);}
await db.exec(`update public.trainer_permissions set can_archive_course=true where course_trainer_id in (select id from public.course_trainers where course_id='${noraC}' and user_id='${U.legacyTrainer}')`);
{const n=await cnt(db,'legacyTrainer',`with u as (update courses set active=false where id='${noraC}' returning 1) select count(*) n from u`);const inact=(await db.query(`select active from courses where id='${noraC}'`)).rows[0].active===false;t('A6b10 full reversal + archive perm: course ARCHIVE REOPENS',n===1&&inact);await db.exec(`update courses set active=true where id='${noraC}'`);}
await db.exec(`delete from public.course_trainers where course_id='${noraC}'`);
await db.exec(`create or replace function public.is_trainer_of_course(_course_id uuid) returns boolean language sql stable security definer set search_path to 'public' as $$ select false $$`);
await db.exec(`create or replace function public.trainer_has_perm(_course_id uuid, _perm text) returns boolean language sql stable security definer set search_path to 'public' as $$ select false $$`);
console.log('--- B. tenant admin scoped finance/certs (candidate3 final) ---');
await as(db,'owner',`update courses set price=100 where id='${noraC}'`);
const enrB=(await db.query(`select id from enrollments where user_id='${U.l2}' and course_id='${noraC}'`)).rows[0].id;
{const r=await as(db,'noraU',`update enrollments set certificate_issued=true, certificate_url='t/${noraT}/${enrB}.pdf' where user_id='${U.l2}'`);t('B1 tenant admin CAN issue certificate at canonical enrollment path',r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_url='https://evil.example/x.pdf' where user_id='${U.l2}'`);t('B1b tenant admin CANNOT set absolute certificate URL',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_url='t/${noraT}/other-enrollment.pdf' where user_id='${U.l2}'`);t('B1c tenant admin CANNOT reference a non-enrollment cert path',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_url='t/${noraT}/00000000-0000-0000-0000-000000000000.pdf' where user_id='${U.l2}'`);t('B1e tenant admin CANNOT reference ANOTHER enrollment cert path',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_url='t/00000000-0000-0000-0000-000000000000/x.pdf' where user_id='${U.l2}'`);t('B1d tenant admin CANNOT use a foreign tenant prefix',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set discount_amount=50 where user_id='${U.l2}'`);t('B2 tenant admin CAN discount within course price',r.ok);}
{const r=await as(db,'noraU',`update enrollments set discount_amount=99999 where user_id='${U.l2}'`);t('B2b tenant admin CANNOT discount above course price',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set coupon_code='SELF' where user_id='${U.l2}'`);t('B2c tenant admin CANNOT set coupon_code directly',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set blocked=true where user_id='${U.l2}'`);t('B3 tenant admin can block enrollment',r.ok);}
await db.exec(`set session_replication_role='replica'; update enrollments set blocked=false, certificate_issued=false, certificate_url=null, discount_amount=0 where user_id='${U.l2}'; set session_replication_role='origin';`);

// ---------- C. suspension gaps ----------
console.log('--- C. suspended tenant ---');
await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C2','${noraT}',true)`);
await as(db,'owner',`update tenants set status='suspended' where id='${noraT}'`);
t('C1 suspended-tenant learner CANNOT read tenant course (fail-closed)',(await cnt(db,'l2',`select count(*) n from courses where title='Nora C1'`))===0);
const noraC2=(await db.query(`select id from courses where title='Nora C2'`)).rows[0].id;
{const r=await as(db,'l2',`insert into enrollments(user_id,course_id,status) values('${U.l2}','${noraC2}','pending')`);t('C2 suspended-tenant learner CANNOT enroll (fail-closed)',!r.ok);}
t('C3 suspended tenant admin loses write access',(await cnt(db,'noraU',`with u as (update courses set title='x' where id='${noraC}' returning 1) select count(*) n from u`))===0);
{const r=await as(db,'outsider',`select join_tenant_as_learner('nora')`);t('C4 new learner cannot join suspended tenant',!r.ok);}
await as(db,'owner',`update tenants set status='active' where id='${noraT}'`);
await db.exec(`delete from enrollments where course_id='${noraC2}'`);

// ---------- N. sessions/submissions/grading: candidate4 closes D1/D2, adversarial bounds on REAL legacy schema ----------
console.log('--- N. sessions/submissions/grading (cand4) ---');
await as(db,'owner',`insert into courses(title,tenant_id,active,price) values('Owner NC', public.platform_tenant_id(), true, 100)`);
const onC=(await db.query(`select id from courses where title='Owner NC'`)).rows[0].id;
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at,duration_minutes) values('${noraC}','Live 1',now(),60)`);t('N1 tenant admin CAN create session on own course (D1 closed)',r.ok);}
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at) values('${onC}','hijack',now())`);t('N2 tenant admin CANNOT create session on owner course',!r.ok);}
const sessN=(await db.query(`select id from course_sessions where course_id='${noraC}' limit 1`)).rows[0].id;
{const r=await as(db,'noraU',`update course_sessions set title='renamed' where id='${sessN}'`);t('N3 tenant admin CAN edit own session',r.ok);}
{const r=await as(db,'noraU',`delete from course_sessions where id='${sessN}'`);const gone=Number((await db.query(`select count(*) n from course_sessions where id='${sessN}'`)).rows[0].n)===0;t('N4 tenant admin CAN delete own session (FOR ALL policy)',r.ok&&gone);}
await db.exec(`insert into course_sessions(course_id,title,starts_at) values('${onC}','OwnerS',now())`);
const oSess=(await db.query(`select id from course_sessions where course_id='${onC}'`)).rows[0].id;
t('N5 tenant admin CANNOT touch owner session (0 rows)',(await cnt(db,'noraU',`with u as (update course_sessions set title='x' where id='${oSess}' returning 1) select count(*) n from u`))===0);
t('N6 tenant admin CANNOT delete owner session (0 rows)',(await cnt(db,'noraU',`with d as (delete from course_sessions where id='${oSess}' returning 1) select count(*) n from d`))===0);
await db.exec(`insert into course_modules(course_id,title,order_index) values('${noraC}','m0',1)`);const mod0=(await db.query(`select id from course_modules where course_id='${noraC}' limit 1`)).rows[0].id;
{const r=await as(db,'noraU',`insert into assignments(module_id,course_id,title) values('${mod0}','${noraC}','a1')`);t('N7 tenant admin CAN create assignment on own course',r.ok);}
const asg=(await db.query(`select id from assignments where course_id='${noraC}' and title='a1'`)).rows[0].id;
{const r=await as(db,'l2',`insert into assignment_submissions(assignment_id,user_id,content) values('${asg}','${U.l2}','my work')`);t('N8 approved tenant learner CAN submit (legacy insert policy intact)',r.ok);if(!r.ok)console.log('N8 ERR:',r.err);}
{const r=await as(db,'l2',`insert into assignment_submissions(assignment_id,user_id,content,score) values('${asg}','${U.l2}','x',5)`);t('N9 learner CANNOT self-score at insert (legacy guard)',!r.ok);}
t('N10 tenant admin CAN read own-tenant submission (D2 closed)',(await cnt(db,'noraU',`select count(*) n from assignment_submissions where assignment_id='${asg}'`))===1);
{const r=await as(db,'noraU',`update assignment_submissions set score=80, feedback='good', graded_at=now() where assignment_id='${asg}'`);const sc=(await db.query(`select score from assignment_submissions where assignment_id='${asg}'`)).rows[0].score;t('N11 tenant admin CAN grade within max (score 80/100)',r.ok&&Number(sc)===80);}
{const r=await as(db,'noraU',`update assignment_submissions set score=101 where assignment_id='${asg}'`);t('N12 score above max_score refused',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set score=-1 where assignment_id='${asg}'`);t('N13 negative score refused',!r.ok);}
await db.exec(`update assignments set max_score=50 where id='${asg}'`);
{const r=await as(db,'noraU',`update assignment_submissions set score=60 where assignment_id='${asg}'`);t('N14 score above CUSTOM max_score (50) refused',!r.ok);}
await db.exec(`update assignments set max_score=100 where id='${asg}'`);
{const r=await as(db,'noraU',`update assignment_submissions set content='rewritten' where assignment_id='${asg}'`);t('N15 trainer CANNOT rewrite learner content',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set link='https://evil.example/x' where assignment_id='${asg}'`);t('N16 trainer CANNOT rewrite learner link',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set user_id='${U.outsider}' where assignment_id='${asg}'`);t('N17 trainer CANNOT reassign submission owner',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set submitted_at=now()-interval '30 days' where assignment_id='${asg}'`);t('N18 trainer CANNOT backdate submitted_at',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set assignment_id='${asg}' where assignment_id='${asg}'`);t('N19 no-op update still allowed (regression guard)',r.ok);}
t('N20 tenant admin CANNOT delete submission (no DELETE policy, 0 rows)',(await cnt(db,'noraU',`with d as (delete from assignment_submissions where assignment_id='${asg}' returning 1) select count(*) n from d`))===0);
t('N20b submission still there after delete attempt',Number((await db.query(`select count(*) n from assignment_submissions where assignment_id='${asg}'`)).rows[0].n)===1);
{const r=await as(db,'noraU',`insert into assignment_submissions(assignment_id,user_id,content) values('${asg}','${U.outsider}','ghost')`);t('N21 tenant admin CANNOT insert submission as another user',!r.ok);}
await db.exec(`insert into course_modules(course_id,title,order_index) values('${onC}','om',1)`);const omod=(await db.query(`select id from course_modules where course_id='${onC}' limit 1`)).rows[0].id;
await db.exec(`insert into assignments(module_id,course_id,title) values('${omod}','${onC}','ownerHW')`);const oAsg=(await db.query(`select id from assignments where course_id='${onC}'`)).rows[0].id;
await db.exec(`insert into assignment_submissions(assignment_id,user_id,content) values('${oAsg}','${U.outsider}','owner work')`);
t('N22 tenant admin CANNOT read owner-course submission',(await cnt(db,'noraU',`select count(*) n from assignment_submissions where assignment_id='${oAsg}'`))===0);
t('N23 tenant admin CANNOT grade owner-course submission (0 rows)',(await cnt(db,'noraU',`with u as (update assignment_submissions set score=1 where assignment_id='${oAsg}' returning 1) select count(*) n from u`))===0&&(await db.query(`select score from assignment_submissions where assignment_id='${oAsg}'`)).rows[0].score===null);
// cross-tenant: second trainer sara cannot see nora submissions
await db.exec(`insert into auth.users(id,email) values('00000000-0000-0000-0000-0000000000b3','sara2b@x.test')`);
const saraU='00000000-0000-0000-0000-0000000000b3';U.saraU=saraU;
await as(db,'saraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${saraU}','Sara2','sara2')`);
await as(db,'owner',`select approve_tenant_request(id,5,true,true,true) from tenant_requests where user_id='${saraU}'`);
t('N24 other-tenant admin CANNOT read nora submission',(await cnt(db,'saraU',`select count(*) n from assignment_submissions where assignment_id='${asg}'`))===0);
t('N25 other-tenant admin CANNOT grade nora submission (0 rows)',(await cnt(db,'saraU',`with u as (update assignment_submissions set score=5 where assignment_id='${asg}' returning 1) select count(*) n from u`))===0&&Number((await db.query(`select score from assignment_submissions where assignment_id='${asg}'`)).rows[0].score)===80);
t('N26 outsider CANNOT read nora submission (sees only own)',(await cnt(db,'outsider',`select count(*) n from assignment_submissions where assignment_id='${asg}'`))===0);
t('N27 learner CANNOT edit after grading (legacy policy, 0 rows)',(await cnt(db,'l2',`with u as (update assignment_submissions set content='edited by learner' where assignment_id='${asg}' returning 1) select count(*) n from u`))===0);
await db.exec(`update assignment_submissions set graded_at=null, score=null, feedback=null where assignment_id='${asg}'`);
{const r=await as(db,'l2',`update assignment_submissions set content='edited while ungraded' where assignment_id='${asg}'`);t('N28 learner CAN edit own ungraded submission (trigger early-return regression)',r.ok);}
{const r=await as(db,'l2',`update assignment_submissions set score=99 where assignment_id='${asg}'`);t('N29 learner CANNOT self-score on update (legacy guard)',!r.ok);}
{const r=await as(db,'owner',`update assignment_submissions set score=95, graded_at=now() where assignment_id='${asg}'`);t('N30 platform admin CAN still grade anything (regression)',r.ok);}
// M. logo_url constraint (landing row created first so UPDATEs actually match a row)
console.log('--- M. logo_url https-only (F2) ---');
await db.exec(`insert into tenant_landing(tenant_id,headline) values('${noraT}','h')`);
{const bad=['javascript:alert(1)','data:image/png;base64,AAAA','http://tracker.example/p.png','//x.example/a.png','ftp://x/y.png'];let allBad=true;for(const u of bad){const n=await cnt(db,'noraU',`with x as (update tenant_landing set logo_url='${u}' where tenant_id='${noraT}' returning 1) select count(*) n from x`);if(n>0)allBad=false;}t('M1 unsafe logo_url schemes refused (js/data/http/proto-rel/ftp, 0 rows each)',allBad);}
{const r=await as(db,'noraU',`update tenant_landing set logo_url='https://cdn.example.com/logo.png' where tenant_id='${noraT}'`);t('M2 https logo_url accepted',r.ok);}
{const n3=await cnt(db,'noraU',`with x as (update tenant_landing set logo_url='https://evil.example/x.png?\" onload=\"' where tenant_id='${noraT}' returning 1) select count(*) n from x`);t('M3 https with quote/injection chars refused by regex (0 rows or check error)',n3<=0);}
{const r=await as(db,'noraU',`update tenant_landing set logo_url=null where tenant_id='${noraT}'`);t('M4 null logo_url accepted (clear)',r.ok);}
// residual D3 storage prefix checks kept below
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','t/${noraT}/c.pdf')`);t('D3 tenant admin CAN upload certificate under own prefix',r.ok);}

// ---------- P. candidate6: tenant learner course-files read (14e) + tenant admin write path ----------
console.log('--- P. learner course-files policy (cand6) ---');
await db.exec(`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/lesson1.pdf')`);
t('P1 approved unblocked tenant learner CAN read own course file',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='course-files' and name='t/${noraT}/${noraC}/lesson1.pdf'`))===1);
await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C3','${noraT}',true)`);
const noraC3=(await db.query(`select id from courses where title='Nora C3'`)).rows[0].id;
await db.exec(`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC3}/other.pdf')`);
t('P2 same-tenant learner WITHOUT enrollment in that course CANNOT read its files',(await cnt(db,'l2',`select count(*) n from storage.objects where name='t/${noraT}/${noraC3}/other.pdf'`))===0);
t('P3 outsider CANNOT read tenant course files',(await cnt(db,'outsider',`select count(*) n from storage.objects where name='t/${noraT}/${noraC}/lesson1.pdf'`))===0);
await db.exec(`set session_replication_role='replica'; update enrollments set blocked=true where user_id='${U.l2}' and course_id='${noraC}'; set session_replication_role='origin';`);
t('P4 blocked learner CANNOT read course files',(await cnt(db,'l2',`select count(*) n from storage.objects where name='t/${noraT}/${noraC}/lesson1.pdf'`))===0);
await db.exec(`set session_replication_role='replica'; update enrollments set blocked=false where user_id='${U.l2}' and course_id='${noraC}'; set session_replication_role='origin';`);
await db.exec(`set session_replication_role='replica'; update enrollments set status='pending' where user_id='${U.l2}' and course_id='${noraC}'; set session_replication_role='origin';`);
t('P5 pending-enrollment learner CANNOT read course files',(await cnt(db,'l2',`select count(*) n from storage.objects where name='t/${noraT}/${noraC}/lesson1.pdf'`))===0);
await db.exec(`set session_replication_role='replica'; update enrollments set status='approved' where user_id='${U.l2}' and course_id='${noraC}'; set session_replication_role='origin';`);
await db.exec(`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/not-a-uuid/x.pdf')`);
{const r=await as(db,'l2',`select count(*) n from storage.objects where name='t/${noraT}/not-a-uuid/x.pdf'`);t('P6 non-uuid course segment: no cast error, no read',r.ok&&Number(r.rows[0].n)===0);}
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/upload0.pdf')`);t('P7a lesson_files UNSET: course-file upload REFUSED even with tools_upload on (c9 separation)',!r.ok);}
await as(db,'owner',`update tenants set extra_features='{"lesson_files":true}' where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/upload1.pdf')`);t('P7b tenant admin CAN upload course file once owner enables lesson_files',r.ok);}
await as(db,'owner',`update tenants set extra_features='{"lesson_files":false}' where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/upload2.pdf')`);t('P8 owner disabling lesson_files BLOCKS course-file upload (gate works on reused editor path)',!r.ok);}
await as(db,'owner',`update tenants set extra_features='{"lesson_files":true}' where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('course-files','t/${U.owner}/x.pdf')`);t('P9 tenant admin CANNOT upload course file under foreign prefix',!r.ok);}

// ---------- E. suspended platform admin inconsistency ----------
console.log('--- E. suspended platform admin ---');
await db.exec(`update public.user_roles set is_suspended=true where user_id='${U.owner}' and role='admin'`);
t('E1 suspended admin cannot manage tenants (is_platform_admin)',(await cnt(db,'owner',`with u as (update tenants set max_courses=9 where id='${noraT}' returning 1) select count(*) n from u`))===0);
{const r=await as(db,'owner',`update courses set title='still works' where id='${noraC}'`);const ok=(await db.query(`select title from courses where id='${noraC}'`)).rows[0].title==='still works';t('E2 suspended admin STILL manages courses (has_role path)',r.ok&&ok);}
await db.exec(`update public.user_roles set is_suspended=false where user_id='${U.owner}' and role='admin'`);
await db.exec(`update courses set title='Nora C1' where id='${noraC}'`);

// ---------- F. misc ----------
console.log('--- F. misc ---');
{await db.exec(`insert into auth.users(id,email) values('00000000-0000-0000-0000-0000000000d3','sara2@x.test')`);
 await as(db,null,``).catch(()=>{});
 const r1=await as(db,'outsider',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.outsider}','Dup','nora')`);
 t('F1 duplicate slug request accepted at intake (no precheck)',r1.ok);
 const r2=await as(db,'owner',`select approve_tenant_request(id) from tenant_requests where user_id='${U.outsider}'`);
 t('F2 approving duplicate slug fails with clean slug-taken error',!r2.ok && /slug already taken/.test(r2.err||''));
 t('F3 failed approval leaves request pending',(await cnt(db,'owner',`select count(*) n from tenant_requests where user_id='${U.outsider}' and status='pending'`))===1);}
await db.exec(`reset role`);
{const r=await (async()=>{await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false)`);try{return {rows:(await db.query(`select count(*) n from tenants`)).rows};}finally{await db.exec('reset role');}})();
 t('F4 anon cannot list tenants',Number(r.rows[0].n)===0);}

console.log('--- RPC tenant exposure ---');
{await as(db,'owner',`update enrollments set certificate_issued=true, certificate_url='t/${noraT}/'||id||'.pdf', name_ar='متدربة نورا' where user_id='${U.l2}'`);
 const enr=(await db.query(`select id from enrollments where user_id='${U.l2}'`)).rows[0].id;
 await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false)`);
 const vc=(await db.query(`select verify_certificate('${enr}') v`)).rows[0].v;
 await db.exec('reset role');
 t('R1 verify_certificate returns issuer_name (trainer brand, not owner) for tenant-course cert',vc&&vc.ok===true&&vc.issuer_name==='Nora');
 await db.exec(`insert into course_feedback(user_id,course_id,content_rating,comments) values('${U.l2}','${noraC}',5,'great tenant course')`);
 // fixture: feature the feedback (the guard trigger blocks every normal write path; replica
 // mode simulates the platform operator marking it featured)
 await db.exec(`set session_replication_role='replica'; update course_feedback set is_featured=true where course_id='${noraC}'; set session_replication_role='origin';`);
 // read as the anonymous public visitor (owner homepage)
 await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false)`);
 const fr=(await db.query(`select course_title from get_featured_feedback()`)).rows;
 await db.exec('reset role');
 t('R2 get_featured_feedback now EXCLUDES tenant courses from owner homepage',!fr.some(r=>r.course_title==='Nora C1'));}

// ---------- T. candidate2 trigger-scope residuals ----------
console.log('--- T. candidate2 residuals ---');
await as(db,'owner',`insert into courses(title,tenant_id,active) values('Owner C1', public.platform_tenant_id(), true)`);
const ownerC=(await db.query(`select id from courses where title='Owner C1'`)).rows[0].id;
{const r=await db.exec(`insert into public.course_trainers(course_id,user_id) values('${ownerC}','${U.legacyTrainer}')`).then(()=>({ok:true})).catch(e=>({ok:false,err:e.message}));
 t('T1 legacy trainer link to PLATFORM course still allowed (owner path untouched)',r.ok);}
{const r=await as(db,'noraU',`update courses set tenant_id=public.platform_tenant_id() where id='${noraC}'`);
 t('T2 tenant admin CANNOT reassign course tenant (trigger blocks)',!r.ok);}
// platform admin CAN reassign; a pre-existing legacy link follows the course into the tenant
await db.exec(`set session_replication_role='replica'; insert into enrollments(user_id,course_id,status) values('${U.l2}','${ownerC}','approved'); set session_replication_role='origin';`);
await as(db,'owner',`update courses set tenant_id='${noraT}' where id='${ownerC}'`);
await db.exec(`create or replace function public.is_trainer_of_course(_course_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.course_trainers ct join public.user_roles ur on ur.user_id=ct.user_id and ur.role='trainer' where ct.course_id=_course_id and ct.user_id=auth.uid() and ur.is_suspended=false) $$`);
t('T3a owner-course reassigned into tenant + stale link + restored body: enrollment READS stay CLOSED (full chain)',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${ownerC}'`))===0);
await db.exec(`create or replace function public.trainer_has_perm(_course_id uuid, _perm text) returns boolean language plpgsql stable security definer set search_path = public as $f$ declare _ok boolean; begin execute format('select coalesce(bool_or(tp.%I), false) from public.course_trainers ct join public.trainer_permissions tp on tp.course_trainer_id = ct.id join public.user_roles ur on ur.user_id = ct.user_id and ur.role = ''trainer'' where ct.course_id = $1 and ct.user_id = auth.uid() and ur.is_suspended = false', _perm) into _ok using _course_id; return coalesce(_ok, false); end; $f$`);
await db.exec(`insert into public.trainer_permissions(course_trainer_id) select id from public.course_trainers where course_id='${ownerC}' and user_id='${U.legacyTrainer}' on conflict do nothing`);
{const r=await as(db,'legacyTrainer',`insert into course_modules(course_id,title,order_index) values('${ownerC}','hijack module',9)`);t('T3b full reversal: module WRITE into reassigned course REOPENS',r.ok);}
await db.exec(`create or replace function public.is_trainer_of_course(_course_id uuid) returns boolean language sql stable security definer set search_path to 'public' as $$ select false $$`);
await db.exec(`create or replace function public.trainer_has_perm(_course_id uuid, _perm text) returns boolean language sql stable security definer set search_path to 'public' as $$ select false $$`);

// ---------- K. candidate3 finance/coupons/storage/owner gates ----------
console.log('--- K. candidate3 coupons/payments/storage/gates ---');
await as(db,'owner',`insert into coupons(code,discount_type,discount_value) values('OWNER10','percent',10)`);
await as(db,'noraU',`insert into coupons(code,discount_type,discount_value,tenant_id) values('NORA20','percent',20,'${noraT}')`);
await as(db,'owner',`insert into courses(title,tenant_id,active,price) values('Owner KC', public.platform_tenant_id(), true, 200)`);
const okc=(await db.query(`select id from courses where title='Owner KC'`)).rows[0].id;
{const v=(await as(db,'l2',`select validate_coupon('OWNER10','${okc}') v`)).rows[0].v;t('K1 platform coupon validates on owner course',v&&v.ok===true);}
{const v=(await as(db,'l2',`select validate_coupon('OWNER10','${noraC}') v`)).rows[0].v;t('K2 platform coupon NOT valid on tenant course',v&&v.ok===false);}
{const v=(await as(db,'l2',`select validate_coupon('NORA20','${noraC}') v`)).rows[0].v;t('K3 tenant coupon validates on own tenant course',v&&v.ok===true);}
{const v=(await as(db,'l2',`select validate_coupon('NORA20','${okc}') v`)).rows[0].v;t('K4 tenant coupon NOT valid on owner course',v&&v.ok===false);}
{const v=(await as(db,'l2',`select apply_coupon_to_enrollment((select id from enrollments where user_id='${U.l2}' and course_id='${noraC}'),'NORA20') v`)).rows[0].v;t('K5 learner CAN apply tenant coupon to own enrollment (guard bypass works)',v&&v.ok===true&&Number(v.discount_amount)>0);}
{const v=(await as(db,'l2',`select apply_coupon_to_enrollment((select id from enrollments where user_id='${U.l2}' and course_id='${noraC}'),'NORA20') v`)).rows[0].v;t('K6 second coupon apply refused',v&&v.ok===false);}
t('K7 tenant admin CANNOT read platform coupons',(await cnt(db,'noraU',`select count(*) n from coupons where code='OWNER10'`))===0);
t('K8 tenant admin CAN read own coupons',(await cnt(db,'noraU',`select count(*) n from coupons where code='NORA20'`))===1);
t('K9 signed-in non-member CANNOT list coupons (no broad read policy)',(await cnt(db,'outsider',`select count(*) n from coupons`))===0);
const enrK=(await db.query(`select id from enrollments where user_id='${U.l2}' and course_id='${noraC}'`)).rows[0].id;
{const r=await as(db,'noraU',`insert into payments(enrollment_id,amount) values('${enrK}',50)`);t('K10 tenant admin CAN record payment on own-tenant enrollment',r.ok);}
await db.exec(`set session_replication_role='replica'; insert into enrollments(user_id,course_id,status) values('${U.outsider}','${okc}','approved'); set session_replication_role='origin';`);
const enrKO=(await db.query(`select id from enrollments where course_id='${okc}'`)).rows[0].id;
{const r=await as(db,'noraU',`insert into payments(enrollment_id,amount) values('${enrKO}',50)`);t('K11 tenant admin CANNOT record payment on owner-course enrollment',!r.ok);}
t('K12 tenant admin CANNOT read owner-course payments',(await cnt(db,'noraU',`select count(*) n from payments where enrollment_id='${enrKO}'`))===0);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','app/owner-cert.pdf')`);t('K13 tenant admin CANNOT write outside own certificates prefix',!r.ok);}
await as(db,'owner',`update tenants set feature_tools_upload=false where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('tool-assets','t/${noraT}/tool.zip')`);t('K14 tool upload BLOCKED while owner switch off',!r.ok);}
await as(db,'owner',`update tenants set feature_tools_upload=true where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('tool-assets','t/${noraT}/tool.zip')`);t('K15 tool upload works when owner switch ON',r.ok);}
t('K16 trainer CANNOT self-enable owner gates (0 rows)',(await cnt(db,'noraU',`with u as (update tenants set feature_theme=true where id='${noraT}' returning 1) select count(*) n from u`))===0);
await as(db,'noraU',`insert into tenant_landing(tenant_id) values('${noraT}') on conflict do nothing`);
{const r=await as(db,'noraU',`update tenant_landing set theme='ocean' where tenant_id='${noraT}'`);t('K17 theme change BLOCKED while owner theme gate off',!r.ok);}
await as(db,'owner',`update tenants set feature_theme=true where id='${noraT}'`);
{const r=await as(db,'noraU',`update tenant_landing set theme='ocean' where tenant_id='${noraT}'`);t('K18 theme change works when owner enables gate',r.ok);}
const certPath=`t/${noraT}/${enrK}.pdf`;
await db.exec(`set session_replication_role='replica'; insert into storage.objects(bucket_id,name) values('certificates','${certPath}'); set session_replication_role='origin';`);
t('K19 learner CAN read own issued certificate file',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='certificates' and name='${certPath}'`))===1);
t('K20 outsider CANNOT read tenant certificate file',(await cnt(db,'outsider',`select count(*) n from storage.objects where bucket_id='certificates' and name='${certPath}'`))===0);
console.log(`\nEXTRA RESULT pass=${pass} fail=${fail}`);

// ---------- G. rollback on clean owner-only state ----------
console.log('--- G. rollback ---');
const db2=await freshDB();
await db2.exec(`insert into auth.users(id,email) values('${U.owner}','owner@x.test'),('${U.l2}','l@x.test')`);
await db2.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await db2.exec(`insert into public.courses(id,title,active,price,description) values ('11111111-1111-1111-1111-111111111111','Owner course',true,123.45,'keepme')`);
await db2.exec(`insert into public.enrollments(user_id,course_id,status) values('${U.l2}','11111111-1111-1111-1111-111111111111','approved')`);
try{
  await db2.exec(fs.readFileSync(new URL('./20261128100000_tenant_foundation.down.cand6.sql',import.meta.url),'utf8'));
  const c=(await db2.query(`select title,price,description from courses where id='11111111-1111-1111-1111-111111111111'`)).rows[0];
  t('G1 rollback keeps owner course data intact',c&&c.title==='Owner course'&&Number(c.price)===123.45&&c.description==='keepme');
  t('G2 rollback keeps owner enrollment',(await db2.query(`select count(*) n from enrollments`)).rows[0].n==='1'||(await db2.query(`select count(*) n from enrollments`)).rows[0].n===1);
  const pols=(await db2.query(`select polname, pg_get_expr(polqual,'public.courses'::regclass) q from pg_policy where polrelid='public.courses'::regclass and polcmd='r' order by 1`)).rows;
  t('G3 rollback restores tenant-free course read policies',pols.every(p=>!(p.q||'').includes('tenant_id'))&&pols.length>=2);
  t('G4 tenant tables dropped',(await db2.query(`select count(*) n from pg_tables where schemaname='public' and tablename like 'tenant%'`)).rows[0].n==='0'||(await db2.query(`select count(*) n from pg_tables where schemaname='public' and tablename like 'tenant%'`)).rows[0].n===0);
  const guard=(await db2.query(`select prosrc from pg_proc where proname='trg_enrollment_guard_trainee'`)).rows[0].prosrc;
  t('G5 enrollment guard restored (no tenant clause)',!guard.includes('is_tenant_admin'));
  t('G6 rollback drops course_trainers platform-only trigger',Number((await db2.query(`select count(*) n from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relname='course_trainers' and t.tgname='course_trainers_platform_only'`)).rows[0].n)===0);
  t('G7 rollback drops coupons.tenant_id and restores global code uniqueness',Number((await db2.query(`select count(*) n from pg_attribute where attrelid='public.coupons'::regclass and attname='tenant_id' and not attisdropped`)).rows[0].n)===0);
}catch(e){fail++;console.log('FAIL G rollback errored:',e.message,(e.hint||''),(e.detail||''));}

// ---------- H. rollback refuses with trainer data ----------
const db3=await freshDB();
await db3.exec(`insert into auth.users(id,email) values('${U.owner}','owner@x.test'),('${U.noraU}','n@x.test')`);
await db3.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await as(db3,'noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await as(db3,'owner',`select approve_tenant_request(id) from tenant_requests where user_id='${U.noraU}'`);
try{
  await db3.exec(fs.readFileSync(new URL('./20261128100000_tenant_foundation.down.cand6.sql',import.meta.url),'utf8'));
  fail++;console.log('FAIL H1 rollback should have refused but succeeded');
}catch(e){
  await db3.exec('rollback').catch(()=>{});
  t('H1 rollback refuses when trainer tenant exists',/rollback refused/.test(e.message));
  t('H2 tenant data preserved after refused rollback',(await db3.query(`select count(*) n from tenants`)).rows[0].n>=1);
}
console.log(`\nFINAL EXTRA RESULT pass=${pass} fail=${fail}`);
