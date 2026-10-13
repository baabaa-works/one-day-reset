(() => {
  'use strict';
  const root = document.getElementById('growth');
  const app = document.getElementById('app');
  const DRAFT = 'one-day-reset-snapshot-v1';
  const analytics = window.ResetAnalytics;
  const localUI = window.ResetLocalUI;
  let canStore = localUI.storageAvailable();
  // [卡片上的名稱, 題目, 一句提示, 輸入框名稱, 範例]
  const questions = [
    ['現在', '你已經習慣忍受的一件事', '最近哪個情境，常讓你默默耗掉力氣？點最像的，或自己寫一句。', '用自己的話補一句', '例如：下班後還在看工作訊息…'],
    ['三年後的星期二', '三年後，某個普通的星期二', '那天在哪裡醒來、做什麼、心情如何？先不管現實限制。', '那天的畫面', '例如：在安靜的房間醒來，慢慢吃早餐…'],
    ['這週的一步', '如果你已經是那樣的人，這週你會做的一件小事', '小到願意開始就好。', '這週的一步', '例如：週三晚餐後散步十分鐘…']
  ];
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const saved = read(DRAFT);
  let answers = questions.map((_, i) => typeof saved?.answers?.[i] === 'string' ? saved.answers[i].slice(0, 500) : '');
  const tags=['一直很忙','很少休息','方向模糊','先顧別人','事情拖著'];
  // 第 2、3 題的片語是完整的話，點了直接寫進輸入框，不需要刪任何字。
  const phrases=[[],['睡到自然醒','不用趕著出門','慢慢吃早餐','做的事自己在乎','下班還有力氣','晚上睡得安穩'],['散步十分鐘','早半小時睡','下班後關掉通知','留一個晚上給自己','把拖著的事做五分鐘','約一個想見的人']];
  let selectedTags=Array.isArray(saved?.tags)?saved.tags.filter(t=>tags.includes(t)).slice(0,2):[];
  let identity=typeof saved?.identity==='string'?saved.identity.slice(0,120):'';
  let scheduledAt=typeof saved?.scheduledAt==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(saved.scheduledAt)?saved.scheduledAt:'';
  let step = Number.isInteger(saved?.step)?Math.max(0,Math.min(2,saved.step)):0, screen = 'home', returnScreen = 'home';
  let done = saved?.done===true;
  let mode = 'question', personal = '', platform = 'threads', format = 'feed', imageFile = null, imageVersion = 0;
  let personalConfirmed=false, moreOpen=false, toneIndex=0, customWhen=false;
  const tones=['最近有點找不到方向？一起做個 90 秒的小練習，留下一個這週能做的小行動。','想把這個小練習留給你。有空時寫幾句，答案只給自己看。','陪我做一個 90 秒快照吧。沒有標準答案，想跳過的題目可以跳過。'];
  let invitation=tones[0];
  function track(event) {
    const names={snapshot_start:'snapshot_started',snapshot_complete:'snapshot_completed',share_intent:'share_intent',native_share_resolved:'native_share_resolved',native_share_cancel:'native_share_cancelled',native_share_error:'native_share_failed',image_download:'image_download_started',text_copy:'text_copied',link_copy:'link_copied',workbench_enter:'workbench_entered'};
    if(names[event])analytics.track(names[event],{entry:screen,card_type:mode,format,channel:platform});
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT, JSON.stringify({answers,tags:selectedTags,identity,scheduledAt,step,done})); canStore=true;return true; } catch { canStore=false;return false; }
  }
  function status(message, warn=false) { const target = root.querySelector('#g-status'); if (target) {target.textContent = message;target.classList.toggle('g-warning',warn);} }
  const savedNote = ok => status(ok?'✓ 已存在這台手機':'！這個瀏覽器存不了，回答先留在這一頁。',!ok);
  const button = (action, label, cls = 'g-secondary', index) => `<button type="button" class="${cls}" data-g="${action}"${index===undefined?'':` data-index="${index}"`}>${label}</button>`;
  const nav = () => `<nav class="growth-nav" aria-label="快照導覽"><a class="growth-logo" href="#" data-g="home"><span aria-hidden="true">↗</span>One Day Reset</a>${button('workbench','完整版','g-link')}</nav>`;
  const clip = (text, max=160) => {const chars=Array.from(text.trim());return chars.slice(0,max).join('')+(chars.length>max?'…':'');};
  const hasInput = i => Boolean(answers[i].trim()) || (i===0 && selectedTags.length>0);
  const started = () => done || questions.some((_, i) => hasInput(i));
  const nextLabel = () => hasInput(step)?(step===2?'看我的快照':'下一題'):(step===2?'先跳過，看我的快照':'先跳過');
  // 身份句的框（我是會＿＿的人）由畫面提供；使用者連框一起打時只留中間那段，
  // 自己的話裡已經有「會」就不再補一個。
  function identityLine() {
    const text=identity.trim().replace(/[。.]$/,'');
    if(!text)return '';
    if(/^我是(?!會)/.test(text))return text;
    const core=text.replace(/^我是會/,'').replace(/^會/,'').replace(/的人$/,'').trim();
    return core?`我是${core.includes('會')?'':'會'}${core}的人`:'';
  }
  const identityCore = () => /^我是(?!會)/.test(identity.trim())?identity.trim():identity.trim().replace(/[。.]$/,'').replace(/^我是會/,'').replace(/^會/,'').replace(/的人$/,'').trim();
  const pad = n => String(n).padStart(2,'0');
  const stamp = (date, hour) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(hour)}:00`;
  function presets() {
    const now=new Date(),list=[];
    if(now.getHours()<20)list.push(['今晚 9 點',stamp(now,21)]);
    const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);list.push(['明天晚上 8 點',stamp(tomorrow,20)]);
    const weekend=new Date(now);weekend.setDate(now.getDate()+(now.getDay()===6?1:6-now.getDay()||7));list.push([(weekend.getDay()===6?'週六':'週日')+'早上 10 點',stamp(weekend,10)]);
    return list;
  }
  function whenText() {
    if(!scheduledAt)return '';
    try{return new Intl.DateTimeFormat('zh-TW',{month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(scheduledAt));}catch{return scheduledAt.replace('T',' ');}
  }
  // 寫完後停下來幾秒的人，才會看到從畫面上方浮出來的完整版邀請；已經在操作或往下捲的人不打擾。
  let floatTimer=0, floatSeen=false;
  function hideFloat() {
    const box=document.getElementById('g-float');if(!box)return;
    box.hidden=true;box.classList.remove('is-in');
  }
  function showFloat() {
    const box=document.getElementById('g-float');
    if(screen!=='result'||floatSeen||!box||!carried()||window.scrollY>120)return;
    floatSeen=true;box.hidden=false;
    requestAnimationFrame(()=>box.classList.add('is-in'));
    const card=root.querySelector('.g-invite');
    if(card&&'IntersectionObserver'in window){const seen=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){hideFloat();seen.disconnect();}});seen.observe(card);}
  }
  function show(next) {
    clearTimeout(floatTimer);
    screen = next;
    root.hidden = false; app.hidden = true;
    render();
    window.scrollTo(0, 0);
    root.querySelector('h1, h2')?.focus({preventScroll:true});
  }
  function home() {
    const medium = analytics.attribution().medium;
    const invited = medium === 'share' || medium === 'friend';
    return `<div class="g-hero"><div>${invited?'<p class="g-invitation">朋友邀請你做一個 90 秒的小練習</p>':''}<h1 tabindex="-1">最近很努力，<br>卻不知道<br>在往哪裡走？</h1><div class="g-actions">${button('start',done?'看我的快照':started()?'繼續我的快照':'開始 90 秒快照','g-primary')}</div><p class="g-note">免登入、答案只留在你的手機${started()?'。上次寫的還在。':''}</p><p class="g-intro">三個問題，換一張寫給自己的卡，和一個這週做得到的小行動。<br>沒有 AI 替你回答；想跳過的題目可以跳過。</p></div><aside class="g-sample" aria-label="寫完會得到的卡（示意）"><small>寫完會得到這樣一張卡 · 示意</small><ol class="g-mini"><li><span>現在</span>下班後還在回工作訊息</li><li><span>三年後的星期二</span>睡到自然醒，慢慢吃早餐</li><li><span>這週的一步</span>週三晚上九點後關機</li></ol><strong>One Day Reset</strong></aside></div><footer class="g-footer"><span>三個問題。一份只屬於你的筆記。</span>${button('share','分享給朋友','g-link')}${button('workbench','想寫更深？到完整版','g-link')}</footer><p class="g-note">靈感來自 <a href="https://letters.thedankoe.com/p/how-to-fix-your-entire-life-in-1" target="_blank" rel="noopener noreferrer">Dan Koe</a>，非官方、非授權的獨立工具。</p>${window.resetPrivacySettings()}`;
  }
  function echo(i) {
    const text=[i===0?selectedTags.join('、'):'',clip(answers[i],80)].filter(Boolean).join('｜');
    return text?`<p class="g-echo"><span>${i===0?'你剛寫下的現在':'你想去的星期二'}</span>${escape(text)}</p>`:'';
  }
  function quick() {
    const q = questions[step];
    const steps=questions.map((item,i)=>`<li class="${i<step?'done':i===step&&hasInput(i)?'filled':''}"${i===step?' aria-current="step"':''}>${i<step&&hasInput(i)?'✓ ':''}${i+1} ${['現在','三年後','這週一步'][i]}</li>`).join('');
    const picks=step===0?`<fieldset class="g-tags"><legend>最像你的（最多兩個）</legend><div class="g-chips">${tags.map((tag,i)=>`<button type="button" class="g-chip" data-g="tag" data-index="${i}" aria-pressed="${selectedTags.includes(tag)}">${tag}</button>`).join('')}</div></fieldset>`:`<fieldset class="g-tags g-phrases"><legend>點幾個像的，會直接寫進去</legend><div class="g-chips">${phrases[step].map((phrase,i)=>`<button type="button" class="g-chip" data-g="phrase" data-index="${i}" aria-pressed="${answers[step].includes(phrase)}">${phrase}</button>`).join('')}</div></fieldset>`;
    return `<div class="g-flow g-question"><ol class="g-steps" aria-label="第 ${step+1} 題，共 3 題">${steps}</ol>${step?echo(step-1):''}<h2 tabindex="-1">${q[1]}</h2><p class="g-hint">${q[2]}</p>${picks}<label for="g-answer">${q[3]}</label><textarea id="g-answer" rows="3" maxlength="500" placeholder="${q[4]}">${escape(answers[step])}</textarea><p id="g-status" class="g-saved" role="status"></p><div class="g-bar">${step?button('back','上一題'):''}${button('next',nextLabel(),'g-primary')}</div></div>`;
  }
  function syncFilled() {
    root.querySelector('.g-steps [aria-current]')?.classList.toggle('filled',hasInput(step));
    const next=root.querySelector('[data-g="next"]');if(next)next.textContent=nextLabel();
    root.querySelectorAll('[data-g="phrase"]').forEach(chip=>chip.setAttribute('aria-pressed',String(answers[step].includes(phrases[step][Number(chip.dataset.index)]))));
  }
  function togglePhrase(text, phrase) {
    if(text.includes(phrase))return text.replace(new RegExp('[，、]?'+phrase),'').replace(/^[，、\s]+/,'');
    const base=text.replace(/\s+$/,'');
    return ((base&&!/[，。、；！？,.;!?\n]$/.test(base)?base+'，':base)+phrase).slice(0,500);
  }
  const nowLine = () => [selectedTags.join('、'),clip(answers[0])].filter(Boolean).join('｜');
  const snapshotLine = () => identityLine()?`${identityLine()}\n下一步：${clip(answers[2])||'（先留白）'}`:`現在：${nowLine()||'（先留白）'}\n三年後的星期二：${clip(answers[1])||'（先留白）'}\n下一步：${clip(answers[2])||'（先留白）'}`;
  // 完整版會收到幾題：三題裡有寫字的，加上身份句。
  const carried = () => answers.filter(answer=>answer.trim()).length+(identityLine()?1:0);
  function result() {
    const action=answers[2].trim(), any=questions.some((_, i)=>hasInput(i));
    const invite=any?`<section class="g-invite" aria-labelledby="g-invite-title"><p class="g-eyebrow">寫完了。想再往下走的話</p><h2 id="g-invite-title">這張卡，可以寫得更完整</h2><p>完整版把這三個問題展開成一天的練習：先看清現況，再看想去的地方，最後排出明天的行動。</p><p class="g-invite-carry">${carried()?`你剛寫的 <strong data-carried>${carried()}</strong> 題會直接帶過去，不用重寫。`:''}一次一題，可以分好幾天寫。</p>${button('bring','帶著這張卡去完整版 →')}</section>`:'';
    const node=i=>{
      const text=answers[i].trim(),chips=i===0&&selectedTags.length?`<p class="g-node-tags">${selectedTags.map(tag=>`<span>${tag}</span>`).join('')}</p>`:'';
      const words=text?`<p class="g-words">${escape(text)}</p>`:chips?'':`<p class="g-words g-blank">（先留白）${button('fill','補上','g-link',i)}</p>`;
      return `<li class="g-node${i===2?' g-node-step':''}"><h2>${questions[i][0]}</h2>${chips}${words}${i===2?`<p class="g-when-badge" id="g-when-badge"${scheduledAt&&action?'':' hidden'}>已約 ${escape(whenText())}</p>`:''}</li>`;
    };
    const times=presets();customWhen=customWhen||Boolean(scheduledAt&&!times.some(([,value])=>value===scheduledAt));
    const next=action?`<section class="g-next"><h2>什麼時候做這一步？</h2><div class="g-chips" role="group" aria-label="選一個時間">${times.map(([label,value])=>`<button type="button" class="g-chip" data-g="when" data-value="${value}" aria-pressed="${!customWhen&&scheduledAt===value}">${label}</button>`).join('')}<button type="button" class="g-chip" data-g="when" data-value="custom" aria-pressed="${customWhen}">自己選時間</button></div><div id="g-when-custom"${customWhen?'':' hidden'}><label for="g-when">日期與時間</label><input id="g-when" type="datetime-local" value="${escape(scheduledAt)}"></div><div class="g-actions">${button('action-calendar','加入行事曆','g-primary')}</div><p class="g-note">提醒檔（.ics）含你寫的這一步，只存在你的手機。</p></section>`:`<div class="g-actions">${button('fill',any?'補上這週的一步':'從第一題開始寫','g-primary',any?2:0)}</div>`;
    return `<div class="g-flow g-result"><p class="g-eyebrow">你的 90 秒快照</p><h1 tabindex="-1">${action?'這週，先做這一步。':any?'先看見，就是開始。':'這張卡，還在等你。'}</h1><section class="g-card-live" aria-label="我的快照"><ol class="g-summary">${questions.map((_, i)=>node(i)).join('')}</ol><p class="g-sign" id="g-sign"${identityLine()?'':' hidden'}>${escape(identityLine())}</p></section>${next}<section class="g-add"><h2>想再加一句嗎？</h2><p class="g-note">替那個星期二的自己，留一句話。</p><div class="g-fill"><span aria-hidden="true">我是會</span><input id="g-identity" type="text" maxlength="120" autocomplete="off" aria-label="我是會什麼樣的人" value="${escape(identityCore())}" placeholder="留時間給自己…"><span aria-hidden="true">的人</span></div></section>${invite}<p class="g-status" id="g-status" role="status"></p><div class="g-actions">${button('share','分享給朋友')}${button('edit','修改回答','g-link')}</div><details class="g-more"><summary>備份與清除</summary><p class="g-note">換瀏覽器或清除資料後，這張卡不會跟著過去。</p><div class="g-actions">${button('copy-answers','複製我的回答')}${button('draft-export','下載私人快照')}${button('draft-clear','清除私人快照')}</div></details>${carried()?`<aside class="g-float" id="g-float" aria-label="完整版邀請" aria-live="polite" hidden><div class="g-float-text"><p class="g-float-title">這張卡，可以寫得更完整</p><p>你寫的 <strong data-carried>${carried()}</strong> 題會直接帶過去</p></div><button type="button" class="g-float-go" data-g="float-go">去完整版 →</button><button type="button" class="g-float-close" data-g="float-close" aria-label="關閉這則提示">×</button></aside>`:''}</div>`;
  }
  function syncWhen() {
    root.querySelectorAll('[data-g="when"]').forEach(chip=>chip.setAttribute('aria-pressed',String(chip.dataset.value==='custom'?customWhen:!customWhen&&chip.dataset.value===scheduledAt)));
    const custom=document.getElementById('g-when-custom');if(custom)custom.hidden=!customWhen;
    const badge=document.getElementById('g-when-badge');if(badge){badge.hidden=!scheduledAt;badge.textContent='已約 '+whenText();}
  }
  const reminderText = () => `時間：${whenText()}\n這週的一步：${answers[2].trim()}`;
  const cardText = () => mode === 'personal' ? Array.from(personal).slice(0,360).join('')+(Array.from(personal).length>360?'…':'') : '哪件小事，你想在這一週替自己留一點空間？';
  function shareURL() {
    const url=new URL('.',location.href);url.hash='snapshot';url.searchParams.set('utm_source','share');url.searchParams.set('utm_medium','friend');url.searchParams.set('utm_campaign','snapshot');return url.href;
  }
  const shortURL = () => 'baabaa-works.github.io/one-day-reset/?s=f#snapshot';
  const caption = () => `${mode==='personal'?cardText()+'\n\n':''}${invitation}\n${shareURL()}`;
  const invitationText=()=>`${invitation}\n${shareURL()}`;
  const lineURL=()=>{const url=new URL('https://social-plugins.line.me/lineit/share');url.searchParams.set('url',shareURL());url.searchParams.set('text',invitation);return url.href;};
  function share() {
    return `<h1 tabindex="-1">留一個問題，<br>給也在找方向的人。</h1><div class="g-share"><div><canvas id="g-card" role="img" aria-label="分享卡預覽"></canvas><p class="g-note">${mode==='personal'?'這張卡有你寫的字，確認預覽後才會產生。':'這張卡不含你的回答。'}</p></div><div><fieldset><legend>要分享哪一張</legend><label><input type="radio" name="cardMode" value="question" ${mode==='question'?'checked':''}>問題卡（不含我的回答）</label><label><input type="radio" name="cardMode" value="personal" ${mode==='personal'?'checked':''}>我的快照卡</label></fieldset><div ${mode==='personal'?'':'hidden'}><label for="g-personal">願意讓別人看見的文字</label><textarea id="g-personal" maxlength="600" placeholder="寫下願意分享的文字…">${escape(personal)}</textarea><p class="g-note">這張卡會包含你的回答。圖片最多顯示前 360 字；修改只留在這一頁。</p>${button('confirm-personal',personalConfirmed?'已確認，可分享':'我確認預覽，產生這張卡')}</div><div class="g-actions">${button('download','存成圖片','g-primary')}${button('copy-link','複製連結')}</div><p class="g-status" id="g-status" role="status"></p><div id="g-manual" hidden><label for="g-copy">瀏覽器無法自動複製，請長按選取文字</label><textarea class="g-copy" id="g-copy" readonly></textarea></div><details class="g-more" id="g-more"${moreOpen?' open':''}><summary>更多分享方式</summary><div class="g-actions g-invite-actions"><a class="g-secondary g-line" data-g="line" href="${escape(lineURL())}" target="_blank" rel="noopener noreferrer">用 LINE 傳給朋友</a>${button('copy-invite','複製邀請訊息＋連結')}${button('threads','發到 Threads（複製文字）')}${button('native','開啟手機分享')}${button('copy-text','複製卡片文字＋連結')}${button('image-preview','開啟圖片，長按儲存')}</div><label for="g-format">圖片版型</label><select id="g-format"><option value="feed" ${format==='feed'?'selected':''}>貼文 · 4:5</option><option value="story" ${format==='story'?'selected':''}>限時動態 · 9:16</option></select><label for="g-platform">準備分享到</label><select id="g-platform"><option value="threads" ${platform==='threads'?'selected':''}>Threads</option><option value="instagram" ${platform==='instagram'?'selected':''}>Instagram</option></select><label for="g-tone">邀請語口吻</label><select id="g-tone">${tones.map((_,i)=>`<option value="${i}" ${toneIndex===i?'selected':''}>${['一起試試','輕輕關心','陪我練習'][i]}</option>`).join('')}</select><label for="g-invite">邀請語（不會帶入你的回答）</label><textarea id="g-invite" maxlength="300">${escape(invitation)}</textarea><p class="g-note">IG 限動：先存圖和複製連結，到限動選圖後加上連結貼圖。</p></details><div class="g-actions">${button('return','回到'+(returnScreen==='result'?'我的快照':'首頁'),'g-link')}</div></div></div>`;
  }
  function render() {
    root.innerHTML = `<div class="growth-shell${screen==='quick'?' g-shell-flow':''}">${nav()}${!canStore?`<p class="g-storage-warning" role="status">${screen==='quick'?'這個瀏覽器存不了資料，離開前請到最後一頁複製。':'這個瀏覽器存不了資料，回答只暫留在這一頁；重新整理或離開就會消失。最後一頁可以手動複製。'}</p>`:''}${screen==='home'?home():screen==='quick'?quick():screen==='result'?result():share()}${screen==='quick'?'':window.resetSafetyNote()}</div>`;
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
    const fullText=cardText() || '在右邊寫下，願意分享的那一句。';
    const identityCard=mode==='personal'&&/^我是[^\n]*\n下一步：/.test(fullText);
    const text=identityCard?fullText.split('\n')[0]:fullText;
    const actionText=identityCard?Array.from(fullText.split('\n').slice(1).join('\n')).slice(0,100).join(''):'';
    let size=mode==='question'||identityCard?68:58;
    let rows;
    do {c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;rows=lines(c,text,880);if(rows.length*size*1.65< h-(identityCard?750:590))break;size-=2;} while(size>32);
    const start=(h-(identityCard?560:240)-rows.length*size*1.65)/2+size;
    rows.forEach((row,i)=>c.fillText(row,86,start+i*size*1.65));
    if(actionText){c.font='32px "Microsoft JhengHei",sans-serif';lines(c,actionText,880).slice(0,4).forEach((row,i)=>c.fillText(row,86,h-545+i*48));}
    c.fillStyle='#e3fa9c';c.fillRect(86,h-320,90,5);
    c.fillStyle='#f5f8ef';c.font='30px "Microsoft JhengHei",sans-serif';c.fillText('三個問題，給自己一個重新開始的地方。',86,h-260);
    c.font='700 42px sans-serif';c.fillText('One Day Reset',86,h-180);
    c.font='28px "Microsoft JhengHei",sans-serif';c.fillText('90 秒人生快照 · 免費體驗',86,h-120);
    c.font='25px sans-serif';c.fillText(shortURL(),86,h-65);
    canvas.setAttribute('aria-label',`分享卡預覽：${fullText}。One Day Reset，90 秒人生快照。`);
    if(mode==='question'||personalConfirmed)canvas.toBlob(blob=>{if(blob && version===imageVersion){imageFile=new File([blob],'one-day-reset.png',{type:'image/png'});analytics.track('card_generated',{card_type:mode,format,channel:platform,entry:'share'});}},'image/png');
  }
  const validCard = () => {if(mode==='personal'&&(!personal.trim()||!personalConfirmed)){status(!personal.trim()?'先寫下願意分享的一句話，或改用問題卡。':'先看過預覽，按「我確認預覽，產生這張卡」。');document.getElementById('g-personal').focus();return false;}return true;};
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
  // 兩個入口行為一致：快照有內容就帶進完整版的空白題目，已有文字的題目不動。
  function workbench() {
    track('workbench_enter');if(screen==='quick'||screen==='result'||(screen==='share'&&returnScreen==='result'))analytics.track('snapshot_workbench_entered',{entry:screen});
    root.hidden=true;app.hidden=false;document.dispatchEvent(new Event('reset:workbench'));
    if(answers.some(answer=>answer.trim())||identityLine())document.dispatchEvent(new CustomEvent('reset:snapshot-import',{detail:{answers:[...answers],identity:identityLine()}}));
    window.scrollTo(0,0);
  }
  root.addEventListener('click',event=>{
    clearTimeout(floatTimer);
    const target=event.target.closest('[data-g]');if(!target)return;if(target.dataset.g==='line'){track('share_intent');return;}event.preventDefault();
    switch(target.dataset.g){
      case 'home':show('home');break;
      case 'start':track('snapshot_start');show(done?'result':'quick');break;
      case 'back':step=Math.max(0,step-1);saveDraft();show('quick');break;
      case 'next':case 'skip':if(step<2){step++;saveDraft();show('quick');}else{done=true;saveDraft();track('snapshot_complete');show('result');floatTimer=setTimeout(showFloat,2000);}break;
      case 'tag':{const tag=tags[Number(target.dataset.index)];if(selectedTags.includes(tag))selectedTags=selectedTags.filter(t=>t!==tag);else if(selectedTags.length<2)selectedTags.push(tag);else{status('最多選兩個；想換的話，先點掉一個。');break;}target.setAttribute('aria-pressed',String(selectedTags.includes(tag)));savedNote(saveDraft());syncFilled();break;}
      case 'phrase':{const box=document.getElementById('g-answer');answers[step]=togglePhrase(answers[step],phrases[step][Number(target.dataset.index)]);box.value=answers[step];savedNote(saveDraft());syncFilled();break;}
      case 'fill':step=Number(target.dataset.index)||0;saveDraft();show('quick');break;
      case 'edit':step=0;show('quick');break;
      case 'when':{const value=target.dataset.value;customWhen=value==='custom';if(!customWhen)scheduledAt=value;saveDraft();syncWhen();if(customWhen)document.getElementById('g-when').focus();else status('已選 '+whenText()+'。按「加入行事曆」留下提醒。');break;}
      case 'share':returnScreen=screen==='result'?'result':'home';track('share_intent');mode='question';personal='';personalConfirmed=false;show('share');break;
      case 'return':personal='';imageFile=null;show(returnScreen);break;
      case 'workbench':case 'bring':case 'float-go':workbench();break;
      case 'float-close':hideFloat();break;
      case 'native':nativeShare();break;
      case 'download':if(validCard()){track('share_intent');if(imageFile){const ok=download(imageFile.name,imageFile);if(ok)track('image_download');status(ok?'已啟動下載；瀏覽器無法確認是否存入相簿。若沒有收到，可長按下方圖片。':'下載未完成，可長按圖片儲存。');localUI.imagePreview(document.getElementById('g-card'));}else status('圖片正在準備，請稍後再按一次。');}break;
      case 'image-preview':if(validCard())localUI.imagePreview(document.getElementById('g-card'));break;
      case 'confirm-personal':if(!personal.trim()){status('先寫下願意分享的文字。');break;}personalConfirmed=true;drawCard();status('已確認預覽；可存圖或用系統分享。');target.textContent='已確認，可分享';break;
      case 'copy-invite':case 'threads':track('share_intent');copy(invitationText(),'text_copy');break;
      case 'copy-answers':copy(questions.map((q,i)=>`${q[0]}${i===0&&selectedTags.length?'（'+selectedTags.join('、')+'）':''}\n${answers[i].trim()||'（先留白）'}`).join('\n\n')+`\n\n身份句：${identityLine()||'（先留白）'}\n預計何時做：${whenText()||'（先留白）'}`,'text_copy');break;
      case 'copy-text':if(validCard()){track('share_intent');copy(caption(),'text_copy');}break;
      case 'copy-link':track('share_intent');copy(shareURL(),'link_copy');break;
      case 'action-calendar':if(!scheduledAt){status('先選一個時間。');root.querySelector('[data-g="when"]')?.focus();break;}try{const [date,time]=scheduledAt.split('T');const ics=window.ResetCalendar.calendar([{date,time,title:answers[2].trim(),description:'這週留給自己的一步。'}]);if(download('我的小行動.ics',new Blob([ics],{type:'text/calendar;charset=utf-8'})))status('已下載提醒檔，點開它就會加入行事曆。沒看到下載的話，可以到「備份與清除」複製回答，手動加進日曆。');else localUI.manual(reminderText(),'提醒下載未完成，可複製後手動加入日曆');}catch{status('這個時間無法使用，請重新選一個。');}break;
      case 'draft-export':{const json=JSON.stringify({format:DRAFT,answers,tags:selectedTags,identity,scheduledAt,step,done},null,2);if(!download('私人人生快照.json',new Blob([json],{type:'application/json'})))localUI.manual(json,'備份下載未完成，請複製保存');break;}
      case 'draft-clear':if(confirm('清除這張私人快照？完整版的內容不受影響。')){answers=['','',''];identity='';scheduledAt='';selectedTags=[];step=0;done=false;customWhen=false;try{localStorage.removeItem(DRAFT);}catch{}show('home');}break;
      case 'metrics-export':download('本機操作統計.json',new Blob([JSON.stringify(analytics.report(),null,2)],{type:'application/json'}));break;
      case 'metrics-clear':analytics.clear();render();break;
    }
  });
  root.addEventListener('input',event=>{
    clearTimeout(floatTimer);
    if(event.target.id==='g-answer'){answers[step]=event.target.value;savedNote(saveDraft());syncFilled();}
    if(event.target.id==='g-identity'){identity=event.target.value;saveDraft();const sign=document.getElementById('g-sign');sign.textContent=identityLine();sign.hidden=!identityLine();root.querySelectorAll('[data-carried]').forEach(count=>count.textContent=carried());}
    if(event.target.id==='g-when'){scheduledAt=/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(event.target.value)?event.target.value:'';saveDraft();syncWhen();}
    if(event.target.id==='g-personal'){personal=event.target.value;personalConfirmed=false;drawCard();root.querySelector('[data-g="confirm-personal"]').textContent='我確認預覽，產生這張卡';status('預覽已更新，請再次確認分享內容。');}
    if(event.target.id==='g-invite'){invitation=event.target.value;root.querySelectorAll('[data-g="line"]').forEach(a=>a.href=lineURL());}
  });
  root.addEventListener('change',event=>{
    if(event.target.name==='cardMode'){mode=event.target.value;personalConfirmed=false;if(mode==='personal')personal=returnScreen==='result'?snapshotLine():'';render();}
    if(event.target.id==='g-tone'){toneIndex=Number(event.target.value);invitation=tones[toneIndex];document.getElementById('g-invite').value=invitation;root.querySelectorAll('[data-g="line"]').forEach(a=>a.href=lineURL());}
    if(event.target.id==='g-platform')platform=event.target.value;
    if(event.target.id==='g-format'){format=event.target.value;render();}
  });
  root.addEventListener('toggle',event=>{if(event.target.id==='g-more')moreOpen=event.target.open;},true);
  const entry=document.createElement('button');entry.className='g-workbench-home';entry.textContent='← 回到 90 秒快照';entry.addEventListener('click',()=>show('home'));document.querySelector('.main-inner').prepend(entry);
  // Every entry shows the promise and explicit start; workbench data stays intact.
  show('home');
  if(location.hash==='#review'){workbench();document.dispatchEvent(new Event('reset:review'));}
})();
