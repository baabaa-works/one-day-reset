(() => {
  'use strict';
  const app=document.getElementById('app'),work=window.ResetWorkbench,ui=window.ResetLocalUI,cal=window.ResetCalendar;
  const KEY='one-day-reset-workbench-options-v1',CARD='one-day-reset-game-card-v1';
  const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let options;try{options=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  options=options&&typeof options==='object'?options:{};
  options.prompts=options.prompts&&typeof options.prompts==='object'?options.prompts:{};
  options.skipped=options.skipped&&typeof options.skipped==='object'?options.skipped:{};
  const btn=(action,text)=>`<button type="button" class="btn btn-outline" data-w="${action}">${text}</button>`;
  const feedback=text=>{const e=document.getElementById('w-status');if(e)e.textContent=text;};
  function saveOptions(){try{localStorage.setItem(KEY,JSON.stringify(options));return true;}catch{return false;}}
  const nodes=()=>work.checkpoints();
  const prompt=q=>typeof options.prompts[q.id]==='string'?options.prompts[q.id]:q.question;
  function fields() {
    const s=work.read();return [
      ['我想避開的日常',s.evening.e18||''],['我想靠近的生活',s.evening.e19||''],['一年後想看到的變化',s.evening.e20||''],['四週內的一個成果',s.evening.e21||''],['每天留出的小步驟',s.quests.filter(q=>q.text.trim()).map(q=>q.time+' '+q.text).join('\n')],['我想守住的底線',s.constraints||'']
    ];
  }
  const summaryText=()=>fields().map(([label,value])=>`${label}\n${value||'（先留白）'}`).join('\n\n');
  const dateAfter=days=>{const d=new Date();d.setDate(d.getDate()+days);return cal.dateString(d);};
  const reviewQuestions=['這段時間，哪件小事真的發生了？','現在的日常，有哪個地方和上次不同？','接下來，我想繼續或調整哪一步？'];
  const entryURL=()=>{const url=new URL('.',location.href);url.hash='snapshot';return url.href;};
  const invitationURL=()=>{const url=new URL(entryURL());url.searchParams.set('utm_source','share');url.searchParams.set('utm_medium','friend');url.searchParams.set('utm_campaign','snapshot');return url.href;};
  const reviewURL=()=>{const url=new URL('.',location.href);url.hash='review';return url.href;};
  function calendarEvents(){const s=work.read();return nodes().filter(q=>!options.skipped[q.id]).map(q=>({date:s.date,time:s.times[q.id]||q.time,title:prompt(q),description:prompt(q)+'\n可以停下或略過。回到本機工作台記下觀察；提醒不含你的筆記。'}));}
  function backups(events,heading='行事曆備援') {
    const old=document.getElementById('w-calendar-backup');old?.remove();
    const section=document.createElement('section');section.id='w-calendar-backup';section.className='expand-box';
    section.innerHTML=`<h2>${escape(heading)}</h2><p>若下載沒有出現，可複製全部提問，或逐筆加入行事曆。加入 Google 行事曆會把這裡的提問送到 Google，不帶入私人筆記。</p>${btn('copy-prompts','複製全部提問')}<div>${events.map(e=>`<p>${escape(e.date)} ${escape(e.time)}<br>${escape(e.title)}<br><a class="btn btn-outline" target="_blank" rel="noopener noreferrer" href="${escape(cal.google(e))}">加入行事曆</a></p>`).join('')}</div>`;
    document.getElementById('content').append(section);
  }
  function exportCalendar(events,name) {
    try{const ics=cal.calendar(events);const ok=ui.download(name,new Blob([ics],{type:'text/calendar;charset=utf-8'}));backups(events,ok?'提醒已準備好，也可以用下方備援':'提醒下載未完成，請使用下方備援');feedback(ok?'已啟動 .ics 下載，請自行匯入日曆。':'下載未完成，可以複製提問或逐筆加入行事曆。');}
    catch{feedback('請檢查練習日期與各提醒時間；日期或時間無效時不會匯出。');}
  }
  function dayPage(index) {
    const cards=[...app.querySelectorAll('.time-card')];index=Math.min(cards.length-1,Math.max(0,index));options.dayIndex=index;saveOptions();
    cards.forEach((card,i)=>card.classList.toggle('w-day-active',i===index));
    const progress=document.getElementById('w-day-progress');if(progress)progress.textContent=`第 ${index+1} / 6 個停頓`;
    document.querySelector('[data-w="day-back"]')?.toggleAttribute('disabled',index===0);
    const next=document.querySelector('[data-w="day-next"]');if(next)next.textContent=index===5?'這段先整理到這裡':'下一個停頓';
  }
  function mount() {
    const s=work.read(),content=document.getElementById('content');
    if(['morning','day','evening'].includes(s.view)){options.lastView=s.view;saveOptions();}
    if(s.view==='overview') {
      const resume=document.createElement('div');resume.className='report-tools';resume.innerHTML=btn('resume','從上次的地方繼續');content.prepend(resume);
    }
    if(['morning','evening'].includes(s.view)) {
      const note=document.createElement('p');note.className='w-stop-note';note.textContent='可以隨時停下來或跳過。這份筆記只需要照顧你的步調。';content.querySelector('.question-card')?.prepend(note);
      content.querySelector('.question-footer')?.insertAdjacentHTML('beforeend',btn('pause','今天先停在這裡'));
    }
    if(s.view==='day') {
      for(const q of nodes()) {
        const card=document.getElementById('card-'+q.id),description=card.querySelector('p');
        description.innerHTML=`<label for="w-prompt-${q.id}">提問（可編輯，不用填個人回答）</label><textarea id="w-prompt-${q.id}" data-w-prompt="${q.id}" maxlength="300">${escape(prompt(q))}</textarea><label class="checkbox-line"><input type="checkbox" data-w-skip="${q.id}" ${options.skipped[q.id]?'checked':''}>略過這個提醒，不加入行事曆</label>`;
      }
      const pager=document.createElement('div');pager.className='w-day-pager';pager.innerHTML=`<p id="w-day-progress"></p>${btn('day-back','上一個停頓')}${btn('day-next','下一個停頓')}`;content.querySelector('.time-grid').after(pager);dayPage(Number.isInteger(options.dayIndex)?options.dayIndex:0);
    }
    if(s.view==='plan') {
      const panel=document.createElement('section');panel.className='expand-box';panel.id='w-six-tools';
      panel.innerHTML=`<h2>這次先整理到這裡</h2><p>有留下的話就值得回頭看。六格卡只用你的原話，留白也可以；預設只在本機。</p><div class="report-tools">${btn('six-save','儲存六格卡到本機')}${btn('six-copy','複製六格卡')}${btn('six-download','下載六格卡')}${btn('six-print','列印六格卡')}${btn('blank-card','分享空白範本卡')}</div><p class="g-note">空白範本不含任何個人內容；圖上有快照入口網址。</p><h3>過一陣子回來看看</h3><p>${reviewQuestions.map(escape).join('<br>')}</p><div class="report-tools">${btn('return-reminders','7 天與 30 天後的行事曆提醒')}${btn('review','寫一份簡短回顧')}</div>`;content.append(panel);
    }
    const footer=document.createElement('footer');footer.className='footer-msg';footer.innerHTML=`<p id="w-status" role="status"></p><p>靈感來自 <a href="https://letters.thedankoe.com/p/how-to-fix-your-entire-life-in-1" target="_blank" rel="noopener noreferrer">Dan Koe</a>，非官方、非授權的獨立工具。沒有 AI 替你回答。</p>${!ui.storageAvailable()?'<p>此瀏覽器無法儲存，筆記只暫留在這一頁；離開前請複製或下載備份。</p>':''}${window.resetSafetyNote()}`;content.append(footer);
    if(!ui.storageAvailable())document.getElementById('saveStatus').textContent='此瀏覽器無法儲存，筆記暫留在這一頁';
  }
  function pause(next='') {
    const content=document.getElementById('content');content.innerHTML=`<section class="question-card"><h1 tabindex="-1">先把今天的筆記，<br>留在這裡。</h1><p>這個階段已走過一遍。未寫的地方可以先留白，之後回來再看。</p><div class="report-tools">${next?`<button type="button" class="btn btn-dark" data-w="continue" data-next="${next}">繼續下一段</button>`:''}${btn('tomorrow','明天早上再繼續')}${btn('resume','回到上次的地方')}${btn('six-copy','複製目前六格摘要')}</div><p id="w-status" role="status"></p>${window.resetSafetyNote()}</section>`;window.scrollTo(0,0);content.querySelector('h1').focus();
  }
  function blankCard() {
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;canvas.setAttribute('aria-label','空白六格人生遊戲範本。不含個人回答。baabaa-works.github.io/one-day-reset/?s=f#snapshot');
    const c=canvas.getContext('2d');c.fillStyle='#263b2c';c.fillRect(0,0,1080,1350);c.fillStyle='#f5f8ef';c.font='700 56px "Microsoft JhengHei",sans-serif';c.fillText('替日常，留一點新方向',70,110);
    const labels=['想避開的日常','想靠近的生活','一年後的變化','四週的一個成果','每天的小步驟','想守住的底線'];
    labels.forEach((label,i)=>{const x=70+(i%2)*485,y=200+Math.floor(i/2)*300;c.fillStyle='#fffefa';c.fillRect(x,y,445,260);c.fillStyle='#263b2c';c.font='32px "Microsoft JhengHei",sans-serif';c.fillText(label,x+24,y+55);c.strokeStyle='#becdb4';c.beginPath();c.moveTo(x+24,y+190);c.lineTo(x+420,y+190);c.stroke();});
    c.fillStyle='#f5f8ef';c.font='32px sans-serif';c.fillText('One Day Reset · 90 秒快照',70,1190);c.font='26px sans-serif';c.fillText('baabaa-works.github.io/one-day-reset/?s=f#snapshot',70,1250);ui.imagePreview(canvas);
    const tools=document.createElement('div');tools.innerHTML=btn('blank-download','存成空白範本圖片')+btn('blank-link','複製快照邀請連結');document.querySelector('.reset-fallback-content').append(tools);
    tools.querySelector('[data-w="blank-download"]').onclick=()=>canvas.toBlob(blob=>{if(blob)ui.download('空白人生遊戲範本.png',blob);},'image/png');
    tools.querySelector('[data-w="blank-link"]').onclick=()=>ui.copy('先做三個問題，替日常留一個小起點。\n'+invitationURL());
  }
  function review() {
    const content=document.getElementById('content');content.innerHTML=`<section class="question-card"><h1>回來看看，那個小起點</h1><p>沒有對錯，可略過。回顧只存在這台瀏覽器。</p>${reviewQuestions.map((q,i)=>`<label for="w-review-${i}">${escape(q)}</label><textarea id="w-review-${i}" data-w-review="${i}">${escape(options.review?.[i]||'')}</textarea>`).join('')}<div class="report-tools">${btn('plan','回到六格卡')}</div><p id="w-status" role="status"></p>${window.resetSafetyNote()}</section>`;window.scrollTo(0,0);
  }
  document.addEventListener('reset:workbench-render',mount);
  document.addEventListener('reset:phase-end',e=>pause(e.detail.next));
  document.addEventListener('reset:review',review);
  document.addEventListener('reset:workbench-cleared',()=>{options={prompts:{},skipped:{}};try{localStorage.removeItem(KEY);localStorage.removeItem(CARD);}catch{document.dispatchEvent(new Event('reset:storage-unavailable'));}});
  document.addEventListener('reset:snapshot-import',e=>{
    const data=e.detail,current=work.read(),mapping=[['m1','現況',data.answers[0]],['m13','願景',data.answers[1]],['m15','本週行動',data.answers[2]],['m14','身份句',data.identity]];
    const dialog=document.createElement('dialog');dialog.id='w-import';dialog.setAttribute('aria-label','快照帶入預覽');
    dialog.innerHTML=`<h2>確認後，只填工作台的空欄</h2><p>已有文字的欄位會保留，不會覆蓋。</p>${mapping.map(([key,label,value])=>`<h3>${escape(label)}</h3><p>${current.morning[key]?.trim()?'已有內容，保留原文':value?escape(value):'快照留白，不帶入'}</p>`).join('')}<button type="button" class="btn btn-dark" data-confirm>確認帶入空欄</button><button type="button" class="btn btn-outline" data-cancel>取消</button>`;
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.querySelector('[data-confirm]').onclick=()=>{const added=work.bring(data);feedback(added.length?`已帶入 ${added.length} 個空欄；原有回答保留。`:'沒有需要帶入的空欄，原有回答保留。');dialog.close();};dialog.addEventListener('close',()=>dialog.remove());
  });
  document.addEventListener('click',e=>{
    if(e.target.closest('#app [data-action="calendar"]')){e.preventDefault();e.stopImmediatePropagation();exportCalendar(calendarEvents(),'六個提問提醒.ics');return;}
    const target=e.target.closest('[data-w]');if(!target)return;
    // Blank card's own handlers retain a closure over a public-only canvas.
    if(target.dataset.w.startsWith('blank-')&&target.dataset.w!=='blank-card')return;
    e.preventDefault();e.stopImmediatePropagation();
    switch(target.dataset.w) {
      case 'resume':work.move(options.lastView||'morning');break;
      case 'plan':work.move('plan');break;
      case 'continue':work.move(target.dataset.next);break;
      case 'pause':pause();break;
      case 'day-back':dayPage(options.dayIndex-1);break;
      case 'day-next':if(options.dayIndex===5)pause('evening');else dayPage(options.dayIndex+1);break;
      case 'tomorrow':exportCalendar([{date:dateAfter(1),time:'08:17',title:'回來看看，昨天留給自己的筆記',description:'按自己的步調繼續，可以停下或跳過。\n'+entryURL()}],'明天繼續.ics');break;
      case 'copy-prompts':ui.copy(calendarEvents().map(e=>`${e.date} ${e.time}\n${e.title}`).join('\n\n'));break;
      case 'six-copy':ui.copy(summaryText());break;
      case 'six-save':try{localStorage.setItem(CARD,JSON.stringify({date:work.read().date,fields:fields()}));feedback('六格卡已儲存在此瀏覽器。');}catch{feedback('此瀏覽器無法儲存，請複製六格卡。');ui.manual(summaryText());}break;
      case 'six-download':if(!ui.download('我的六格人生遊戲卡.txt',new Blob([summaryText()],{type:'text/plain;charset=utf-8'})))ui.manual(summaryText(),'下載未完成，請複製六格卡');break;
      case 'six-print':document.getElementById('printSheet').innerHTML=`<h1>我的六格人生遊戲卡</h1><p class="print-meta">${escape(work.read().date)} · 只給自己看</p><div class="w-print-grid">${fields().map(([title,value])=>`<section class="print-item"><h2>${escape(title)}</h2><p>${escape(value)||'（先留白）'}</p></section>`).join('')}</div>`;window.print();break;
      case 'blank-card':blankCard();break;
      case 'return-reminders':exportCalendar([7,30].map(days=>({date:dateAfter(days),time:'19:37',title:`${days} 天後，回來看看自己的小起點`,description:reviewQuestions.join('\n')+'\n'+reviewURL()})),'7天與30天回顧.ics');break;
      case 'review':review();break;
    }
  },true);
  document.addEventListener('input',e=>{
    const t=e.target;
    if(t.dataset.wPrompt){options.prompts[t.dataset.wPrompt]=t.value;saveOptions();}
    if(t.dataset.wReview!==undefined){if(!Array.isArray(options.review))options.review=['','',''];options.review[Number(t.dataset.wReview)]=t.value;feedback(saveOptions()?'回顧已儲存在此瀏覽器。':'回顧暫留在記憶體，離開前請複製。');}
  });
  document.addEventListener('change',e=>{if(e.target.dataset.wSkip){options.skipped[e.target.dataset.wSkip]=e.target.checked;saveOptions();}});
  mount();
})();
