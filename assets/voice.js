(()=>{
  'use strict';
  // 語音輸入：用瀏覽器內建的語音辨識把說的話填進文字欄位。不支援的瀏覽器不顯示按鈕。
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return;
  const NOTICE_KEY='one-day-reset-voice-notice-v1';
  const NOTICE='語音輸入使用這個瀏覽器內建的語音辨識，聲音可能會送到瀏覽器供應商（例如 Google 或 Apple）轉成文字。本工具不會錄音，也不會上傳你說的內容。';
  const ERRORS={
    'not-allowed':'麥克風沒有開啟權限。請在瀏覽器設定允許麥克風，或改用鍵盤上的語音輸入。',
    'service-not-allowed':'這個瀏覽器不允許語音辨識，可改用鍵盤上的語音輸入。',
    'audio-capture':'找不到可用的麥克風。',
    'network':'語音辨識需要網路連線，目前無法使用。',
    'no-speech':'沒有聽到聲音，可以再按一次試試。',
    'aborted':''
  };
  const ICON='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const seen=new WeakSet();
  let active=null,noticed=false;
  try{noticed=localStorage.getItem(NOTICE_KEY)==='1';}catch{}
  const label=(btn,text)=>{btn.innerHTML=`${ICON}<span>${text}</span>`;};
  const write=(field,text)=>{
    const max=field.maxLength;
    field.value=max>0?text.slice(0,max):text;
    field.dispatchEvent(new Event('input',{bubbles:true}));
  };
  const stop=()=>{if(active){try{active.rec.stop();}catch{}}};
  const start=(field,btn,status)=>{
    const rec=new SR();
    const session={rec,btn,field,base:field.value,finals:'',error:null};
    rec.lang='zh-TW';rec.interimResults=true;
    // Android Chrome 在 continuous 模式會重複回傳累積結果，改成一次一句。
    rec.continuous=!/Android/i.test(navigator.userAgent);
    rec.onresult=e=>{
      if(!field.isConnected){try{rec.abort();}catch{}return;}
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const text=e.results[i][0].transcript;
        if(e.results[i].isFinal)session.finals+=text;else interim+=text;
      }
      write(field,session.base+session.finals+interim);
    };
    rec.onerror=e=>{session.error=e.error in ERRORS?ERRORS[e.error]:'這個瀏覽器目前無法使用語音輸入，可改用鍵盤上的語音輸入。';};
    rec.onend=()=>{
      if(active===session)active=null;
      btn.classList.remove('is-listening');btn.setAttribute('aria-pressed','false');label(btn,'用說的');
      if(field.isConnected&&session.finals)write(field,session.base+session.finals);
      status.textContent=session.error??(session.finals?'已填入，可以直接修改。':'');
    };
    try{rec.start();}catch{status.textContent='這個瀏覽器目前無法使用語音輸入，可改用鍵盤上的語音輸入。';return;}
    active=session;
    btn.classList.add('is-listening');btn.setAttribute('aria-pressed','true');label(btn,'停止');
    status.textContent='正在聽，說完再按一次停止。';
  };
  const attach=field=>{
    seen.add(field);
    const row=document.createElement('div');row.className='voice-row';
    const btn=document.createElement('button');btn.type='button';btn.className='voice-btn';btn.setAttribute('aria-pressed','false');label(btn,'用說的');
    const status=document.createElement('span');status.className='voice-status';status.setAttribute('role','status');
    row.append(btn,status);
    (field.closest('.quest-edit-row')||field).after(row);
    btn.addEventListener('click',()=>{
      if(active&&active.btn===btn){stop();return;}
      stop();
      if(!noticed){
        if(!btn.dataset.voiceAsk){btn.dataset.voiceAsk='1';label(btn,'我知道了，開始說話');status.textContent=NOTICE;return;}
        noticed=true;try{localStorage.setItem(NOTICE_KEY,'1');}catch{}
      }
      delete btn.dataset.voiceAsk;
      start(field,btn,status);
    });
  };
  const scan=()=>{
    // 欄位被重新渲染換掉時，立刻關掉麥克風。
    if(active&&!active.field.isConnected){try{active.rec.abort();}catch{}}
    document.querySelectorAll('textarea,input[type="text"]').forEach(field=>{
      if(seen.has(field)||field.readOnly||field.disabled||field.closest('dialog'))return;
      attach(field);
    });
  };
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>{if(active){try{active.rec.abort();}catch{}}});
  scan();
})();
