import http from 'node:http';
const T='00000000-0000-0000-0000-0000000000aa', U='11111111-1111-1111-1111-111111111111';
const st={learners:[{user_id:'22222222-0000-0000-0000-000000000001',status:'pending',created_at:'2026-11-28T08:00:00Z'},{user_id:'22222222-0000-0000-0000-000000000002',status:'approved',created_at:'2026-11-27T08:00:00Z'}],requests:[]};
const names={'22222222-0000-0000-0000-000000000001':'Sara Fixture','22222222-0000-0000-0000-000000000002':'Omar Fixture'};
const tenant={id:T,slug:'demo-trainer',kind:'trainer',name:'Layla Hassan',status:'active',feature_tools_upload:false,feature_landing:true,feature_custom_domain:false,max_courses:3};
st.mods=[];st.items=[];st.asg=[{id:'a1',course_id:'c1',title:'HW1',max_score:100}];st.pay=[];st.enr=[{id:'e1',user_id:'22222222-0000-0000-0000-000000000002',course_id:'c1',name_ar:'عمر فيكستشر',name_en:null,status:'approved',discount_amount:0,certificate_issued:false,certificate_url:null,courses:{title:'أساسيات القيادة',price:1000}}];
st.sess=[];st.sub=[{id:'s1',assignment_id:'a1',user_id:'22222222-0000-0000-0000-000000000002',content:'my work',link:null,score:null,feedback:null}];
const landing={tenant_id:T,headline:'تدرّب على القيادة بثقة',subtitle:'x',about:'y',theme:'terracotta',published:true};
http.createServer((q,s)=>{
 const h={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-type':'application/json'};
 if(q.method==='OPTIONS'){s.writeHead(204,h);return s.end();}
 let b='';q.on('data',d=>b+=d);q.on('end',()=>{
  const u=new URL(q.url,'http://x');const p=u.pathname;const obj=(q.headers.accept||'').includes('object');
  if(!p.includes('site_')&&!p.includes('realtime'))console.log(q.method,p+u.search.slice(0,90),b.slice(0,120));
  let out=[];
  if(p.endsWith('/rpc/set_tenant_learner_status')){const j=JSON.parse(b);const l=st.learners.find(x=>x.user_id===j._user);if(l)l.status=j._status;out=null;}
  else if(p.endsWith('/tenant_members')){ if(u.search.includes('role=eq.admin'))out=[{tenant_id:T}]; else out=st.learners;}
  else if(p.endsWith('/enrollments'))out=st.enr;
  else if(p.endsWith('/payments')){ if(q.method==='POST'){const j=JSON.parse(b);st.pay.push({id:'p'+st.pay.length,currency:'EGP',...j});out=null;} else out=st.pay;}
  else if(p.endsWith('/installments'))out=[];
  else if(p.includes('/storage/v1/object/list'))out=[];
  else if(p.endsWith('/course_sessions')){ if(q.method==='POST'){const j=JSON.parse(b);st.sess.push({id:'x'+st.sess.length,...j});out=null;} else out=st.sess;}
  else if(p.endsWith('/course_modules')){ if(q.method==='POST'){const j=JSON.parse(b);st.mods.push({id:'m'+st.mods.length,created_at:new Date().toISOString(),...j});out=null;} else out=st.mods;}
  else if(p.endsWith('/module_items')){ if(q.method==='POST'){const j=JSON.parse(b);st.items.push({id:'i'+st.items.length,created_at:new Date().toISOString(),...j});out=null;} else out=st.items;}
  else if(p.endsWith('/assignments')){ if(q.method==='POST'){const j=JSON.parse(b);st.asg.push({id:'a'+(st.asg.length+1),created_at:new Date().toISOString(),...j});out=null;} else out=st.asg;}
  else if(p.endsWith('/assignment_submissions')){ if(q.method==='PATCH'){Object.assign(st.sub[0],JSON.parse(b));out=null;} else out=st.sub;}
  else if(p.endsWith('/tenants'))out=tenant;
  else if(p.endsWith('/tenant_landing'))out=landing;
  else if(p.endsWith('/profiles'))out=Object.entries(names).map(([id,full_name])=>({id,full_name}));
  else if(p.endsWith('/courses'))out=[{id:'c1',title:'أساسيات القيادة',active:true,created_at:'2026-11-01T00:00:00Z'}];
  else if(p.endsWith('/user_roles'))out={role:'trainee'};
  else if(p.endsWith('/rpc/has_role'))out=false;
  else if(p.endsWith('/tenant_requests')){ if(q.method==='POST'){st.requests.unshift({id:'r1',user_id:U,status:'pending',...JSON.parse(b),created_at:new Date().toISOString()});out=null;} else out=st.requests;}
  else if(p.includes('auth/v1/user')){out={id:U,email:'trainer.fixture@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};}
  if(Array.isArray(out)&&obj){out=out[0]??null;}
  if(out===null&&q.method!=='GET'){s.writeHead(204,h);return s.end();}
  s.writeHead(200,h);s.end(JSON.stringify(out));});
}).listen(54399,()=>console.log('stub2 up'));
