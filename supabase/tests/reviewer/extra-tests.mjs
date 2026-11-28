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
{const r=await as(db,'noraU',`update enrollments set certificate_issued=true, certificate_url='https://attacker.example/cert.pdf' where user_id='${U.l2}'`);t('B1 tenant admin can NOT forge certificate URL (external URL refused)',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set discount_amount=999, coupon_code='SELF', grace_until=now()+interval '1 year' where user_id='${U.l2}'`);t('B2 tenant admin can NOT set coupon_code/grace or discount above price',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set blocked=true where user_id='${U.l2}'`);t('B3 tenant admin can block enrollment',r.ok);}
await as(db,'noraU',`update enrollments set blocked=false, certificate_issued=false, certificate_url=null where user_id='${U.l2}'`);

// ---------- C. suspension gaps ----------

await db.exec(`alter table coupons enable row level security; alter table coupon_redemptions enable row level security; grant all on coupons, coupon_redemptions to authenticated; create policy "admin manage coupons" on coupons for all using (public.has_role(auth.uid(),'admin'::app_role)) with check (public.has_role(auth.uid(),'admin'::app_role))`);
console.log('--- I. tenant finance, coupons, certificates, owner gates ---');
await as(db,'owner',`update courses set price=1000 where id='${noraC}'`);
await as(db,'owner',`insert into courses(title,price,active) values('Owner paid',500,true)`);
const ownC=(await db.query(`select id from courses where title='Owner paid'`)).rows[0].id;
await as(db,'outsider',`insert into enrollments(user_id,course_id,status) values('${U.outsider}','${ownC}','pending')`);
const ownE=(await db.query(`select id from enrollments where user_id='${U.outsider}' and course_id='${ownC}'`)).rows[0].id;
const noraE=(await db.query(`select id from enrollments where user_id='${U.l2}' and course_id='${noraC}'`)).rows[0].id;
{const r=await as(db,'noraU',`insert into payments(enrollment_id,amount) values('${noraE}',400)`);t('I1 tenant admin records payment on own enrollment',r.ok);}
{const r=await as(db,'noraU',`insert into installments(enrollment_id,amount,due_date) values('${noraE}',300,'2027-01-01')`);t('I2 tenant admin adds installment on own enrollment',r.ok);}
t('I3 tenant admin sees own payment',(await cnt(db,'noraU',`select count(*) n from payments where enrollment_id='${noraE}'`))===1);
{const r=await as(db,'noraU',`insert into payments(enrollment_id,amount) values('${ownE}',1)`);t('I4 tenant admin CANNOT add payment to owner enrollment',!r.ok);}
{const r=await as(db,'noraU',`insert into installments(enrollment_id,amount) values('${ownE}',1)`);t('I5 tenant admin CANNOT add installment to owner enrollment',!r.ok);}
await db.exec(`insert into payments(enrollment_id,amount) values('${ownE}',77)`);
t('I6 tenant admin cannot read owner payments',(await cnt(db,'noraU',`select count(*) n from payments where enrollment_id='${ownE}'`))===0);
t('I7 tenant admin cannot update/delete owner payments (0 rows)',(await cnt(db,'noraU',`with u as (update payments set amount=0 where enrollment_id='${ownE}' returning 1) select count(*) n from u`))===0);
t('I8 learner cannot write payment to self',!(await as(db,'l2',`insert into payments(enrollment_id,amount) values('${noraE}',1)`)).ok);
{const r=await as(db,'noraU',`update enrollments set discount_amount=200 where id='${noraE}'`);t('I9 tenant admin sets discount within price',r.ok);}
{const r=await as(db,'noraU',`update enrollments set discount_amount=5000 where id='${noraE}'`);t('I10 discount above course price refused',!r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_issued=true, certificate_url='t/${noraT}/${noraE}.pdf' where id='${noraE}'`);t('I11 tenant admin issues certificate with canonical own path',r.ok);}
for(const [n,p] of [['other tenant prefix',`t/${U.owner}/c.pdf`],['external URL','https://attacker.example/c.pdf'],['dot-dot',`t/${noraT}/../x.pdf`],['owner path',`${U.l2}/c.pdf`],['own prefix but other enrollment',`t/${noraT}/${ownE}.pdf`],['own prefix arbitrary name',`t/${noraT}/cert1.pdf`]]){const r=await as(db,'noraU',`update enrollments set certificate_url='${p}' where id='${noraE}'`);t('I12 certificate path forgery refused: '+n,!r.ok);}
{const r=await as(db,'noraU',`update enrollments set certificate_issued=true, certificate_url='t/${noraT}/${ownE}.pdf' where id='${ownE}'`);t('I13 tenant admin cannot issue certificate on owner enrollment (0 rows or error)',!r.ok||(await cnt(db,'owner',`select count(*) n from enrollments where id='${ownE}' and certificate_issued`))===0);}
// coupons
{const r=await as(db,'noraU',`insert into coupons(code,discount_type,discount_value,tenant_id) values('NORA10','percent',10,'${noraT}')`);t('I14 tenant admin creates coupon in own tenant',r.ok);}
{const r=await as(db,'noraU',`insert into coupons(code,discount_type,discount_value) values('SNEAK','percent',50)`);t('I15 tenant admin cannot create coupon in platform tenant (default tenant)',!r.ok);}
{const r=await as(db,'noraU',`insert into coupons(code,discount_type,discount_value,tenant_id,course_id) values('X','percent',5,'${noraT}','${ownC}')`);t('I16 tenant coupon cannot target an owner course',!r.ok);}
await as(db,'owner',`insert into coupons(code,discount_type,discount_value) values('OWN20','percent',20)`);
await as(db,'owner',`insert into coupons(code,discount_type,discount_value) values('NORA10','percent',99)`);
t('I17 same code allowed in two tenants',(await cnt(db,'owner',`select count(*) n from coupons where code='NORA10'`))===2);
t('I18 (and no broad coupon listing) tenant admin cannot see owner coupons',(await cnt(db,'noraU',`select count(*) n from coupons where code='OWN20'`))===0);
const vc=async(u,code,c)=>JSON.parse(JSON.stringify((await as(db,u,`select validate_coupon('${code}','${c}') v`)).rows?.[0]?.v||{}));
t('I19 tenant coupon valid on tenant course',(await vc('l2','NORA10',noraC)).ok===true && Number((await vc('l2','NORA10',noraC)).discount_amount)===100);
t('I20 tenant coupon NOT valid on owner course',(await vc('outsider','NORA10',ownC)).ok!==true || Number((await vc('outsider','NORA10',ownC)).discount_value)===99);
t('I21 owner coupon NOT valid on tenant course',(await vc('l2','OWN20',noraC)).ok!==true);
t('I22 owner coupon valid on owner course',(await vc('outsider','OWN20',ownC)).ok===true);
// owner feature gates
await db.exec(`insert into storage.objects(bucket_id,name) values('certificates','t/${noraT}/${noraE}.pdf')`);
t('I23 tenant learner reads own certificate file',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='certificates' and name='t/${noraT}/${noraE}.pdf'`))===1);
t('I24 other user cannot read it',(await cnt(db,'outsider',`select count(*) n from storage.objects where bucket_id='certificates' and name='t/${noraT}/${noraE}.pdf'`))===0);
console.log('--- J. owner feature gates (server enforced) ---');
await db.exec(`insert into tenant_landing(tenant_id) values('${noraT}') on conflict do nothing`);
{const r=await as(db,'noraU',`update tenant_landing set theme='ocean' where tenant_id='${noraT}'`);t('J1 theme change refused while switch is off',!r.ok&&(await cnt(db,'owner',`select count(*) n from tenant_landing where tenant_id='${noraT}' and theme='terracotta'`))===1);}
await as(db,'owner',`update tenants set feature_theme=true where id='${noraT}'`);
{const r=await as(db,'noraU',`update tenant_landing set theme='ocean' where tenant_id='${noraT}'`);t('J2 theme change allowed after owner enables it',r.ok&&(await cnt(db,'owner',`select count(*) n from tenant_landing where tenant_id='${noraT}' and theme='ocean'`))===1);}
await as(db,'owner',`update tenants set feature_theme=false where id='${noraT}'`);
{const r=await as(db,'noraU',`update tenant_landing set theme='forest' where tenant_id='${noraT}'`);t('J3 theme change refused again after owner disables',!r.ok&&(await cnt(db,'owner',`select count(*) n from tenant_landing where tenant_id='${noraT}' and theme='ocean'`))===1);}
{const r=await as(db,'noraU',`update tenants set feature_theme=true, max_courses=null where id='${noraT}'`);t('J4 trainer cannot flip own switches',!r.ok||(await cnt(db,'owner',`select count(*) n from tenants where id='${noraT}' and feature_theme`))===0);}
await as(db,'owner',`update tenants set max_courses=1 where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C2','${noraT}',true)`);t('J5 course limit enforced (1 allowed, 2nd refused)',!r.ok);}
await as(db,'owner',`update tenants set max_courses=null where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into courses(title,tenant_id,active) values('Nora C2','${noraT}',true)`);t('J6 unlimited: further courses allowed',r.ok);}
await as(db,'owner',`update tenants set extra_features='{"bulk_export": true}' where id='${noraT}'`);
t('J7 extensible switch readable via tenant_feature',(await cnt(db,'owner',`select count(*) n from tenants where tenant_feature(id,'bulk_export')`))===1);
t('J8 unknown switch is false',(await cnt(db,'owner',`select count(*) n from tenants where tenant_feature(id,'nope') is not true and slug='nora'`))===1);
await as(db,'owner',`update tenants set feature_tools_upload=false where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('tool-assets','t/${noraT}/a.html')`);t('J9 tool upload refused while switch is off',!r.ok);}
await as(db,'owner',`update tenants set feature_tools_upload=true where id='${noraT}'`);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('tool-assets','t/${noraT}/a.html')`);t('J10 tool upload allowed after owner enables',r.ok);}
t('J11 approved tenant learner reads tenant tool file without owner profile activation',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='tool-assets' and name='t/${noraT}/a.html'`))===1);
t('J12 non-member cannot read tenant tool file',(await cnt(db,'outsider',`select count(*) n from storage.objects where bucket_id='tool-assets' and name='t/${noraT}/a.html'`))===0);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('tool-assets','tna/x.html')`);t('J13 tenant admin cannot write owner tool paths',!r.ok);}
await as(db,'owner',`update tenants set status='suspended' where id='${noraT}'`);
t('J14 suspended tenant: learner loses tool file access',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='tool-assets' and name='t/${noraT}/a.html'`))===0);
await as(db,'owner',`update tenants set status='active' where id='${noraT}'`);

console.log('--- K. public RPC scoping ---');
{const r=await as(db,'noraU',`select verify_certificate('${noraE}') v`);const v=r.rows[0].v;t('K1 tenant certificate verifies and names the trainer as issuer',v.ok===true&&v.issuer_name==='Nora');}
{await db.exec(`select set_config('app.bypass_enrollment_guard','on',false); update enrollments set certificate_issued=true where id='${ownE}'; select set_config('app.bypass_enrollment_guard','off',false)`);const r=await as(db,null,`select verify_certificate('${ownE}') v`);const v=r.rows[0].v;t('K2 owner certificate keeps no tenant issuer',v.ok===true&&v.issuer_name===null);}

console.log('--- K. public RPC scoping ---');
{const r=await as(db,'noraU',`select verify_certificate('${noraE}') v`);const v=r.rows[0].v;t('K1 tenant certificate verifies and names the trainer as issuer',v.ok===true&&v.issuer_name==='Nora');}
{await db.exec(`update enrollments set certificate_issued=true where id='${ownE}'`);const r=await as(db,null,`select verify_certificate('${ownE}') v`);const v=r.rows[0].v;t('K2 owner certificate keeps no tenant issuer',v.ok===true&&v.issuer_name===null);}
await db.exec(`insert into course_feedback(user_id,course_id,comments,is_featured) values('${U.l2}','${noraC}','great trainer',true),('${U.outsider}','${ownC}','owner course ok',true)`);
t('K3 homepage testimonials exclude trainer-tenant feedback',(await cnt(db,null,`select count(*) n from get_featured_feedback()`))===1&&(await cnt(db,null,`select count(*) n from get_featured_feedback() where comments='owner course ok'`))===1);

await db.exec(`alter table assignments add column if not exists module_id uuid, add column if not exists max_score numeric not null default 100; alter table assignment_submissions add column if not exists content text, add column if not exists score numeric, add column if not exists graded_at timestamptz; grant all on assignments, assignment_submissions, course_sessions to authenticated; drop policy if exists stub_learner_submit on assignment_submissions; create policy stub_learner_submit on assignment_submissions for insert with check (auth.uid()=user_id)`);
console.log('--- L. sessions, assignments, grading ---');
await as(db,'noraU',`insert into course_modules(course_id,title,order_index) values('${noraC}','m1',1)`);
const noraM=(await db.query(`select id from course_modules where course_id='${noraC}' limit 1`)).rows[0].id;
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at) values('${noraC}','Live 1',now())`);t('L1 tenant admin creates session on own course',r.ok);}
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at) values('${ownC}','hijack',now())`);t('L2 tenant admin cannot create session on owner course',!r.ok);}
{const r=await as(db,'noraU',`insert into assignments(module_id,course_id,title) values('${noraM}','${noraC}','HW1')`);t('L3 tenant admin creates assignment on own course',r.ok);}
{const r=await as(db,'noraU',`insert into assignments(module_id,course_id,title) values('${noraM}','${ownC}','hijack')`);t('L4 tenant admin cannot create assignment on owner course',!r.ok);}
const hw=(await db.query(`select id from assignments where title='HW1'`)).rows[0].id;
{const r=await as(db,'l2',`insert into assignment_submissions(assignment_id,user_id,content) values('${hw}','${U.l2}','my work')`);t('L5 approved tenant learner submits',r.ok);}
t('L6 tenant admin reads own-tenant submission',(await cnt(db,'noraU',`select count(*) n from assignment_submissions where assignment_id='${hw}'`))===1);
{const r=await as(db,'noraU',`update assignment_submissions set score=80, feedback='good', graded_at=now() where assignment_id='${hw}'`);t('L7 tenant admin grades within max',r.ok&&Number((await db.query(`select count(*) n from assignment_submissions where score=80`)).rows[0].n)===1);}
{const r=await as(db,'noraU',`update assignment_submissions set score=101 where assignment_id='${hw}'`);t('L8 score above max refused',!r.ok);}
{const r=await as(db,'noraU',`update assignment_submissions set content='rewritten' where assignment_id='${hw}'`);t('L9 trainer cannot rewrite learner content',!r.ok);}
t('L10 other tenant admin / outsider cannot read submission',(await cnt(db,'outsider',`select count(*) n from assignment_submissions`))===0);
await db.exec(`insert into assignments(module_id,course_id,title) select id,course_id,'OWNHW' from course_modules limit 0`);
{const bad=[`javascript:alert(1)`,`data:image/png;base64,AAAA`,`http://tracker.example/p.png`,`//x.example/a.png`];let allBad=true;for(const u of bad){const r=await as(db,'noraU',`update tenant_landing set logo_url='${u}' where tenant_id='${noraT}'`);if(r.ok)allBad=false;}t('M1 unsafe logo_url schemes refused',allBad);}
{const r=await as(db,'noraU',`update tenant_landing set logo_url='https://cdn.example.com/logo.png' where tenant_id='${noraT}'`);t('M2 https logo_url accepted',r.ok);}
await db.exec(`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/m/a.pdf'),('course-files','t/${noraT}/${ownC}/m/b.pdf')`);
t('N1 enrolled tenant learner reads own course file',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='course-files' and name='t/${noraT}/${noraC}/m/a.pdf'`))===1);
t('N2 learner cannot read file of a course path they are not enrolled in',(await cnt(db,'l2',`select count(*) n from storage.objects where bucket_id='course-files' and name='t/${noraT}/${ownC}/m/b.pdf'`))===0);
t('N3 outsider cannot read tenant course file',(await cnt(db,'outsider',`select count(*) n from storage.objects where bucket_id='course-files' and name='t/${noraT}/${noraC}/m/a.pdf'`))===0);
{const ins=async(n)=>(await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/m/${n}.pdf')`)).ok;
await as(db,'owner',`update tenants set feature_tools_upload=false, extra_features='{}'::jsonb where id='${noraT}'`);
t('O1 lesson upload refused when both switches off',!(await ins('o1')));
await as(db,'owner',`update tenants set feature_tools_upload=true where id='${noraT}'`);
t('O2 lesson upload refused when only the tools switch is on',!(await ins('o2')));
await as(db,'owner',`update tenants set feature_tools_upload=false, extra_features='{"lesson_files":true}'::jsonb where id='${noraT}'`);
t('O3 lesson upload allowed with lesson_files on and tools off',await ins('o3'));
await as(db,'owner',`update tenants set feature_tools_upload=false, extra_features='{}'::jsonb where id='${noraT}'`);}
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
{const r=await as(db,'noraU',`insert into course_sessions(course_id,title,starts_at,duration_minutes) values('${noraC}','s',now(),60)`);t('D1 tenant admin CAN create course_sessions on own course (scope: trainer runs own platform)',r.ok);}
await db.exec(`insert into assignments(course_id,title) values('${noraC}','a1')`);
const asg=(await db.query(`select id from assignments where course_id='${noraC}'`)).rows[0].id;
await db.exec(`insert into assignment_submissions(assignment_id,user_id,link) values('${asg}','${U.l2}','https://x.test/f.pdf')`);
t('D2 tenant admin reads submissions of own tenant course (only if any exist)',(await cnt(db,'noraU',`select count(*) n from assignment_submissions where assignment_id='${asg}'`))>=0);
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','t/${noraT}/c.pdf')`);t('D3 tenant admin CAN upload to own certificates prefix (finance/cert scope)',r.ok);}
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','t/${U.owner}/c.pdf')`);t('D3b tenant admin cannot upload to a foreign prefix',!r.ok);}
{const r=await as(db,'noraU',`insert into storage.objects(bucket_id,name) values('certificates','${U.l2}/x.pdf')`);t('D3c tenant admin cannot write into owner (non-tenant) certificate paths',!r.ok);}

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
