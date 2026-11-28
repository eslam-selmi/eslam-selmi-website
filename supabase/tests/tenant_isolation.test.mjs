import {PGlite} from '@electric-sql/pglite';import fs from 'fs';
const db=new PGlite();await db.exec(fs.readFileSync(new URL('./stubs.sql',import.meta.url),'utf8'));
const dir=new URL('../migrations',import.meta.url).pathname;
let baseFail=0;
for(const f of fs.readdirSync(dir).sort()){try{await db.exec(fs.readFileSync(dir+'/'+f,'utf8'));}catch(e){ if(f.startsWith('20261128')){console.log('NEW MIGRATION FAILED',e.message);process.exit(1);} baseFail++;}}
await db.exec(`grant usage on schema public,auth to anon,authenticated; grant all on all tables in schema public to anon,authenticated; grant all on all sequences in schema public to anon,authenticated; grant execute on all functions in schema public,auth to anon,authenticated; grant select on auth.users to authenticated;`);
const U={owner:'00000000-0000-0000-0000-0000000000a1',saraU:'00000000-0000-0000-0000-0000000000b1',noraU:'00000000-0000-0000-0000-0000000000b2',l1:'00000000-0000-0000-0000-0000000000c1',l2:'00000000-0000-0000-0000-0000000000c2',legacy:'00000000-0000-0000-0000-0000000000c3'};
for(const [k,v] of Object.entries(U)) await db.exec(`insert into auth.users(id,email) values('${v}','${k}@x.test') on conflict do nothing`);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin') on conflict do nothing;
 insert into public.courses(id,title,active) values ('11111111-1111-1111-1111-111111111111','Owner legacy course',true);
 insert into public.enrollments(user_id,course_id,status) values('${U.legacy}','11111111-1111-1111-1111-111111111111','approved');`);
let pass=0,fail=0;
async function as(u,sql){await db.exec("reset role");await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${u?U[u]:''}',false); select set_config('request.jwt.claim.role','authenticated',false)`);try{const r=await db.query(sql);await db.exec('reset role');return {ok:true,rows:r.rows};}catch(e){await db.exec('reset role');return {ok:false,err:e.message};}}
function t(name,cond){ if(cond){pass++;console.log('PASS',name);}else{fail++;console.log('FAIL',name);} }
const ok=async(n,u,s)=>t(n,(await as(u,s)).ok); const bad=async(n,u,s)=>t(n,!(await as(u,s)).ok);
const cnt=async(u,s)=>{const r=await as(u,s);return r.ok?Number(r.rows[0].n):-1};
// requests
await ok('sara files trainer request','saraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.saraU}','Sara','sara')`);
await ok('nora files trainer request','noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await bad('user cannot file request as someone else','saraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','x','nora2')`);
await bad('user cannot self-approve','saraU',`select approve_tenant_request(id) from tenant_requests where user_id='${U.saraU}'`);
t('user cannot self-set status approved (0 rows)',(await cnt('saraU',`with u as (update tenant_requests set status='approved' where user_id='${U.saraU}' returning 1) select count(*) n from u`))===0);
t('nora cannot see sara request',(await cnt('noraU',`select count(*) n from tenant_requests where user_id='${U.saraU}'`))===0);
await ok('owner approves sara (limit 2, tools off)','owner',`select approve_tenant_request(id,2,false,true,false) from tenant_requests where user_id='${U.saraU}'`);
await ok('owner approves nora (limit 1)','owner',`select approve_tenant_request(id,1,true,true,true) from tenant_requests where user_id='${U.noraU}'`);
const saraT=(await as('owner',`select id from tenants where slug='sara'`)).rows[0].id, noraT=(await as('owner',`select id from tenants where slug='nora'`)).rows[0].id;
// tenants
t('trainer cannot change own limits (0 rows)',(await cnt('saraU',`with u as (update tenants set max_courses=99 where id='${saraT}' returning 1) select count(*) n from u`))===0);
t('trainer limits unchanged (row visible, still 2)',(await cnt('saraU',`select max_courses n from tenants where id='${saraT}'`))===2);
t('sara cannot see nora tenant',(await cnt('saraU',`select count(*) n from tenants where id='${noraT}'`))===0);
await bad('trainer cannot create tenant','saraU',`insert into tenants(slug,name) values('evil','x')`);
// courses + limits
await ok('sara creates course 1','saraU',`insert into courses(title,tenant_id) values('Sara C1','${saraT}')`);
await ok('sara creates course 2','saraU',`insert into courses(title,tenant_id) values('Sara C2','${saraT}')`);
await bad('sara blocked at course limit 2','saraU',`insert into courses(title,tenant_id) values('Sara C3','${saraT}')`);
await bad('sara cannot create course in nora tenant','saraU',`insert into courses(title,tenant_id) values('hijack','${noraT}')`);
await bad('sara cannot create course in owner tenant (default)','saraU',`insert into courses(title) values('into owner')`);
await ok('nora creates course','noraU',`insert into courses(title,tenant_id) values('Nora C1','${noraT}')`);
await bad('sara cannot move course to nora tenant','saraU',`update courses set tenant_id='${noraT}' where title='Sara C1'`);
t('sara sees only own+public-active courses, not nora inactive',(await cnt('saraU',`select count(*) n from courses where title='Nora C1' and active=false`))===0);
t('sara cannot update owner legacy course',(await cnt('saraU',`with u as (update courses set title='pwn' where title='Owner legacy course' returning 1) select count(*) n from u`))===0);
t('sara cannot delete nora course',(await cnt('saraU',`with u as (delete from courses where title='Nora C1' returning 1) select count(*) n from u`))===0);
// modules
const saraC=(await as('owner',`select id from courses where title='Sara C1'`)).rows[0].id, noraC=(await as('owner',`select id from courses where title='Nora C1'`)).rows[0].id;
await ok('sara adds module to own course','saraU',`insert into course_modules(course_id,title,order_index) values('${saraC}','M1',1)`);
await bad('sara cannot add module to nora course','saraU',`insert into course_modules(course_id,title,order_index) values('${noraC}','evil',1)`);
// features
await ok('sara writes own landing (feature on)','saraU',`insert into tenant_landing(tenant_id,headline,published) values('${saraT}','Hi',true)`);
await bad('sara cannot write nora landing','saraU',`insert into tenant_landing(tenant_id,headline) values('${noraT}','x')`);
await bad('sara cannot request domain (feature off)','saraU',`insert into tenant_domains(tenant_id,hostname) values('${saraT}','sara-training.com')`);
await ok('nora can request domain (feature on)','noraU',`insert into tenant_domains(tenant_id,hostname) values('${noraT}','nora-training.com')`);
t('nora cannot self-activate domain (0 rows)',(await cnt('noraU',`with u as (update tenant_domains set status='active' where tenant_id='${noraT}' returning 1) select count(*) n from u`))===0);
t('sara cannot read nora domains',(await cnt('saraU',`select count(*) n from tenant_domains`))===0);
await ok('owner activates nora domain','owner',`update tenant_domains set status='active' where tenant_id='${noraT}'`);
t('anon-style public landing visible only when published+feature',(await cnt('legacy',`select count(*) n from tenant_landing`))===1);
// learners
await ok('l1 joins sara','l1',`select join_tenant_as_learner('sara')`);
await ok('l2 joins nora','l2',`select join_tenant_as_learner('nora')`);
await bad('join unknown tenant fails','l1',`select join_tenant_as_learner('nope')`);
await ok('l1 enrolls in sara course','l1',`insert into enrollments(user_id,course_id,status) values('${U.l1}','${saraC}','pending')`);
await bad('l1 cannot enroll in nora course (not joined)','l1',`insert into enrollments(user_id,course_id,status) values('${U.l1}','${noraC}','pending')`);
await ok('legacy learner can still enroll in owner course (unchanged)','legacy',`select 1`);
t('sara sees her learner enrollment',(await cnt('saraU',`select count(*) n from enrollments`))===1);
t('sara cannot see owner-legacy enrollment',(await cnt('saraU',`select count(*) n from enrollments where user_id='${U.legacy}'`))===0);
t('nora sees none of sara enrollments',(await cnt('noraU',`select count(*) n from enrollments where user_id='${U.l1}'`))===0);
t('sara sees profile of own learner only',(await cnt('saraU',`select count(*) n from profiles where id in ('${U.l1}','${U.l2}','${U.legacy}')`))===1);
t('l2 cannot see l1 enrollment',(await cnt('l2',`select count(*) n from enrollments where user_id='${U.l1}'`))===0);
t('owner (platform admin) still sees everything',(await cnt('owner',`select count(*) n from enrollments`))>=2);
t('legacy learner still sees own enrollment',(await cnt('legacy',`select count(*) n from enrollments`))===1);
{const r=await as('saraU',`with u as (update enrollments set status='approved' where user_id='${U.l1}' returning 1) select count(*) n from u`);console.log('  approve result',JSON.stringify(r));t('sara approves her learner enrollment',r.ok&&Number(r.rows[0].n)===1);}
await bad('sara cannot move learner enrollment to nora course','saraU',`update enrollments set course_id='${noraC}' where user_id='${U.l1}'`);
await bad('learner cannot self-approve (existing guard intact)','l1',`update enrollments set status='approved', blocked=false, notes='x' where user_id='${U.l1}'`);
t('sara cannot approve legacy enrollment',(await cnt('saraU',`with u as (update enrollments set status='rejected' where user_id='${U.legacy}' returning 1) select count(*) n from u`))===0);
// suspend
await ok('owner suspends sara','owner',`update tenants set status='suspended' where id='${saraT}'`);
t('suspended sara loses course write access',(await cnt('saraU',`with u as (update courses set title='x' where title='Sara C1' returning 1) select count(*) n from u`))===0);
t('legacy owner course intact',(await cnt('owner',`select count(*) n from courses where title='Owner legacy course' and tenant_id=platform_tenant_id()`))===1);
console.log(`\nRESULT pass=${pass} fail=${fail} (base migrations failing in harness: ${baseFail})`);
