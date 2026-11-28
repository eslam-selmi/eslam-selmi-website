import http from 'node:http';
const T='00000000-0000-0000-0000-0000000000aa', U='11111111-1111-1111-1111-111111111111';
const st={learners:[{user_id:'22222222-0000-0000-0000-000000000001',status:'pending',created_at:'2026-11-28T08:00:00Z'},{user_id:'22222222-0000-0000-0000-000000000002',status:'approved',created_at:'2026-11-27T08:00:00Z'}],requests:process.env.DUP?[{id:'r9',user_id:'22222222-0000-0000-0000-000000000009',status:'pending',full_name:'Dup Trainer',specialty:'x',requested_slug:'demo-trainer',created_at:'2026-11-28T08:00:00Z'}]:[]};
const names={'22222222-0000-0000-0000-000000000001':'Sara Fixture','22222222-0000-0000-0000-000000000002':'Omar Fixture'};
const tenant={id:T,slug:'demo-trainer',kind:'trainer',name:'Layla Hassan',status:'active',feature_tools_upload:!!process.env.TOOLS,feature_landing:true,feature_custom_domain:false,max_courses:3};
st.mods=[];st.items=[];st.asg=[{id:'a1',course_id:'c1',title:'HW1',max_score:100}];st.pay=[];st.enr=[{id:'e1',user_id:'22222222-0000-0000-0000-000000000002',course_id:'c1',name_ar:'عمر فيكستشر',name_en:null,status:'approved',discount_amount:0,certificate_issued:false,certificate_requested_at:'2026-11-28T07:00:00Z',certificate_url:null,courses:{title:'أساسيات القيادة',price:1000}}];
st.sess=process.env.SEED?[{id:'q1',course_id:'c1',title:'جلسة 1',starts_at:'2026-12-01T10:00:00Z',duration_minutes:60,link:null}]:[];st.sub=[{id:'s1',assignment_id:'a1',user_id:'22222222-0000-0000-0000-000000000002',content:'my work',link:null,score:null,feedback:null},{id:'s2',assignment_id:'a1',user_id:'22222222-0000-0000-0000-000000000001',content:'dated work',link:null,score:null,feedback:null,submitted_at:'2026-11-27T09:30:00Z'}];
const landing={tenant_id:T,headline:'تدرّب على القيادة بثقة',subtitle:'x',about:'y',theme:'terracotta',published:true};
http.createServer((q,s)=>{
 const h={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-type':'application/json'};
 if(q.method==='OPTIONS'){s.writeHead(204,h);return s.end();}
 let b='';q.on('data',d=>b+=d);q.on('end',()=>{
  const u=new URL(q.url,'http://x');const p=u.pathname;const obj=(q.headers.accept||'').includes('object');
  if(!p.includes('site_')&&!p.includes('realtime'))console.log(q.method,p+u.search.slice(0,90),b.slice(0,120));
  let out=[];
  if(p.endsWith('/rpc/set_tenant_learner_status')){const j=JSON.parse(b);const l=st.learners.find(x=>x.user_id===j._user);if(l)l.status=j._status;out=null;}
  else if(p.endsWith('/tenant_members')&&u.search.includes('user_id=eq')&&!u.search.includes('role=eq.admin')){if(process.env.MEM==='none'){s.writeHead(200,h);return s.end(obj?'null':'[]');}out={status:process.env.MEM==='pending'?'pending':'approved',role:'learner'};}
  else if(p.endsWith('/tenant_members')){ if(u.search.includes('role=eq.admin'))out=[{tenant_id:T}]; else out=st.learners;}
  else if(p.includes('/storage/v1/object/course-files/')){ if(process.env.DENY){s.writeHead(403,h);return s.end(JSON.stringify({statusCode:'403',error:'Unauthorized',message:'new row violates row-level security policy'}));} out={Key:'ok'};}
  else if(p.includes('/storage/v1/object/sign/tool-assets/')){out={signedURL:'/object/sign/tool-assets/guide.pdf?token=t'};}
  else if(p.endsWith('/payments')&&q.method==='POST'&&process.env.PAYFAIL){s.writeHead(400,h);return s.end(JSON.stringify({message:'payment exceeds course price',code:'P0001'}));}
  else if(p.includes('/storage/v1/object/certificates/')){out={Key:'ok'};}
  else if(p.endsWith('/enrollments')&&q.method==='PATCH'){Object.assign(st.enr[0],JSON.parse(b));out=null;}
  else if(p.endsWith('/course_modules')&&q.method==='DELETE'){st.mods=[];out=null;}
  else if(p.endsWith('/enrollments')){ if(q.method==='POST'){out=null;} else out=st.enr.map(e=>({...e,courses:{id:'c1',title:'أساسيات القيادة',description:null,price:+(process.env.PRICE||0),currency:'EGP',active:true,installments_count:1,cover_emoji:'📘',total_hours:4}}));}
  else if(p.endsWith('/payments')){ if(q.method==='POST'){const j=JSON.parse(b);st.pay.push({id:'p'+st.pay.length,currency:'EGP',...j});out=null;} else out=st.pay;}
  else if(p.endsWith('/installments')){ if(q.method==='DELETE'){st.ins=[];out=null;} else out=process.env.SEED?(st.ins=st.ins||[{id:'n1',enrollment_id:'e1',amount:300,due_date:null,paid:false}]):[];}
  else if(p.includes('/storage/v1/object/tool-assets')&&q.method==='DELETE'){out=[{name:'guide.pdf'}];}
  else if(p.includes('/storage/v1/object/list'))out=process.env.TOOLS?[{name:'guide.pdf'}]:[];
  else if(p.endsWith('/course_sessions')&&q.method==='DELETE'){st.sess=[];out=null;}
  else if(p.endsWith('/course_sessions')){ if(q.method==='POST'){const j=JSON.parse(b);st.sess.push({id:'x'+st.sess.length,...j});out=null;} else out=st.sess;}
  else if(p.endsWith('/course_modules')){ if(q.method==='POST'){const j=JSON.parse(b);st.mods.push({id:'m'+st.mods.length,created_at:new Date().toISOString(),...j});out=null;} else out=st.mods;}
  else if(p.endsWith('/module_items')){ if(q.method==='POST'){const j=JSON.parse(b);st.items.push({id:'i'+st.items.length,created_at:new Date().toISOString(),...j});out=null;} else out=st.items;}
  else if(p.endsWith('/assignments')&&q.method==='DELETE'){st.asg=[];out=null;}
  else if(p.endsWith('/assignments')){ if(q.method==='POST'){const j=JSON.parse(b);st.asg.push({id:'a'+(st.asg.length+1),created_at:new Date().toISOString(),...j});out=null;} else out=st.asg;}
  else if(p.endsWith('/assignment_submissions')){ if(q.method==='PATCH'){Object.assign(st.sub[0],JSON.parse(b));out=null;} else out=st.sub;}
  else if(p.endsWith('/rpc/get_public_tenant'))out=[tenant];
  else if(p.endsWith('/rpc/get_public_tenant_courses'))out=[{id:'c1',title:'أساسيات القيادة',price:0}];
  else if(p.endsWith('/tenants')&&q.method==='PATCH'){Object.assign(tenant,JSON.parse(b));out=null;}
  else if(p.endsWith('/tenants')&&u.search.includes('kind=eq.trainer'))out=[tenant];
  else if(p.endsWith('/rpc/approve_tenant_request')){ if(process.env.DUP){s.writeHead(409,h);return s.end(JSON.stringify({code:'23505',message:'duplicate key value violates unique constraint "tenants_slug_key"'}));} out=null;}
  else if(p.endsWith('/tenants'))out=tenant;
  else if(p.endsWith('/tenant_landing'))out=landing;
  else if(p.endsWith('/profiles'))out=Object.entries(names).map(([id,full_name])=>({id,full_name}));
  else if(p.endsWith('/courses'))out=[{id:'c1',title:'أساسيات القيادة',active:true,created_at:'2026-11-01T00:00:00Z'}];
  else if(p.endsWith('/user_roles'))out={role:'admin'};
  else if(p.endsWith('/rpc/has_role'))out=true;
  else if(p.endsWith('/tenant_requests')){ if(q.method==='POST'){st.requests.unshift({id:'r1',user_id:U,status:'pending',...JSON.parse(b),created_at:new Date().toISOString()});out=null;} else out=st.requests;}
  else if(p.includes('auth/v1/user')){out={id:U,email:'trainer.fixture@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};}
  if(Array.isArray(out)&&obj){out=out[0]??null;}
  if(out===null&&q.method!=='GET'){s.writeHead(204,h);return s.end();}
  s.writeHead(200,h);s.end(JSON.stringify(out));});
}).listen(54399,()=>console.log('stub2 up'));
