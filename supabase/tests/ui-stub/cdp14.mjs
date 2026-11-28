import {spawn} from 'node:child_process';import fs from 'node:fs';
const [,, url, out, w, h, cx, sess] = process.argv;
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9334',`--window-size=${w},${h}`,'about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,2500));
const tabs=await (await fetch('http://127.0.0.1:9334/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id])pend[m.id](m.result)};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Emulation.setDeviceMetricsOverride',{width:+w,height:+h,deviceScaleFactor:1,mobile:false});
await send('Page.enable');
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt=b64({alg:'none'})+'.'+b64({sub:'11111111-1111-1111-1111-111111111111',exp:4102444800,role:'authenticated'})+'.sig';
const session={access_token:jwt,refresh_token:'r',expires_in:99999,expires_at:4102444800,token_type:'bearer',user:{id:'11111111-1111-1111-1111-111111111111',email:'trainer.fixture@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};
if(sess==='1') await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('sb-localhost-auth-token',${JSON.stringify(JSON.stringify(session))});localStorage.setItem('lang','ar')`});
await send('Page.navigate',{url});
await new Promise(r=>setTimeout(r,9000));
const ev=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result.value;
console.log('URL', await ev('location.pathname'));
console.log('TEXT', (await ev('document.body.innerText.slice(0,700)')||'').replace(/\n+/g,' | '));
const typ=(sel,val)=>ev(`(()=>{const i=document.querySelector(${JSON.stringify(sel)});if(!i)return 'no input';const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(val)});i.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
const set=(sel,val)=>ev(`(()=>{const i=document.querySelector(${JSON.stringify(sel)});if(!i)return 'no input '+${JSON.stringify(sel)};const set=Object.getOwnPropertyDescriptor(i.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(val)});i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));return 'ok'})()`);
const clickText=t=>ev(`(()=>{const b=[...document.querySelectorAll('button,[role=tab]')].find(x=>x.innerText.trim().includes(${JSON.stringify(t)}));if(!b)return 'no btn '+${JSON.stringify(t)};b.click();return 'clicked'})()`);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const typePh=(ph,val)=>ev(`(()=>{const i=[...document.querySelectorAll('input,textarea')].find(x=>(x.placeholder||'').includes(${JSON.stringify(ph)}));if(!i)return 'no input '+${JSON.stringify(ph)};const set=Object.getOwnPropertyDescriptor(i.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(val)});i.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);

if(process.env.MODE==='lesson'){
console.log('TAB', await clickText('المحتوى'));await wait(1500);
await typePh('عنوان باب جديد','الباب الأول');await clickText('إضافة باب');await wait(2000);
await clickText('إضافة بند');await wait(800);
console.log('KIND', await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='ملف');if(!b)return 'no kind btn';b.click();return 'clicked'})()`));await wait(500);
console.log('T1', await ev(`(()=>{const i=[...document.querySelectorAll('input')].find(x=>/العنوان المخصص/.test(x.placeholder));if(!i)return 'no title';const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'ملف الدرس');i.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`));
console.log('FILE', await ev(`(()=>{const i=[...document.querySelectorAll('input[type=file]')].pop();if(!i)return 'no file input';const dt=new DataTransfer();dt.items.add(new File(['x'],'l.pdf',{type:'application/pdf'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));return 'set'})()`));
console.log('SAVE', await ev(`(()=>{const f=[...document.querySelectorAll('input[type=file]')].pop();const box=f.closest('div').parentElement;const b=[...box.querySelectorAll('button')].find(x=>x.innerText.trim()==='حفظ');if(!b)return 'no save';b.click();return 'clicked'})()`));
await wait(2500);
console.log('TOAST', await ev(`document.body.innerText.includes('رفع ملفات الدروس غير مفعّل')`));
console.log('ITEM', await ev(`document.body.innerText.includes('ملف الدرس')`));
}
if(process.env.MODE==='fin'){
console.log('OPEN', await clickText('عمر فيكستشر'));await wait(1500);
console.log('AMT', await ev(`(()=>{const i=document.querySelector('input[name=amount]');if(!i)return 'none';const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'5000');i.dispatchEvent(new Event('input',{bubbles:true}));i.form.requestSubmit();return 'sent'})()`));
await wait(2000);
console.log('ERR_SHOWN', await ev(`document.body.innerText.includes('payment exceeds course price')`));
console.log('KEPT', await ev(`document.querySelector('input[name=amount]')?.value`));
console.log('ROW', await ev(`document.body.innerText.includes('5000')`));
}
if(process.env.MODE==='tools'){
await send('Page.navigate',{url:'http://127.0.0.1:5199/t/demo-trainer'});await wait(6000);
console.log('TOOLS_SHOWN', await ev(`document.body.innerText.includes('أدواتي')&&document.body.innerText.includes('guide.pdf')`));
console.log('CLICK', await clickText('guide.pdf'));await wait(1500);
}
const sh=await ev('document.documentElement.scrollHeight');
const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:+w,height:Math.min(sh,2600),scale:1}});
fs.writeFileSync(out,Buffer.from(shot.data,'base64'));ch.kill();process.exit(0);
