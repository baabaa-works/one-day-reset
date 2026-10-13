(() => {
  'use strict';
  const root = document.getElementById('growth');
  const app = document.getElementById('app');
  const DRAFT = 'one-day-reset-snapshot-v1';
  const analytics = window.ResetAnalytics;
  const questions = [
    ['看見現況', '有什麼不滿，你已經把它當成生活的正常部分？', '挑一件最近常出現的小事就好。先看見它，不急著責怪自己。', '例如：下班後明明很累，還是一直滑手機。'],
    ['靠近想要的生活', '如果能改變一件事，你希望日常多出什麼？', '想像一個普通的平日。哪個時刻，會讓你覺得這是自己想過的生活？', '例如：晚上留半小時，做一件只是因為喜歡的事。'],
    ['留下一個起點', '這一週，你願意先做哪個小行動？', '寫下「什麼時候、做什麼」。小到可以開始，就有價值。', '例如：週三晚餐後，散步十分鐘，不帶耳機。']
  ];
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const saved = read(DRAFT);
  let answers = questions.map((_, i) => typeof saved?.answers?.[i] === 'string' ? saved.answers[i].slice(0, 500) : '');
  let step = 0, screen = 'home', returnScreen = 'home';
  let mode = 'question', personal = '', platform = 'threads', format = 'feed', imageFile = null, imageVersion = 0;
  function track(event) {
    const names={snapshot_start:'snapshot_started',snapshot_complete:'snapshot_completed',share_intent:'share_intent',native_share_resolved:'native_share_resolved',native_share_cancel:'native_share_cancelled',native_share_error:'native_share_failed',image_download:'image_download_started',text_copy:'text_copied',link_copy:'link_copied',workbench_enter:'workbench_entered'};
    if(names[event])analytics.track(names[event],{entry:screen,card_type:mode,format,channel:platform});
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT, JSON.stringify({answers})); return true; } catch { return false; }
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
    const medium = new URLSearchParams(location.search).get('utm_medium');
    const invited = medium === 'share' || medium === 'friend';
    return `<div class="g-hero"><div>${invited?'<p class="g-invitation">朋友邀請你做一個 90 秒的小練習</p>':''}<h1 tabindex="-1">最近很努力，<br>卻不知道<br>在往哪裡走？</h1><div class="g-actions">${button('start','開始 90 秒快照','g-primary')}</div><p class="g-note">免登入、答案只留在你的手機</p><p class="g-intro">三個問題，留下一個這週能做的小行動。<br>沒有 AI 替你回答，答案是你自己的。</p>${answers.some(Boolean)?'<p class="g-note">上次的回答還在，可以繼續或修改。約 90 秒起步，按自己的步調寫。</p>':''}</div><aside class="g-sample" aria-label="分享問題卡範例"><small>留一個問題給自己</small><blockquote>哪件小事，<br>你想在這一週<br>替自己留一點空間？</blockquote><div><p>先看見它，再決定下一步。</p><strong>One Day Reset</strong></div></aside></div><footer class="g-footer"><span>三個問題。一份只屬於你的筆記。</span>${button('share','分享給朋友','g-link')}${button('workbench','到完整工作台繼續','g-link')}</footer><p class="g-note">靈感來自 <a href="https://letters.thedankoe.com/p/how-to-fix-your-entire-life-in-1" target="_blank" rel="noopener noreferrer">Dan Koe</a>，非官方、非授權的獨立工具。</p>${window.resetPrivacySettings()}`;
  }
  function quick() {
    const q = questions[step];
    return `<div class="g-flow"><p>人生快照 · ${step + 1} / 3</p><div class="g-progress" aria-hidden="true">${questions.map((_,i)=>`<span class="${i<=step?'active':''}"></span>`).join('')}</div><h2 tabindex="-1">${q[1]}</h2><p>${q[2]}</p><div class="g-paper"><label for="g-answer">${q[0]}，用自己的話寫</label><textarea id="g-answer" maxlength="500" placeholder="${q[3]}">${escape(answers[step])}</textarea><p class="g-note">只給自己看 · 最多 500 字 · 可回上一題修改</p><p id="g-status" class="g-warning" role="status"></p></div><div class="g-actions">${button(step?'back':'home',step?'上一題':'先回首頁')}${button('next',step===2?'整理我的快照':'下一題','g-primary')}</div><p class="g-note">可以先離開，回答會保留在此瀏覽器。這不是倒數計時，也沒有標準答案。</p></div>`;
  }
  function result() {
    return `<div class="g-flow"><p>你的 90 秒人生快照</p><h1 tabindex="-1">把下一步，<br>留給這週的自己。</h1><p>你已寫下現況、想靠近的生活與一個行動。回頭讀一次：這個行動，真的能讓你靠近第二題嗎？</p><div class="g-paper"><dl class="g-summary">${questions.map((q,i)=>`<dt>${q[0]}</dt><dd>${escape(answers[i])}</dd>`).join('')}</dl></div><div class="g-actions">${button('share','製作分享卡','g-primary')}${button('workbench','進入完整工作台')}${button('edit','修改快照','g-link')}</div><p class="g-note">分享是選擇，快照可以只留給自己。完整工作台有 28 個節點，你的舊紀錄會保留；快照不覆蓋原本答案。</p><div class="g-actions">${button('draft-export','下載私人快照')}${button('draft-clear','清除私人快照')}</div><p id="g-status" role="status"></p></div>`;
  }
  const cardText = () => mode === 'personal' ? personal : '有什麼不滿，你已經把它當成生活的正常部分？';
  function shareURL() {
    return analytics.buildLink({source:platform,campaign:'snapshot',content:mode==='personal'?'personal_card':'question_card'});
  }
  const caption = () => `${mode==='personal'?'這週，給自己的小承諾：':'留一個問題給最近有點迷路的自己：'}\n${cardText()}\n\n用三個問題，寫下現況與下一步。One Day Reset，90 秒人生快照。\n${shareURL()}`;
  function share() {
    return `<h1 tabindex="-1">留一個問題，給也在找方向的人。</h1><p>通用卡不含你的回答。個人卡只呈現你在這裡另外寫的文字。</p><div class="g-share"><div><canvas id="g-card" role="img" aria-label="分享卡預覽"></canvas><p class="g-note">預覽就是將分享的圖片。${format==='story'?'1080 × 1920，適合限時動態':'1080 × 1350，適合 Threads 與 IG 貼文'}</p></div><div><fieldset><legend>卡片內容</legend><label><input type="radio" name="cardMode" value="question" ${mode==='question'?'checked':''}>通用問題卡</label><label><input type="radio" name="cardMode" value="personal" ${mode==='personal'?'checked':''}>個人小承諾（自行輸入）</label></fieldset><div ${mode==='personal'?'':'hidden'}><label for="g-personal">願意讓別人看見的那一句</label><textarea id="g-personal" maxlength="100" placeholder="例如：這週，我想把一個晚上留給自己。">${escape(personal)}</textarea><p class="g-note">最多 100 字。分享前請確認文字；不會自動帶入快照，也不儲存此欄。</p></div><label for="g-platform">準備分享到</label><select id="g-platform"><option value="threads" ${platform==='threads'?'selected':''}>Threads</option><option value="instagram" ${platform==='instagram'?'selected':''}>Instagram</option></select><label for="g-format">圖片版型</label><select id="g-format"><option value="feed" ${format==='feed'?'selected':''}>貼文 · 4:5</option><option value="story" ${format==='story'?'selected':''}>限時動態 · 9:16</option></select><div class="g-actions">${button('native','開啟手機分享','g-primary')}${button('download','下載圖片')}${button('copy-text','複製貼文文字')}${button('copy-link','複製體驗網址')}</div><p class="g-note">IG：下載圖片後發貼文／限動，把體驗網址放在限動連結貼紙或個人檔案。手機分享選單的可用 App 由裝置決定。</p><p class="g-status" id="g-status" role="status"></p><div id="g-manual" hidden><label for="g-copy">瀏覽器無法自動複製，請長按選取文字</label><textarea class="g-copy" id="g-copy" readonly></textarea></div><div class="g-actions">${button('return','回到'+(returnScreen==='result'?'我的快照':'首頁'),'g-link')}</div></div></div>`;
  }
  function render() {
    root.innerHTML = `<div class="growth-shell">${nav()}${screen==='home'?home():screen==='quick'?quick():screen==='result'?result():share()}</div>`;
    if (screen === 'share') drawCard();
  }
  function lines(ctx, text, maxWidth) {
    const output = []; let line = '';
    for (const char of Array.from(text)) {
      if (char==='\n') {output.push(line);line='';continue;}
      if (ctx.measureText(line+char).width>maxWidth && line) {output.push(line);line='';}
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
    c.fillText(mode==='personal'?'這週，給自己的小承諾':'留一個問題給自己',86,200);
    let size=mode==='question'?68:58, text=cardText() || '在右邊寫下，願意分享的那一句。';
    let rows;
    do {c.font=`700 ${size}px "Microsoft JhengHei",sans-serif`;rows=lines(c,text,880);if(rows.length*size*1.65< h-590)break;size-=2;} while(size>32);
    const start=(h-240-rows.length*size*1.65)/2+size;
    rows.forEach((row,i)=>c.fillText(row,86,start+i*size*1.65));
    c.fillStyle='#e3fa9c';c.fillRect(86,h-320,90,5);
    c.fillStyle='#f5f8ef';c.font='30px "Microsoft JhengHei",sans-serif';c.fillText('三個問題，給自己一個重新開始的地方。',86,h-260);
    c.font='700 42px sans-serif';c.fillText('One Day Reset',86,h-180);
    c.font='28px "Microsoft JhengHei",sans-serif';c.fillText('90 秒人生快照 · 免費體驗',86,h-120);
    canvas.setAttribute('aria-label',`分享卡預覽：${text}。One Day Reset，90 秒人生快照。`);
    canvas.toBlob(blob=>{if(blob && version===imageVersion){imageFile=new File([blob],'one-day-reset.png',{type:'image/png'});if(mode==='question'||personal.trim())analytics.track('card_generated',{card_type:mode,format,channel:platform,entry:'share'});}},'image/png');
  }
  const validCard = () => {if(mode==='personal'&&!personal.trim()){status('先寫下願意分享的一句話，或改用通用問題卡。');document.getElementById('g-personal').focus();return false;}return true;};
  function download(name, blob) {
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url;a.download=name;a.textContent='下載';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function copy(text, event) {
    try {if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);track(event);status('已複製。你可以貼到想分享的地方。');}
    catch {const manual=document.getElementById('g-manual');manual.hidden=false;const box=document.getElementById('g-copy');box.value=text;box.focus();box.select();status('請手動複製下方文字。');}
  }
  async function nativeShare() {
    if(!validCard())return;
    track('share_intent');
    if (!navigator.share) {status('此瀏覽器未提供分享選單，請下載圖片或複製文字與網址。');return;}
    const payload={title:'One Day Reset｜90 秒人生快照',text:caption()};
    if(imageFile && navigator.canShare?.({files:[imageFile]}))payload.files=[imageFile];
    try {await navigator.share(payload);track('native_share_resolved');status('已交給系統分享流程。是否發布，請在你選擇的 App 中確認。');}
    catch(error){track(error.name==='AbortError'?'native_share_cancel':'native_share_error');status(error.name==='AbortError'?'已取消分享，卡片仍在這裡。':'分享未完成，請改用下載圖片或複製文字與網址。');}
  }
  function workbench() {track('workbench_enter');if(screen==='quick'||screen==='result'||(screen==='share'&&returnScreen==='result'))analytics.track('snapshot_workbench_entered',{entry:screen});root.hidden=true;app.hidden=false;document.dispatchEvent(new Event('reset:workbench'));window.scrollTo(0,0);}
  root.addEventListener('click',event=>{
    const target=event.target.closest('[data-g]');if(!target)return;event.preventDefault();
    switch(target.dataset.g){
      case 'home':show('home');break;
      case 'start':track('snapshot_start');show('quick');break;
      case 'back':step=Math.max(0,step-1);show('quick');break;
      case 'next':if(!answers[step].trim()){status('寫下一句就好，讓這份快照對你有意義。');document.getElementById('g-answer').focus();break;}if(step<2){step++;show('quick');}else{track('snapshot_complete');show('result');}break;
      case 'edit':step=0;show('quick');break;
      case 'share':returnScreen=screen==='result'?'result':'home';track('share_intent');mode='question';personal='';show('share');break;
      case 'return':personal='';imageFile=null;show(returnScreen);break;
      case 'workbench':workbench();break;
      case 'native':nativeShare();break;
      case 'download':if(validCard()){track('share_intent');if(imageFile){download(imageFile.name,imageFile);track('image_download');status('已啟動圖片下載。若內建瀏覽器未儲存，請用系統瀏覽器開啟後再下載。');}else status('圖片正在準備，請稍後再按一次。');}break;
      case 'copy-text':if(validCard()){track('share_intent');copy(caption(),'text_copy');}break;
      case 'copy-link':track('share_intent');copy(shareURL(),'link_copy');break;
      case 'draft-export':download('私人人生快照.json',new Blob([JSON.stringify({format:DRAFT,answers},null,2)],{type:'application/json'}));break;
      case 'draft-clear':if(confirm('清除三題私人快照？完整工作台不受影響。')){answers=['','',''];step=0;try{localStorage.removeItem(DRAFT);}catch{}show('home');}break;
      case 'metrics-export':download('本機操作統計.json',new Blob([JSON.stringify(analytics.report(),null,2)],{type:'application/json'}));break;
      case 'metrics-clear':analytics.clear();render();break;
    }
  });
  root.addEventListener('input',event=>{
    if(event.target.id==='g-answer'){answers[step]=event.target.value;status(saveDraft()?'已儲存在此瀏覽器。':'此瀏覽器無法儲存；離開前請完成並下載私人快照。');}
    if(event.target.id==='g-personal'){personal=event.target.value;drawCard();status('預覽已更新，請確認分享內容。');}
  });
  root.addEventListener('change',event=>{
    if(event.target.name==='cardMode'){mode=event.target.value;render();}
    if(event.target.id==='g-platform')platform=event.target.value;
    if(event.target.id==='g-format'){format=event.target.value;render();}
  });
  const entry=document.createElement('button');entry.className='g-workbench-home';entry.textContent='90 秒快照與分享卡';entry.addEventListener('click',()=>show('home'));document.querySelector('.main-inner').prepend(entry);
  // Every entry shows the promise and explicit start; workbench data stays intact.
  show('home');
})();
