(() => {
  'use strict';
  const root = document.getElementById('growth');
  const app = document.getElementById('app');
  const DRAFT = 'one-day-reset-snapshot-v1';
  const analytics = window.ResetAnalytics;
  const localUI = window.ResetLocalUI;
  let canStore = localUI.storageAvailable();
  const questions = [
    ['看見現況', '你已經習慣忍受的一件事', '最近哪個生活情境，常讓你默默耗掉力氣？挑一件小事，補一句自己的話就好。', '例如：下班後還在看工作訊息。'],
    ['靠近想要的生活', '三年後，某個普通的星期二', '用一兩句留下具體畫面：在哪裡醒來、做什麼、心情如何？不用先解決所有現實限制。', '我在＿＿醒來，今天＿＿，心裡覺得＿＿。'],
    ['留下一個起點', '如果你已經是那樣的人，這週你會做的一件小事', '想一件能替那個畫面留出一點空間的事。小到願意開始就好。', '這週我先＿＿。']
  ];
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const saved = read(DRAFT);
  let answers = questions.map((_, i) => typeof saved?.answers?.[i] === 'string' ? saved.answers[i].slice(0, 500) : '');
  const tags=['一直很忙','很少休息','方向模糊','先顧別人','事情拖著'];
  const starters=[[],['我在＿＿醒來，接著＿＿，心裡覺得＿＿。','一個普通的星期二，我想留時間給＿＿。'],['這週我會留十分鐘，先＿＿。','我會在＿＿之後，試一次＿＿。','這週我先把＿＿縮成一個小步驟。']];
  let selectedTags=Array.isArray(saved?.tags)?saved.tags.filter(t=>tags.includes(t)).slice(0,2):[];
  let identity=typeof saved?.identity==='string'?saved.identity.slice(0,120):'';
  let scheduledAt=typeof saved?.scheduledAt==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(saved.scheduledAt)?saved.scheduledAt:'';
  let step = Number.isInteger(saved?.step)?Math.max(0,Math.min(2,saved.step)):0, screen = 'home', returnScreen = 'home';
  let mode = 'question', personal = '', platform = 'threads', format = 'feed', imageFile = null, imageVersion = 0;
  let personalConfirmed=false;
  const tones=['最近有點找不到方向？一起做個 90 秒的小練習，留下一個這週能做的小行動。','想把這個小練習留給你。有空時寫幾句，答案只給自己看。','陪我做一個 90 秒快照吧。沒有標準答案，也可以先跳過。'];
  let invitation=tones[0];
  function track(event) {
    const names={snapshot_start:'snapshot_started',snapshot_complete:'snapshot_completed',share_intent:'share_intent',native_share_resolved:'native_share_resolved',native_share_cancel:'native_share_cancelled',native_share_error:'native_share_failed',image_download:'image_download_started',text_copy:'text_copied',link_copy:'link_copied',workbench_enter:'workbench_entered'};
    if(names[event])analytics.track(names[event],{entry:screen,card_type:mode,format,channel:platform});
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT, JSON.stringify({answers,tags:selectedTags,identity,scheduledAt,step})); canStore=true;return true; } catch { canStore=false;return false; }
  }
  function status(message) { const target = root.querySelector('#g-status'); if (target) target.textContent = message; }
  const button = (action, label, cls = 'g-secondary') => `<button type="button" class="${cls}" data-g="${action}">${label}</button>`;
  const nav = () => `<nav class="growth-nav" aria-label="快照導覽"><a class="growth-logo" href="#" data-g="home"><span>↗</span>One Day Reset</a>${button('workbench','完整工作台','g-link')}</nav>`;
  function show(next) {
    screen = next;
    root.hidden = false; app.hidden = true;
    render();
    window.scrollTo(0, 0);
    root.querySelector('h1, h2')?.focus({preventScroll:true});
  }
  function home() {
    const medium = analytics.attribution().medium;
    const invited = medium === 'share' || medium === 'friend';
    return `<div class="g-hero"><div>${invited?'<p class="g-invitation">朋友邀請你做一個 90 秒的小練習</p>':''}<h1 tabindex="-1">最近很努力，<br>卻不知道<br>在往哪裡走？</h1><div class="g-actions">${button('start','開始 90 秒快照','g-primary')}</div><p class="g-note">免登入、答案只留在你的手機</p><p class="g-intro">三個問題，留下一個這週能做的小行動。<br>沒有 AI 替你回答，答案是你自己的。</p>${answers.some(Boolean)?'<p class="g-note">上次的回答還在，可以繼續或修改。約 90 秒起步，按自己的步調寫。</p>':''}</div><aside class="g-sample" aria-label="分享問題卡範例"><small>留一個問題給自己</small><blockquote>哪件小事，<br>你想在這一週<br>替自己留一點空間？</blockquote><div><p>先看見它，再決定下一步。</p><strong>One Day Reset</strong></div></aside></div><footer class="g-footer"><span>三個問題。一份只屬於你的筆記。</span>${button('share','分享給朋友','g-link')}${button('workbench','到完整工作台繼續','g-link')}</footer><p class="g-note">靈感來自 <a href="https://letters.thedankoe.com/p/how-to-fix-your-entire-life-in-1" target="_blank" rel="noopener noreferrer">Dan Koe</a>，非官方、非授權的獨立工具。</p>${window.resetPrivacySettings()}`;
  }
  function quick() {
    const q = questions[step];
    const starting=step===0?`<fieldset class="g-tags"><legend>可選標籤：只當起手式，最多兩個，也可以略過</legend>${tags.map((tag,i)=>`<button type="button" class="g-secondary" data-g="tag" data-index="${i}" aria-pressed="${selectedTags.includes(tag)}">${tag}</button>`).join('')}</fieldset>`:`<details class="g-starters"><summary>可選範例：點一下帶入開頭，文字都能改</summary>${starters[step].map((text,i)=>`<button type="button" class="g-secondary" data-g="starter" data-index="${i}">${text}</button>`).join('')}</details>`;
    const extras=step===2?`<label for="g-identity">可選身份句：我是會＿＿的人</label><input id="g-identity" type="text" maxlength="120" value="${escape(identity)}" placeholder="例如：留時間給自己"><label for="g-when">預計何時做（可選）</label><input id="g-when" type="datetime-local" value="${escape(scheduledAt)}"><p class="g-note">整理後可加入行事曆；不要求通知權限。</p>`:'';
    return `<div class="g-flow"><p>人生快照 · ${step + 1} / 3</p><p class="g-note">沒有對錯，不會有 AI 替你寫答案。任何一題都可以跳過。</p><div class="g-progress" aria-hidden="true">${questions.map((_,i)=>`<span class="${i<=step?'active':''}"></span>`).join('')}</div><h2 tabindex="-1">${q[1]}</h2><p>${q[2]}</p><div class="g-paper">${starting}<label for="g-answer">${q[0]}，用自己的話寫（可選）</label><textarea id="g-answer" maxlength="500" placeholder="${q[3]}">${escape(answers[step])}</textarea>${extras}<p class="g-note">只給自己看 · 最多 500 字 · 可回上一題修改</p><p id="g-status" class="g-warning" role="status"></p></div><div class="g-actions">${button(step?'back':'home',step?'上一題':'先回首頁')}${button('next',step===2?'整理我的快照':'下一題','g-primary')}${button('skip',step===2?'先留白，看看結果':'跳過這一題','g-link')}</div><p class="g-note">回答自動暫存於此瀏覽器；若儲存受限，離開前可複製回答。</p></div>`;
  }
  const short = text => Array.from(text).slice(0,160).join('')+(Array.from(text).length>160?'…':'');
  const identityLine = () => identity.trim()?(/^我是會.*的人[。]?$/s.test(identity.trim())?identity:`我是會${identity}的人`):'';
  const snapshotLine = () => identityLine()?`${identityLine()}\n這週我先：${short(answers[2])||'（先留白）'}。`:`最近的我：${short(answers[0])||'（先留白）'}。我想靠近：${short(answers[1])||'（先留白）'}。這週我先：${short(answers[2])||'（先留白）'}。`;
  function result() {
    return `<div class="g-flow"><p>你的 90 秒人生快照</p><h1 tabindex="-1">把下一步，<br>留給這週的自己。</h1><p>讀讀自己的原話，看看這週的小事是否靠近你想要的畫面。留白的地方，可以日後再想。</p><div class="g-paper"><p class="g-result-line" id="g-result-line">${escape(snapshotLine())}</p><dl class="g-summary">${questions.map((q,i)=>`<dt>${q[0]}</dt><dd>${escape(answers[i]||'（先留白）')}</dd>`).join('')}</dl></div>${invitationActions()}${invitationEditor()}<div class="g-actions">${button('share','選擇分享卡')}${button('edit','修改快照','g-link')}</div>${scheduledAt?`<div class="g-actions">${button('action-calendar','為這件小事加行事曆提醒')}</div><p class="g-note">提醒檔含你的行動文字，只在點擊後產生；請自行匯入日曆。</p>`:''}<p class="g-note">換瀏覽器開啟時，這份回答不會跟著過去。離開前可複製或下載私人備份。</p><div class="g-actions">${button('copy-answers','複製我的回答')}${button('draft-export','下載私人快照')}${button('draft-clear','清除私人快照')}</div><p id="g-status" role="status"></p><div class="g-footer">${button('bring','帶到完整工作台','g-link')}</div></div>`;
  }
  const cardText = () => mode === 'personal' ? Array.from(personal).slice(0,360).join('')+(Array.from(personal).length>360?'…':'') : '哪件小事，你想在這一週替自己留一點空間？';
  function shareURL() {
    const url=new URL('.',location.href);url.hash='snapshot';url.searchParams.set('utm_source','share');url.searchParams.set('utm_medium','friend');url.searchParams.set('utm_campaign','snapshot');return url.href;
  }
  const shortURL = () => 'baabaa-works.github.io/one-day-reset/?s=f#snapshot';
  const caption = () => `${mode==='personal'?cardText()+'\n\n':''}${invitation}\n${shareURL()}`;
  const invitationText=()=>`${invitation}\n${shareURL()}`;
  const lineURL=()=>{const url=new URL('https://social-plugins.line.me/lineit/share');url.searchParams.set('url',shareURL());url.searchParams.set('text',invitation);return url.href;};
  const invitationActions=()=>`<div class="g-actions g-invite-actions"><a class="g-primary g-line" data-g="line" href="${escape(lineURL())}" target="_blank" rel="noopener noreferrer">傳給最近也很迷惘的朋友</a>${button('copy-invite','複製邀請訊息＋連結')}${button('threads','發到 Threads（複製文字）')}</div>`;
  const invitationEditor=()=>`<details><summary>換個口吻，或編輯邀請語</summary><label for="g-tone">可選口吻</label><select id="g-tone">${tones.map((_,i)=>`<option value="${i}">${['一起試試','輕輕關心','陪我練習'][i]}</option>`).join('')}</select><label for="g-invite">邀請語（不會自動帶入回答）</label><textarea id="g-invite" maxlength="300">${escape(invitation)}</textarea></details>`;
  function share() {
    return `<h1 tabindex="-1">留一個問題，給也在找方向的人。</h1><p>通用問題卡不含你的回答。選擇個人卡後，先預覽與編輯，再確認產生。</p><div class="g-share"><div><canvas id="g-card" role="img" aria-label="分享卡預覽"></canvas><p class="g-note">預覽就是將分享的圖片。${format==='story'?'1080 × 1920，適合限時動態':'1080 × 1350，適合 Threads 與 IG 貼文'}</p>${button('image-preview','開啟圖片，長按儲存')}</div><div><fieldset><legend>卡片內容</legend><label><input type="radio" name="cardMode" value="question" ${mode==='question'?'checked':''}>通用問題卡</label><label><input type="radio" name="cardMode" value="personal" ${mode==='personal'?'checked':''}>分享我的快照卡</label></fieldset><div ${mode==='personal'?'':'hidden'}><label for="g-personal">願意讓別人看見的文字（可編輯）</label><textarea id="g-personal" maxlength="600" placeholder="寫下願意分享的文字">${escape(personal)}</textarea><p class="g-note">這張卡會包含你的回答。最多 600 字；請看過左側預覽再確認。編輯內容只留在這一頁。</p>${button('confirm-personal',personalConfirmed?'已確認，可分享':'我確認預覽，產生這張卡')}</div><label for="g-platform">準備分享到</label><select id="g-platform"><option value="threads" ${platform==='threads'?'selected':''}>Threads</option><option value="instagram" ${platform==='instagram'?'selected':''}>Instagram</option></select><label for="g-format">圖片版型</label><select id="g-format"><option value="feed" ${format==='feed'?'selected':''}>貼文 · 4:5</option><option value="story" ${format==='story'?'selected':''}>限時動態 · 9:16</option></select>${invitationActions()}${invitationEditor()}<div class="g-actions">${button('download','存成圖片')}${button('copy-link','複製連結')}${button('native','開啟手機分享')}${button('copy-text','複製卡片文字＋連結')}</div><p class="g-note">IG 限動：存圖 → 限動 → 貼連結貼圖。先複製連結，再到 IG 加上貼圖；系統選單的 App 由裝置決定。</p><p class="g-status" id="g-status" role="status"></p><div id="g-manual" hidden><label for="g-copy">瀏覽器無法自動複製，請長按選取文字</label><textarea class="g-copy" id="g-copy" readonly></textarea></div><div class="g-actions">${button('return','回到'+(returnScreen==='result'?'我的快照':'首頁'),'g-link')}</div></div></div>`;
  }
  function render() {
    root.innerHTML = `<div class="growth-shell">${nav()}${!canStore?'<p class="g-storage-warning" role="status">此瀏覽器無法儲存，回答暫留在這一頁的記憶體；重新整理或離開就會消失。結果頁可手動複製回答。</p>':''}${screen==='home'?home():screen==='quick'?quick():screen==='result'?result():share()}${window.resetSafetyNote()}</div>`;
    if (screen === 'share') drawCard();
  }
  function lines(ctx, text, maxWidth) {
    const output = []; let line = '';
    for (const char of Array.from(text)) {
      if (char==='\n') {output.push(line);line='';continue;}
      if (ctx.measureText(line+char).width>maxWidth && line && !/[，。？！]/.test(char)) {output.push(line);line='';}
      line += char;
    }
    output.push(line); return output;
  }
  function drawCard() {
    imageFile = null;
    const version = ++imageVersion;
    const canvas = document.getElementById('g-card');
    canvas.width=1080;canvas.height=format==='story'?1920:1350;
    const c=canvas.getContext('2d'), h=canvas.height;
    c.fillStyle='#263b2c';c.fillRect(0,0,1080,h);
    c.fillStyle='#e3fa9c';c.beginPath();c.arc(925,180,55,0,Math.PI*2);c.fill();
    c.fillStyle='#f5f8ef';c.font='32px "Microsoft JhengHei",sans-serif';
    c.fillText(mode==='personal'?'我的一句話快照':'留一個問題給自己',86,200);
    let size=mode==='question'?68:58, text=cardText() || '在右邊寫下，願意分享的那一句。';
    let rows;
    do {c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;rows=lines(c,text,880);if(rows.length*size*1.65< h-590)break;size-=2;} while(size>32);
    const start=(h-240-rows.length*size*1.65)/2+size;
    rows.forEach((row,i)=>c.fillText(row,86,start+i*size*1.65));
    c.fillStyle='#e3fa9c';c.fillRect(86,h-320,90,5);
    c.fillStyle='#f5f8ef';c.font='30px "Microsoft JhengHei",sans-serif';c.fillText('三個問題，給自己一個重新開始的地方。',86,h-260);
    c.font='700 42px sans-serif';c.fillText('One Day Reset',86,h-180);
    c.font='28px "Microsoft JhengHei",sans-serif';c.fillText('90 秒人生快照 · 免費體驗',86,h-120);
    c.font='25px sans-serif';c.fillText(shortURL(),86,h-65);
    canvas.setAttribute('aria-label',`分享卡預覽：${text}。One Day Reset，90 秒人生快照。`);
    if(mode==='question'||personalConfirmed)canvas.toBlob(blob=>{if(blob && version===imageVersion){imageFile=new File([blob],'one-day-reset.png',{type:'image/png'});analytics.track('card_generated',{card_type:mode,format,channel:platform,entry:'share'});}},'image/png');
  }
  const validCard = () => {if(mode==='personal'&&(!personal.trim()||!personalConfirmed)){status(!personal.trim()?'先寫下願意分享的一句話，或改用通用問題卡。':'先看過預覽，按「我確認預覽，產生這張卡」。');document.getElementById('g-personal').focus();return false;}return true;};
  function download(name, blob) {
    return localUI.download(name,blob);
  }
  async function copy(text, event) {
    try {if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);track(event);status('已複製。你可以貼到想分享的地方。');}
    catch {const manual=document.getElementById('g-manual');if(manual){manual.hidden=false;const box=document.getElementById('g-copy');box.value=text;box.focus();box.select();}else localUI.manual(text);status('請手動複製下方文字。');}
  }
  async function nativeShare() {
    if(!validCard())return;
    track('share_intent');
    if (typeof navigator.share!=='function') {analytics.track('share_failed');status('此瀏覽器未提供分享選單，可長按圖片或複製文字與網址。');localUI.imagePreview(document.getElementById('g-card'));return;}
    const payload={title:'One Day Reset｜90 秒人生快照',text:caption()};
    try{if(imageFile && navigator.canShare?.({files:[imageFile]}))payload.files=[imageFile];}catch{}
    try {await navigator.share(payload);track('native_share_resolved');status('已交給系統分享流程。是否發布，請在你選擇的 App 中確認。');}
    catch(error){track(error.name==='AbortError'?'native_share_cancel':'native_share_error');status(error.name==='AbortError'?'已取消分享，卡片仍在這裡。':'分享未完成，可長按圖片或複製文字與網址。');if(error.name!=='AbortError'){analytics.track('share_failed');localUI.imagePreview(document.getElementById('g-card'));}}
  }
  function workbench() {track('workbench_enter');if(screen==='quick'||screen==='result'||(screen==='share'&&returnScreen==='result'))analytics.track('snapshot_workbench_entered',{entry:screen});root.hidden=true;app.hidden=false;document.dispatchEvent(new Event('reset:workbench'));window.scrollTo(0,0);}
  root.addEventListener('click',event=>{
    const target=event.target.closest('[data-g]');if(!target)return;if(target.dataset.g==='line'){track('share_intent');return;}event.preventDefault();
    switch(target.dataset.g){
      case 'home':show('home');break;
      case 'start':track('snapshot_start');show('quick');break;
      case 'back':step=Math.max(0,step-1);saveDraft();show('quick');break;
      case 'next':case 'skip':if(step<2){step++;saveDraft();show('quick');}else{saveDraft();track('snapshot_complete');show('result');}break;
      case 'tag':{const tag=tags[Number(target.dataset.index)];if(selectedTags.includes(tag))selectedTags=selectedTags.filter(t=>t!==tag);else if(selectedTags.length<2)selectedTags.push(tag);else{status('最多選兩個標籤，也可以直接寫自己的話。');break;}saveDraft();target.setAttribute('aria-pressed',String(selectedTags.includes(tag)));break;}
      case 'starter':{const text=starters[step][Number(target.dataset.index)];if(answers[step]&&!confirm('要用可編輯範例替換這一題的文字嗎？'))break;answers[step]=text;document.getElementById('g-answer').value=text;document.getElementById('g-answer').focus();saveDraft();status('這是可選範例，請改成自己的話。');break;}
      case 'edit':step=0;show('quick');break;
      case 'share':returnScreen=screen==='result'?'result':'home';track('share_intent');mode='question';personal='';personalConfirmed=false;show('share');break;
      case 'return':personal='';imageFile=null;show(returnScreen);break;
      case 'workbench':workbench();break;
      case 'bring':workbench();document.dispatchEvent(new CustomEvent('reset:snapshot-import',{detail:{answers:[...answers],identity:identityLine()}}));break;
      case 'native':nativeShare();break;
      case 'download':if(validCard()){track('share_intent');if(imageFile){const ok=download(imageFile.name,imageFile);if(ok)track('image_download');status(ok?'已啟動下載；瀏覽器無法確認是否存入相簿。若沒有收到，可長按下方圖片。':'下載未完成，可長按圖片儲存。');localUI.imagePreview(document.getElementById('g-card'));}else status('圖片正在準備，請稍後再按一次。');}break;
      case 'image-preview':if(validCard())localUI.imagePreview(document.getElementById('g-card'));break;
      case 'confirm-personal':if(!personal.trim()){status('先寫下願意分享的文字。');break;}personalConfirmed=true;drawCard();status('已確認預覽；可存圖或用系統分享。');target.textContent='已確認，可分享';break;
      case 'copy-invite':case 'threads':track('share_intent');copy(invitationText(),'text_copy');break;
      case 'copy-answers':copy(questions.map((q,i)=>`${q[1]}\n${answers[i]||'（先留白）'}`).join('\n\n')+`\n\n身份句：${identityLine()||'（先留白）'}\n預計何時做：${scheduledAt||'（先留白）'}`,'text_copy');break;
      case 'copy-text':if(validCard()){track('share_intent');copy(caption(),'text_copy');}break;
      case 'copy-link':track('share_intent');copy(shareURL(),'link_copy');break;
      case 'action-calendar':try{const [date,time]=scheduledAt.split('T');const ics=window.ResetCalendar.calendar([{date,time,title:'這週我先：'+(answers[2]||'留時間給自己'),description:answers[2]||'回到快照，想一件願意開始的小事。'}]);if(!download('我的小行動.ics',new Blob([ics],{type:'text/calendar;charset=utf-8'})))localUI.manual(`預計：${scheduledAt}\n行動：${answers[2]}`,'提醒下載未完成，可複製後手動加入日曆');}catch{status('請回第三題選擇有效的日期與時間。');}break;
      case 'draft-export':{const json=JSON.stringify({format:DRAFT,answers,tags:selectedTags,identity,scheduledAt,step},null,2);if(!download('私人人生快照.json',new Blob([json],{type:'application/json'})))localUI.manual(json,'備份下載未完成，請複製保存');break;}
      case 'draft-clear':if(confirm('清除三題私人快照？完整工作台不受影響。')){answers=['','',''];identity='';scheduledAt='';selectedTags=[];step=0;try{localStorage.removeItem(DRAFT);}catch{}show('home');}break;
      case 'metrics-export':download('本機操作統計.json',new Blob([JSON.stringify(analytics.report(),null,2)],{type:'application/json'}));break;
      case 'metrics-clear':analytics.clear();render();break;
    }
  });
  root.addEventListener('input',event=>{
    if(event.target.id==='g-answer'){answers[step]=event.target.value;status(saveDraft()?'已儲存在此瀏覽器。':'此瀏覽器無法儲存；離開前請完成並下載私人快照。');}
    if(event.target.id==='g-identity'||event.target.id==='g-when'){if(event.target.id==='g-identity')identity=event.target.value;else scheduledAt=event.target.value;status(saveDraft()?'已儲存在此瀏覽器。':'此瀏覽器無法儲存；目前回答保留在這一頁。');}
    if(event.target.id==='g-personal'){personal=event.target.value;personalConfirmed=false;drawCard();root.querySelector('[data-g="confirm-personal"]').textContent='我確認預覽，產生這張卡';status('預覽已更新，請再次確認分享內容。');}
    if(event.target.id==='g-invite'){invitation=event.target.value;root.querySelectorAll('[data-g="line"]').forEach(a=>a.href=lineURL());}
  });
  root.addEventListener('change',event=>{
    if(event.target.name==='cardMode'){mode=event.target.value;personalConfirmed=false;if(mode==='personal')personal=returnScreen==='result'?snapshotLine():'';render();}
    if(event.target.id==='g-tone'){invitation=tones[Number(event.target.value)];document.getElementById('g-invite').value=invitation;root.querySelectorAll('[data-g="line"]').forEach(a=>a.href=lineURL());}
    if(event.target.id==='g-platform')platform=event.target.value;
    if(event.target.id==='g-format'){format=event.target.value;render();}
  });
  const entry=document.createElement('button');entry.className='g-workbench-home';entry.textContent='90 秒快照與分享卡';entry.addEventListener('click',()=>show('home'));document.querySelector('.main-inner').prepend(entry);
  // Every entry shows the promise and explicit start; workbench data stays intact.
  show('home');
  if(location.hash==='#review'){workbench();document.dispatchEvent(new Event('reset:review'));}
})();
