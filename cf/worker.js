const BOTS=['Captain','Hỏi Đáp','Tác vụ','dr eggbot','Shopee bot','Tiktok Shop Bot','Tiktok MKT','Facebook MKT','Kalodata Bot','Douyin Bot','Pancake Bot','GHTK-bot','Kiot Viet-bot','Website-PF','Pearlfarm Bot','Soi Quảng Cáo FB','AI Cinametic'];
const IDLE=20*60;
const NC={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const eq=(a,b)=>{if(!a||!b||a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0};
const ok=async(v,h)=>typeof v==='string'&&v!==''&&eq(await sha(v),h);
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...NC,'Content-Type':'application/json; charset=utf-8'}});
const cookieTok=env=>sha('pfhq-session:'+env.PAGE_HASH);
async function authed(req,env){const c=(req.headers.get('Cookie')||'').match(/pfhq=([a-f0-9]{64})/);return !!c&&eq(c[1],await cookieTok(env));}
const LOGIN=(msg='')=>new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>Agent HQ</title><style>body{margin:0;height:100vh;display:grid;place-items:center;background:#0d1420;font-family:system-ui;color:#fff}form{background:#1a2333;padding:28px;border-radius:14px;display:grid;gap:12px;width:min(320px,85vw)}input,button{padding:11px;border-radius:8px;border:0;font-size:15px}button{background:#3fb37f;color:#fff;font-weight:600}</style><form method=post action=/login><b>Pearl Farm · Agent HQ</b><input type=password name=p placeholder="Mật khẩu" autofocus required><button>Vào</button><small style=color:#f88>${msg}</small></form>`,{status:msg?401:200,headers:{...NC,'Content-Type':'text/html; charset=utf-8'}});
export default{async fetch(req,env){
  const u=new URL(req.url);
  if(u.pathname==='/api/status'){
    if(req.method==='POST'){
      if(!await ok(req.headers.get('X-PF-HQ-Key'),env.WRITE_HASH))return J({error:'forbidden'},403);
      let p;try{p=await req.json()}catch{return J({error:'bad json'},400)}
      const canon=BOTS.find(b=>b.toLowerCase()===String(p.bot||'').trim().toLowerCase());
      if(!canon)return J({error:'Unknown bot'},400);
      if(!['lam','ranh'].includes(p.state))return J({error:'state must be lam|ranh'},400);
      const task=String(p.task||'').replace(/[<>]/g,'').slice(0,200),now=Math.floor(Date.now()/1000);
      const d=await env.HQ.get('state',{type:'json'})||{bots:{},events:[]};
      d.bots[canon]={state:p.state,task:p.state==='lam'?task:'',updated:now};
      d.events.unshift({bot:canon,state:p.state,task,t:now});d.events=d.events.slice(0,50);
      await env.HQ.put('state',JSON.stringify(d));
      return J({ok:true,bot:canon,state:p.state});
    }
    if(req.method==='GET'){
      if(!(await authed(req,env)||await ok(u.searchParams.get('k')||req.headers.get('X-PF-HQ-Key'),env.READ_HASH)))return J({error:'forbidden'},403);
      const d=await env.HQ.get('state',{type:'json'})||{bots:{},events:[]},now=Math.floor(Date.now()/1000),out={};
      for(const b of BOTS){const s={...(d.bots[b]||{state:'ranh',task:'',updated:0})};if(s.state==='lam'&&now-s.updated>IDLE){s.state='ranh';s.task='';s.stale=true}out[b]=s}
      return J({now,idle_minutes:20,bots:out,events:d.events});
    }
    return J({error:'method'},405);
  }
  if(u.pathname==='/api/tasks'&&req.method==='GET'){
    if(!await authed(req,env))return J({error:'forbidden'},403);
    return J({tasks:(await env.HQ.get('tasks',{type:'json'})||[]).slice(0,20)});
  }
  if(u.pathname==='/api/task'&&req.method==='POST'){
    if(!await authed(req,env))return J({error:'forbidden'},403);
    let p;try{p=await req.json()}catch{return J({error:'bad json'},400)}
    const to=String(p.to??'').trim(),task=String(p.task??'').trim();
    if(!to||to.length>60)return J({error:'to: 1-60 ký tự'},400);
    if(!task||task.length>1000)return J({error:'task: 1-1000 ký tự'},400);
    const t={id:crypto.randomUUID(),to,task,ts:Math.floor(Date.now()/1000),status:'pending'};
    if(env.HQ_WEBHOOK_URL&&env.HQ_WEBHOOK_KEY){
      try{const r=await fetch(env.HQ_WEBHOOK_URL,{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.HQ_WEBHOOK_KEY,'X-Automation-Key':env.HQ_WEBHOOK_KEY},body:JSON.stringify({action:'task',to,task,id:t.id})});t.status=r.ok?'sent':'failed';}
      catch{t.status='failed'}
    }
    const l=await env.HQ.get('tasks',{type:'json'})||[];l.unshift(t);
    await env.HQ.put('tasks',JSON.stringify(l.slice(0,50)));
    return J({ok:true,task:t});
  }
  if(u.pathname==='/api/task/status'&&req.method==='POST'){
    if(!await ok(req.headers.get('X-PF-HQ-Key'),env.WRITE_HASH))return J({error:'forbidden'},403);
    let p;try{p=await req.json()}catch{return J({error:'bad json'},400)}
    if(!['doing','done'].includes(p.status))return J({error:'status must be doing|done'},400);
    const l=await env.HQ.get('tasks',{type:'json'})||[],t=l.find(x=>x.id===p.id);
    if(!t)return J({error:'task not found'},404);
    if(t.status!==p.status){t.status=p.status;t.updated=Math.floor(Date.now()/1000);await env.HQ.put('tasks',JSON.stringify(l));}
    return J({ok:true,task:t});
  }
  if(u.pathname==='/api/blockers'&&req.method==='GET'){
    if(!await authed(req,env))return J({error:'forbidden'},403);
    return J({blockers:(await env.HQ.get('blockers',{type:'json'})||[]).filter(b=>!b.resolved)});
  }
  if(u.pathname==='/api/blocker/resolve'&&req.method==='POST'){
    if(!await authed(req,env))return J({error:'forbidden'},403);
    let p;try{p=await req.json()}catch{return J({error:'bad json'},400)}
    const l=await env.HQ.get('blockers',{type:'json'})||[],b=l.find(x=>x.id===p.id);
    if(!b)return J({error:'not found'},404);
    if(!b.resolved){b.resolved=true;b.resolved_ts=Math.floor(Date.now()/1000);await env.HQ.put('blockers',JSON.stringify(l));}
    return J({ok:true});
  }
  if(u.pathname==='/api/blocker'&&req.method==='POST'){
    if(!await ok(req.headers.get('X-PF-HQ-Key'),env.WRITE_HASH))return J({error:'forbidden'},403);
    let p;try{p=await req.json()}catch{return J({error:'bad json'},400)}
    const cl=(v,n)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,n),now=Math.floor(Date.now()/1000);
    const l=await env.HQ.get('blockers',{type:'json'})||[];
    if(p.resolved===true){const b=l.find(x=>x.id===p.id);if(!b)return J({error:'not found'},404);
      if(!b.resolved){b.resolved=true;b.resolved_ts=now;await env.HQ.put('blockers',JSON.stringify(l));}return J({ok:true,blocker:b});}
    const bot=cl(p.bot,60),title=cl(p.title,200);
    if(!bot||!title)return J({error:'bot, title required'},400);
    let b=p.id?l.find(x=>x.id===p.id):l.find(x=>!x.resolved&&x.bot.toLowerCase()===bot.toLowerCase()&&x.title===title);
    const since=Number.isFinite(+p.since)&&+p.since>0?Math.floor(+p.since):null;
    if(b){Object.assign(b,{bot,title,why:cl(p.why,500),action:cl(p.action,500),updated:now,resolved:false});if(since)b.since=since;l.splice(l.indexOf(b),1);}
    else b={id:p.id?cl(p.id,64):crypto.randomUUID(),bot,title,why:cl(p.why,500),action:cl(p.action,500),since:since||now,updated:now,resolved:false};
    l.unshift(b);
    // keep cap 30: drop resolved first, then oldest
    while(l.length>30){const i=l.map(x=>x.resolved).lastIndexOf(true);l.splice(i>=0?i:l.length-1,1);}
    await env.HQ.put('blockers',JSON.stringify(l));
    return J({ok:true,blocker:b});
  }
  if(u.pathname==='/login'&&req.method==='POST'){
    const f=await req.formData();
    if(!await ok(f.get('p'),env.PAGE_HASH))return LOGIN('Sai mật khẩu');
    return new Response(null,{status:303,headers:{...NC,Location:'/','Set-Cookie':`pfhq=${await cookieTok(env)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`}});
  }
  if(u.pathname==='/logout')return new Response(null,{status:303,headers:{Location:'/','Set-Cookie':'pfhq=; Path=/; Max-Age=0'}});
  if(!await authed(req,env))return LOGIN();
  const page=(u.pathname==='/space'||u.pathname==='/space.html')?'/space.html':(u.pathname==='/candy'||u.pathname==='/candy.html')?'/candy.html':(u.pathname==='/hoian'||u.pathname==='/hoian.html')?'/hoian-v2.html':'/';
  const r=await env.ASSETS.fetch(new Request(new URL(page,u),{headers:{Accept:'text/html'}}));
  return new Response(r.body,{status:r.status,headers:{...NC,'Content-Type':'text/html; charset=utf-8'}});
}};
