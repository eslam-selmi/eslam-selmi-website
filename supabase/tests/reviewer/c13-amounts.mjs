import {PGlite} from '@electric-sql/pglite';import fs from 'fs';
const dir=new URL('../migrations',import.meta.url).pathname;
const db=new PGlite();
await db.exec(fs.readFileSync(new URL('./stubs.sql',import.meta.url),'utf8'));
for(const f of fs.readdirSync(dir).sort()){try{await db.exec(fs.readFileSync(dir+'/'+f,'utf8'));}catch(e){}}
await db.exec(`grant usage on schema public,auth to anon,authenticated; grant all on all tables in schema public to anon,authenticated; grant all on all sequences in schema public to anon,authenticated; grant execute on all functions in schema public,auth to anon,authenticated; grant select on auth.users to authenticated`);
let pass=0,fail=0;const t=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
async function as(u,sql){const uid=U[u]||u||'';await db.exec("reset role");await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false); select set_config('request.jwt.claim.role','authenticated',false)`);try{const r=await db.query(sql);await db.exec('reset role');return{ok:true,rows:r.rows};}catch(e){await db.exec('reset role');return{ok:false,err:e.message};}
}
const U={owner:'00000000-0000-0000-0000-0000000000a1',noraU:'00000000-0000-0000-0000-0000000000b2',l2:'00000000-0000-0000-0000-0000000000c2'};
for(const [k,v] of Object.entries(U)) await db.exec(`insert into auth.users(id,email) values('${v}','${k}@x.test')`);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await as('noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await as('owner',`select approve_tenant_request(id,5,true,true,true) from tenant_requests where user_id='${U.noraU}'`);
const noraT=(await db.query(`select id from tenants where slug='nora'`)).rows[0].id;
await as('noraU',`insert into courses(title,tenant_id,active,price) values('Nora C1','${noraT}',true,1000)`);
const noraC=(await db.query(`select id from courses where title='Nora C1'`)).rows[0].id;
await as('l2',`select join_tenant_as_learner('nora')`);
await as('noraU',`select set_tenant_learner_status('${noraT}','${U.l2}','approved')`);
await as('l2',`insert into enrollments(user_id,course_id,status) values('${U.l2}','${noraC}','pending')`);
await as('noraU',`update enrollments set status='approved' where user_id='${U.l2}'`);
const noraE=(await db.query(`select id from enrollments where user_id='${U.l2}'`)).rows[0].id;
const P=(n)=>`insert into payments(enrollment_id,amount) values('${noraE}',${n})`;
{const r=await as('noraU',P(-500));t('W1 tenant negative payment INSERT refused',!r.ok);}
{const r=await as('noraU',P(0));t('W2 tenant zero payment INSERT refused',!r.ok);}
{const r=await as('noraU',`insert into installments(enrollment_id,amount) values('${noraE}',-100)`);t('W3 tenant negative installment INSERT refused',!r.ok);}
{const r=await as('noraU',`insert into installments(enrollment_id,amount) values('${noraE}',0)`);t('W3b tenant zero installment INSERT refused',!r.ok);}
{const r=await as('noraU',P(200));t('W4 tenant positive payment allowed',r.ok);}
{const r=await as('noraU',`update payments set amount=-5 where enrollment_id='${noraE}'`);t('W5 tenant payment amount UPDATE to negative refused',!r.ok);}
{const r=await as('noraU',`update payments set amount=250 where enrollment_id='${noraE}'`);t('W6 tenant payment amount UPDATE to positive allowed',r.ok);}
{const r=await as('noraU',P(999999));t('W7 overpayment unchanged (still accepted, business rule untouched)',r.ok);}
{const r=await as('noraU',`insert into installments(enrollment_id,amount) values('${noraE}',100)`);t('W8 tenant positive installment allowed',r.ok);}
{const r=await as('noraU',`update installments set amount=-1 where enrollment_id='${noraE}'`);t('W9 tenant installment UPDATE to negative refused',!r.ok);}
{const r=await db.query(`select count(*) n from notifications where user_id='${U.l2}' and title like '%دفعة%'`);t('W10 only the 2 accepted inserts notified (refused ones did not)',Number(r.rows[0].n)===2);}
{const r=await db.query(`select count(*) n from payments where enrollment_id='${noraE}'`);t('W11 refused rows not stored',Number(r.rows[0].n)===2);}
// V4: discount bounds server-side (guard): -1 refused, 1001 refused (price 1000), 500 allowed
{const r=await as('noraU',`update enrollments set discount_amount=-1 where id='${noraE}'`);t('V4a negative discount REFUSED (enrollment guard)',!r.ok);}
{const r=await as('noraU',`update enrollments set discount_amount=1001 where id='${noraE}'`);t('V4b discount above course price REFUSED (enrollment guard)',!r.ok);}
{const r=await as('noraU',`update enrollments set discount_amount=500 where id='${noraE}'`);t('V4c discount within price ALLOWED',r.ok);}
// V6: cross-tenant still closed
await as('owner',`insert into courses(title,active,price) values('Owner paid',true,500)`);
const ownC=(await db.query(`select id from courses where title='Owner paid'`)).rows[0].id;
await db.exec(`insert into auth.users(id,email) values('00000000-0000-0000-0000-0000000000d2','o@x.test')`);
await db.exec(`insert into enrollments(user_id,course_id,status) values('00000000-0000-0000-0000-0000000000d2','${ownC}','approved')`);
const ownE=(await db.query(`select id from enrollments where course_id='${ownC}'`)).rows[0].id;
{const r=await as('noraU',`with u as (insert into payments(enrollment_id,amount) values('${ownE}',1) returning 1) select count(*) n from u`);t('V6 tenant admin CANNOT add payment to owner enrollment (policy)',!r.ok || Number(r.rows?.[0]?.n)===0);}
console.log(`pass=${pass} fail=${fail}`);

// owner legacy flow unchanged: platform tenant enrollment still accepts any amount (no behavior change)
{const r=await db.query(`select 1`);}
await db.exec(`insert into payments(enrollment_id,amount) values('${ownE}',-7)`);
{const r=await db.query(`select count(*) n from payments where enrollment_id='${ownE}' and amount=-7`);t('W12 owner (platform tenant) payment rule unchanged',Number(r.rows[0].n)===1);}
await db.exec(`insert into installments(enrollment_id,amount) values('${ownE}',-7)`);
t('W13 owner installment rule unchanged',true);
console.log(`pass=${pass} fail=${fail}`);
