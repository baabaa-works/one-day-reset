(() => {
  'use strict';
  const KEY='one-day-reset-analytics-v1', SESSION='one-day-reset-analytics-session-v1', CONSENT='one-day-reset-analytics-consent-v1';
  const config=window.RESET_ANALYTICS_CONFIG;
  const events=['visit_started','snapshot_started','snapshot_completed','card_generated','share_intent','native_share_resolved','native_share_cancelled','native_share_failed','image_download_started','text_copied','link_copied','workbench_entered','snapshot_workbench_entered','share_failed','download_failed','storage_unavailable'];
  const localOnly=['share_failed','download_failed','storage_unavailable'];
  const browsers=['threads','instagram','line','other'];
  const browserClass=()=>{const ua=String(navigator.userAgent||'');return /Threads|Barcelona/i.test(ua)?'threads':/Instagram/i.test(ua)?'instagram':/\bLine\//i.test(ua)?'line':'other';};
  const origins=['threads','instagram','share','other','direct'];
  const properties={entry:['home','quick','result','share'],card_type:['question','personal'],format:['feed','story'],channel:['threads','instagram']};
  let memory={}, sessionMemory=null, memoryOnly=false, sessionMemoryOnly=false;
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function sourceOf(params) {
    const raw=(params.get('utm_source')||params.get('source')||'').toLowerCase();
    if(raw==='threads')return 'threads';if(raw==='ig'||raw==='instagram')return 'instagram';if(raw==='share')return 'share';if(raw)return 'other';
    try {const host=new URL(document.referrer).hostname.toLowerCase();if(host==='threads.net'||host.endsWith('.threads.net')||host==='threads.com'||host.endsWith('.threads.com'))return 'threads';if(host==='instagram.com'||host.endsWith('.instagram.com'))return 'instagram';if(host!==location.hostname)return 'other';}catch{}
    return 'direct';
  }
  function attribution(){
    const p=new URLSearchParams(location.search);
    const short=config.shortLinks&&Object.hasOwn(config.shortLinks,p.get('s'))?config.shortLinks[p.get('s')]:undefined;
    if(short)for(const [key,value]of Object.entries({utm_source:short.source,utm_medium:short.medium||'social',utm_campaign:short.campaign,utm_content:short.content}))if(!p.has(key))p.set(key,value);
    return {source:sourceOf(p),medium:['social','friend','share'].includes(p.get('utm_medium'))?p.get('utm_medium'):'none',campaign:config.campaigns.includes(p.get('utm_campaign'))?p.get('utm_campaign'):'unregistered',content:config.contents.includes(p.get('utm_content'))?p.get('utm_content'):'unregistered'};
  }
  const incoming=attribution();
  const groupOf=a=>[a.source,a.medium,a.campaign,a.content].join('|');
  function currentSession(){
    const now=Date.now();let previous;
    try{previous=sessionMemoryOnly?sessionMemory:JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{previous=sessionMemory;}
    const same=previous && groupOf(previous.attribution||{})===groupOf(incoming) && Number.isFinite(previous.last) && now-previous.last<30*60*1000;
    const session=same?previous:{last:now,attribution:incoming,seen:[]};
    session.last=now;session.seen=Array.isArray(session.seen)?session.seen.filter(e=>events.includes(e)):[];
    session.externalSeen=Array.isArray(session.externalSeen)?session.externalSeen.filter(e=>events.includes(e)):[];
    return session;
  }
  function saveSession(session){sessionMemory=session;try{sessionStorage.setItem(SESSION,JSON.stringify(session));sessionMemoryOnly=false;}catch{sessionMemoryOnly=true;}}
  function safeProperties(input){const output={};for(const [key,values]of Object.entries(properties))if(values.includes(input?.[key]))output[key]=input[key];return output;}
  function safeData(){
    const old=memoryOnly?memory:read(KEY,memory), result={version:1,groups:{},in_app_browser:{}};
    for(const browser of browsers)for(const event of localOnly){const n=old?.in_app_browser?.[browser]?.[event];if(Number.isSafeInteger(n)&&n>=0){if(!result.in_app_browser[browser])result.in_app_browser[browser]={};result.in_app_browser[browser][event]=n;}}
    for(const [key,row]of Object.entries(old?.groups||{}).slice(0,100)){
      const [source,medium,campaign,content]=key.split('|');
      if(!origins.includes(source)||!['social','friend','share','none'].includes(medium)||(!config.campaigns.includes(campaign)&&campaign!=='unregistered')||(!config.contents.includes(content)&&content!=='unregistered'))continue;
      const cleaned={actions:{},sessions:{}};
      for(const type of ['actions','sessions'])for(const event of events){const n=row?.[type]?.[event];if(Number.isSafeInteger(n)&&n>=0)cleaned[type][event]=n;}
      result.groups[key]=cleaned;
    }
    return result;
  }
  // Opt-out model: anonymous events send by default once the owner enables the
  // service. A stored `false` (or an in-memory refusal when storage is blocked)
  // stops them; DNT/GPC always win.
  let refused=false;
  function optedOut(){if(refused)return true;try{return localStorage.getItem(CONSENT)==='false';}catch{return false;}}
  function ready(){return config.enabled===true && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config.websiteId) && location.hostname===config.hostname && !optedOut() && navigator.doNotTrack!=='1' && navigator.globalPrivacyControl!==true;}
  function payload(event,extra,attr){
    // Explicit projection: no form values, document title, referrer, user ID,
    // raw search/hash, screen size or arbitrary objects ever reach the wire.
    return {type:'event',payload:{website:config.websiteId,hostname:config.hostname,url:config.pathname,title:'One Day Reset',language:'zh-TW',referrer:'',name:event,data:{...attr,...safeProperties(extra)}}};
  }
  function send(event,extra,attr){
    if(localOnly.includes(event))return;
    if(!ready())return;
    const session=currentSession();
    const stages=['visit_started','snapshot_started','snapshot_completed','workbench_entered','snapshot_workbench_entered'];
    const deliver=(name)=>{
      if(stages.includes(name)&&session.externalSeen.includes(name))return;
      if(!session.externalSeen.includes(name))session.externalSeen.push(name);
      saveSession(session);
      fetch('https://gateway.umami.is/api/send',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,body:JSON.stringify(payload(name,extra,attr))}).catch(()=>{});
    };
    // A visit that resumes sending after an opt-out starts with the next actual
    // action. This creates its denominator without replaying earlier operations.
    if(event!=='visit_started')deliver('visit_started');
    if(['snapshot_completed','snapshot_workbench_entered'].includes(event))deliver('snapshot_started');
    deliver(event);
    // No retry queue or response IDs. Local counts are authoritative locally;
    // remote reports may undercount if offline, blocked, or rate limited.
  }
  function record(event,extra={}){
    if(!events.includes(event))return;
    const session=currentSession();
    const first=!session.seen.includes(event);
    const data=safeData();let group=groupOf(session.attribution);
    if(!data.groups[group]&&Object.keys(data.groups).length>=99)group='other|none|unregistered|unregistered';
    const row=data.groups[group]||(data.groups[group]={actions:{},sessions:{}});
    row.actions[event]=(row.actions[event]||0)+1;
    if(first){row.sessions[event]=(row.sessions[event]||0)+1;session.seen.push(event);}
    if(localOnly.includes(event)){const browser=browserClass();if(!data.in_app_browser[browser])data.in_app_browser[browser]={};data.in_app_browser[browser][event]=(data.in_app_browser[browser][event]||0)+1;}
    memory=data;const stored=write(KEY,data);memoryOnly=!stored;saveSession(session);
    if(!stored&&event!=='storage_unavailable')record('storage_unavailable');
    // One event per visit for conversion stages, repeated operations remain
    // distinguishable in the local action counts. Never report publication.
    send(event,extra,session.attribution);
  }
  function track(event,extra){
    if(localOnly.includes(event)){record(event,extra);return;}
    // Ensure denominator even for a fresh session after 30 minutes of idle.
    if(event!=='visit_started'&&!currentSession().seen.includes('visit_started'))record('visit_started');
    if(event==='snapshot_completed'&&!currentSession().seen.includes('snapshot_started'))record('snapshot_started');
    if(event==='snapshot_workbench_entered'&&!currentSession().seen.includes('snapshot_started'))return;
    record(event,extra);
  }
  function buildLink({source='threads',campaign='launch_202610',content='threads_question_01'}={}){
    const url=new URL('.',location.href);url.hash='snapshot';
    url.searchParams.set('utm_source',['threads','instagram'].includes(source)?source:'threads');
    url.searchParams.set('utm_medium','social');url.searchParams.set('utm_campaign',config.campaigns.includes(campaign)?campaign:'snapshot');url.searchParams.set('utm_content',config.contents.includes(content)?content:'question_card');return url.href;
  }
  function clear(){memory={};sessionMemory=null;try{localStorage.removeItem(KEY);sessionStorage.removeItem(SESSION);}catch{}}
  function consent(value){refused=value!==true;write(CONSENT,value===true);}
  window.ResetAnalytics=Object.freeze({track,report:safeData,buildLink,clear,consent,ready,attribution:()=>({...incoming}),config});
  document.addEventListener?.('reset:download-failed',()=>track('download_failed'));
  document.addEventListener?.('reset:storage-unavailable',()=>track('storage_unavailable'));
  if(document.documentElement?.dataset.analyticsTools!=='true')track('visit_started');
})();
