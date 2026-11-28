import {PGlite} from '@electric-sql/pglite';import fs from 'fs';
const dir=new URL('../migrations',import.meta.url).pathname;
async function freshDB(){
  const db=new PGlite();
  await db.exec(fs.readFileSync(new URL('./stubs.sql',import.meta.url),'utf8'));
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
{let ok=true;try{await db.exec(`insert into public.course_trainers(course_id,user_id) values('${noraC}','${U.legacyTrainer}')`);}catch(e){ok=false;} t('A0 legacy trainer link to tenant course is REFUSED (fix)',!ok);}
console.log('--- A. legacy trainer row on a tenant course ---');
t('A1 legacy trainer cannot read cross-tenant enrollments (fixed)',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
{const r=await as(db,'legacyTrainer',`insert into course_modules(course_id,title,order_index) values('${noraC}','hijack module',9)`);t('A2 legacy trainer cannot WRITE module in tenant course (fixed)',!r.ok);}
t('A3 legacy trainer cannot read learner profile cross-tenant (fixed)',(await cnt(db,'legacyTrainer',`select count(*) n from profiles where id='${U.l2}'`))===0);
t('A4 legacy trainer UPDATE enrollment hits 0 rows (perm-gated)',(await cnt(db,'legacyTrainer',`with u as (update enrollments set status='rejected' where user_id='${U.l2}' returning 1) select count(*) n from u`))===0);
// without the stale user_roles 'trainer' row the same course_trainers row grants nothing
await db.exec(`delete from public.user_roles where user_id='${U.legacyTrainer}' and role='trainer'`);
t('A5 without trainer role row, legacy assignment grants nothing',(await cnt(db,'legacyTrainer',`select count(*) n from enrollments where course_id='${noraC}'`))===0);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.legacyTrainer}','trainer') on conflict do nothing`);

// ---------- B. tenant admin powers over enrollments ----------
console.log('--- B. tenant admin enrollment powers ---');
{const r=await as(db,'noraU',`update enrollments set certificate_issued=true, certificate_url='https://attacker.example/cert.pdf' where user_id='${U.l2}'`);t('B1 tenant admin can NOT issue certificate (fixed)',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set discount_amount=999, coupon_code='SELF', grace_until=now()+interval '1 year' where user_id='${U.l2}'`);t('B2 tenant admin can NOT set discount/coupon/grace (fixed)',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set blocked=true where user_id='${U.l2}'`);t('B3 tenant admin can block enrollment',r.ok);}
await as(db,'noraU',`update enrollments set blocked=false, certificate_issued=false, certificate_url=null where user_id='${U.l2}'`);

// ---------- C. suspension gaps ----------
console.log('--- C. suspended tenant ---');
await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C2','${noraT}',true)`);
await as(db,'owner',`update tenants set status='suspended' where id='${noraT}'`);
t('C1 approved learner no longer reads suspended-tenant course (fixed)',(await cnt(db,'l2',`select count(*) n from courses where title='Nora C1'`))===0);
const noraC2=(await db.query(`select id from courses where title='Nora C2'`)).rows[0].id;
{const r=await as(db,'l2',`insert into enrollments(user_id,course_id,status) values('${U.l2}','${noraC2}','pending')`);t('C2 approved learner can NOT enroll in suspended-tenant course (fixed)',!r.ok);}
t('C3 suspended tenant admin loses write access',(await cnt(db,'noraU',`with u as (update courses set title='x' where id='${noraC}' returning 1) select count(*) n from u`))===0);
{const r=await as(db,'outsider',`select join_tenant_as_learner('nora')`);t('C4 new learner cannot join suspended tenant',!r.ok);}
await as(db,'owner',`update tenants set status='active' where id='${noraT}'`);
await db.exec(`delete from enrollments where course_id='${noraC2}'`);

// ---------- D. functional gaps (not security) ----------
console.log('--- D. functional gaps ---');
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at,duration_minutes) values('${noraC}','s',now(),60)`);t('D1 tenant admin CANNOT create course_sessions (no policy)',!r.ok);}
await db.exec(`insert into assignments(course_id,title) values('${noraC}','a1')`);
const asg=(await db.query(`select id from assignments where course_id='${noraC}'`)).rows[0].id;
await db.exec(`insert into assignment_submissions(assignment_id,user_id,link) values('${asg}','${U.l2}','https://x.test/f.pdf')`);
t('D2 tenant admin CANNOT read submissions of own tenant course',(await cnt(db,'noraU',`select count(*) n from assignment_submissions where assignment_id='${asg}'`))===0);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','t/${noraT}/c.pdf')`);t('D3 tenant admin CANNOT upload to certificates bucket',!r.ok);}

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
 t('F2 approving duplicate slug fails with raw unique-violation',!r2.ok && /slug already taken/.test(r2.err));
 t('F3 failed approval leaves request pending',(await cnt(db,'owner',`select count(*) n from tenant_requests where user_id='${U.outsider}' and status='pending'`))===1);}
await db.exec(`reset role`);
{const r=await (async()=>{await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false)`);try{return {rows:(await db.query(`select count(*) n from tenants`)).rows};}finally{await db.exec('reset role');}})();
 t('F4 anon cannot list tenants',Number(r.rows[0].n)===0);}

console.log(`\nEXTRA RESULT pass=${pass} fail=${fail}`);

// ---------- G. rollback on clean owner-only state ----------
console.log('--- G. rollback ---');
const db2=await freshDB();
await db2.exec(`insert into auth.users(id,email) values('${U.owner}','owner@x.test'),('${U.l2}','l@x.test')`);
await db2.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await db2.exec(`insert into public.courses(id,title,active,price,description) values ('11111111-1111-1111-1111-111111111111','Owner course',true,123.45,'keepme')`);
await db2.exec(`insert into public.enrollments(user_id,course_id,status) values('${U.l2}','11111111-1111-1111-1111-111111111111','approved')`);
try{
  await db2.exec(fs.readFileSync(new URL('./20261128100000_tenant_foundation.down.sql',import.meta.url),'utf8'));
  const c=(await db2.query(`select title,price,description from courses where id='11111111-1111-1111-1111-111111111111'`)).rows[0];
  t('G1 rollback keeps owner course data intact',c&&c.title==='Owner course'&&Number(c.price)===123.45&&c.description==='keepme');
  t('G2 rollback keeps owner enrollment',(await db2.query(`select count(*) n from enrollments`)).rows[0].n==='1'||(await db2.query(`select count(*) n from enrollments`)).rows[0].n===1);
  const pols=(await db2.query(`select polname, pg_get_expr(polqual,'public.courses'::regclass) q from pg_policy where polrelid='public.courses'::regclass and polcmd='r' order by 1`)).rows;
  t('G3 rollback restores tenant-free course read policies',pols.every(p=>!(p.q||'').includes('tenant_id'))&&pols.length>=2);
  t('G4 tenant tables dropped',(await db2.query(`select count(*) n from pg_tables where schemaname='public' and tablename like 'tenant%'`)).rows[0].n==='0'||(await db2.query(`select count(*) n from pg_tables where schemaname='public' and tablename like 'tenant%'`)).rows[0].n===0);
  const guard=(await db2.query(`select prosrc from pg_proc where proname='trg_enrollment_guard_trainee'`)).rows[0].prosrc;
  t('G5 enrollment guard restored (no tenant clause)',!guard.includes('is_tenant_admin'));
}catch(e){fail++;console.log('FAIL G rollback errored:',e.message);}

// ---------- H. rollback refuses with trainer data ----------
const db3=await freshDB();
await db3.exec(`insert into auth.users(id,email) values('${U.owner}','owner@x.test'),('${U.noraU}','n@x.test')`);
await db3.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await as(db3,'noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await as(db3,'owner',`select approve_tenant_request(id) from tenant_requests where user_id='${U.noraU}'`);
try{
  await db3.exec(fs.readFileSync(new URL('./20261128100000_tenant_foundation.down.sql',import.meta.url),'utf8'));
  fail++;console.log('FAIL H1 rollback should have refused but succeeded');
}catch(e){
  try{await db3.exec('rollback')}catch(_){}
  t('H1 rollback refuses when trainer tenant exists',/rollback refused/.test(e.message));
  t('H2 tenant data preserved after refused rollback',(await db3.query(`select count(*) n from tenants`)).rows[0].n>=1);
}
console.log(`\nFINAL EXTRA RESULT pass=${pass} fail=${fail}`);
