import {PGlite} from '@electric-sql/pglite';import fs from 'fs';
const dir=new URL('../migrations8',import.meta.url).pathname;
const db=new PGlite();
await db.exec(fs.readFileSync(new URL('./stubs3.sql',import.meta.url),'utf8'));
for(const f of fs.readdirSync(dir).sort()){try{await db.exec(fs.readFileSync(dir+'/'+f,'utf8'));}catch(e){}}
await db.exec(`grant usage on schema public,auth to anon,authenticated; grant all on all tables in schema public to anon,authenticated; grant all on all sequences in schema public to anon,authenticated; grant execute on all functions in schema public,auth to anon,authenticated; grant select on auth.users to authenticated; grant usage on schema storage to authenticated, anon; grant execute on all functions in schema storage to authenticated, anon; grant all on storage.objects, storage.buckets to authenticated`);
let pass=0,fail=0;const t=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
async function as(u,sql){const uid=U[u]||u||'';await db.exec("reset role");await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false); select set_config('request.jwt.claim.role','authenticated',false)`);try{const r=await db.query(sql);await db.exec('reset role');return{ok:true,rows:r.rows};}catch(e){await db.exec('reset role');return{ok:false,err:e.message};}
}
const U={owner:'00000000-0000-0000-0000-0000000000a1',noraU:'00000000-0000-0000-0000-0000000000b2',l2:'00000000-0000-0000-0000-0000000000c2'};
for(const [k,v] of Object.entries(U)) await db.exec(`insert into auth.users(id,email) values('${v}','${k}@x.test')`);
await db.exec(`insert into public.user_roles(user_id,role) values('${U.owner}','admin')`);
await as('noraU',`insert into tenant_requests(user_id,full_name,requested_slug) values('${U.noraU}','Nora','nora')`);
await as('owner',`select approve_tenant_request(id,5,true,true,true) from tenant_requests where user_id='${U.noraU}'`);
const noraT=(await db.query(`select id from tenants where slug='nora'`)).rows[0].id;
await as('noraU',`insert into courses(title,tenant_id,active) values('Nora C1','${noraT}',true)`);
const noraC=(await db.query(`select id from courses where title='Nora C1'`)).rows[0].id;
await as('l2',`select join_tenant_as_learner('nora')`);
await as('noraU',`select set_tenant_learner_status('${noraT}','${U.l2}','approved')`);
await as('l2',`insert into enrollments(user_id,course_id,status) values('${U.l2}','${noraC}','pending')`);
await as('noraU',`update enrollments set status='approved' where user_id='${U.l2}'`);
const up=(name,bucket='course-files')=>as('noraU',`insert into storage.objects(bucket_id,name) values('${bucket}','${name}')`);
// S1: tools_upload=true but lesson_files unset -> course-file upload REFUSED (separation)
{const r=await up(`t/${noraT}/${noraC}/s1.pdf`);t('S1 course-file upload REFUSED when lesson_files unset even with tools_upload=true',!r.ok);}
// S2: enable lesson_files -> upload OK
await as('owner',`update tenants set extra_features='{"lesson_files":true}' where id='${noraT}'`);
{const r=await up(`t/${noraT}/${noraC}/s2.pdf`);t('S2 course-file upload ALLOWED once owner enables lesson_files',r.ok);}
// S3: tools library gate unchanged (tools_upload=true)
{const r=await up(`t/${noraT}/assets/s3.pdf`,'tool-assets');t('S3 tool-assets upload ALLOWED with tools_upload=true (tools gate unchanged)',r.ok);}
// S4: disable tools_upload, keep lesson_files=true -> course-file OK, tool-assets REFUSED
await as('owner',`update tenants set feature_tools_upload=false where id='${noraT}'`);
{const r=await up(`t/${noraT}/${noraC}/s4.pdf`);t('S4a course-file upload STILL ALLOWED with tools_upload=false (independent switch)',r.ok);}
{const r=await up(`t/${noraT}/assets/s4.pdf`,'tool-assets');t('S4b tool-assets upload REFUSED once tools_upload=false',!r.ok);}
// S5: extra_features preservation across a UI-style merged patch
await as('owner',`update tenants set extra_features='{"lesson_files":true,"custom_x":true}' where id='${noraT}'`);
await as('owner',`update tenants set extra_features='{"lesson_files":false,"custom_x":true}' where id='${noraT}'`);
{const r=await up(`t/${noraT}/${noraC}/s5.pdf`);t('S5a course-file upload REFUSED after lesson_files patched off',!r.ok);}
const cx=await db.query(`select public.tenant_feature('${noraT}','custom_x') f`);t('S5b other extra_features key preserved through the patch',cx.rows[0].f===true);
const lf=await db.query(`select public.tenant_feature('${noraT}','lesson_files') f`);t('S5c tenant_feature(lesson_files) reads extra_features (not a column)',lf.rows[0].f===false);
// S6: 14e learner read unaffected by either switch
await db.exec(`insert into storage.objects(bucket_id,name) values('course-files','t/${noraT}/${noraC}/lesson1.pdf')`);
{const r=await as('l2',`select count(*) n from storage.objects where bucket_id='course-files' and name='t/${noraT}/${noraC}/lesson1.pdf'`);t('S6 learner READ of own course file unaffected by switches (14e unchanged)',r.ok&&Number(r.rows[0].n)===1);}
// S7: foreign prefix refused even with lesson_files=true
await as('owner',`update tenants set extra_features='{"lesson_files":true}' where id='${noraT}'`);
{const r=await up(`t/${U.owner}/x.pdf`);t('S7 tenant admin CANNOT upload under foreign prefix with lesson_files=true',!r.ok);}
// S8: suspended tenant -> tenant_feature false -> refused
await as('owner',`update tenants set status='suspended' where id='${noraT}'`);
{const r=await up(`t/${noraT}/${noraC}/s8.pdf`);t('S8 upload REFUSED while tenant suspended (tenant_feature requires active)',!r.ok);}
await as('owner',`update tenants set status='active' where id='${noraT}'`);
console.log(`pass=${pass} fail=${fail}`);
