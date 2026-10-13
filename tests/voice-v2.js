async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const click=action=>page.locator(`#growth [data-g="${action}"]`).first().click();
  // 假的語音辨識只在 localStorage 旗標存在時生效；其他套件開頭會清 localStorage，不受影響。
  await page.addInitScript(()=>{
    let flag=null;try{flag=localStorage.getItem('voice-test-mock');}catch{}
    if(flag==='none'){delete window.SpeechRecognition;delete window.webkitSpeechRecognition;try{Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,value:undefined});Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:undefined});}catch{}}
    if(flag==='fake'){
      class Fake{constructor(){window.__sr=this;window.__srCount=(window.__srCount||0)+1;}start(){this.started=true;}stop(){this.ended=true;this.onend&&this.onend();}abort(){this.ended=true;this.onend&&this.onend();}}
      Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:Fake});
    }
  });
  const emit=(text,final,index=0)=>page.evaluate(([text,final,index])=>{const results=[];results[index]=Object.assign([{transcript:text}],{isFinal:final});window.__sr.onresult({resultIndex:index,results});},[text,final,index]);
  const boot=async flag=>{await page.goto('http://127.0.0.1:4173/');await page.evaluate(flag=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('voice-test-mock',flag);},flag);await page.reload();};

  await boot('none');await click('start');
  check(await page.locator('.voice-btn').count()===0,'No microphone button without speech recognition support');

  await boot('fake');await click('start');
  const btn=page.locator('#g-answer + .voice-row .voice-btn'),status=page.locator('#g-answer + .voice-row .voice-status');
  check(await btn.count()===1&&(await btn.textContent()).includes('用說的'),'Snapshot answer has one microphone button');
  await page.locator('#g-answer').fill('VOICE_BASE');
  await btn.click();
  check((await status.textContent()).includes('瀏覽器供應商')&&!(await page.evaluate(()=>window.__srCount)),'First use shows provider notice before listening');
  await btn.click();
  check(await page.evaluate(()=>window.__sr.started&&window.__sr.lang==='zh-TW')&&await btn.getAttribute('aria-pressed')==='true','Second click starts zh-TW recognition');
  await emit('今天',false);
  check(await page.locator('#g-answer').inputValue()==='VOICE_BASE今天','Interim words append to existing text');
  await emit('今天很累',true);await emit('想休息',true,1);
  check(await page.locator('#g-answer').inputValue()==='VOICE_BASE今天很累想休息','Final phrases accumulate without duplication');
  check(await page.evaluate(()=>localStorage.getItem('one-day-reset-snapshot-v1').includes('VOICE_BASE今天很累想休息')),'Spoken text is saved to the local snapshot draft');
  await emit('長'.repeat(600),true,2);
  check((await page.locator('#g-answer').inputValue()).length===500,'Spoken text respects the field maxlength');
  await btn.click();
  check(await btn.getAttribute('aria-pressed')==='false'&&(await btn.textContent()).includes('用說的')&&(await status.textContent()).includes('已填入'),'Clicking again stops and restores the button');
  check(await page.evaluate(()=>JSON.stringify(ResetAnalytics.report()).includes('VOICE_BASE')===false&&!JSON.stringify(ResetAnalytics.report()).includes('voice')),'Voice input adds nothing to analytics');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Microphone row causes no horizontal overflow');

  await btn.click();
  check(await page.evaluate(()=>window.__srCount===2),'Notice is asked only once');
  await page.evaluate(()=>{window.__sr.onerror({error:'not-allowed'});window.__sr.onend();});
  check((await status.textContent()).includes('麥克風沒有開啟權限')&&await btn.getAttribute('aria-pressed')==='false','Denied microphone shows a recovery hint');

  // 快照有內容時會自動帶入完整版第 1 題；這裡要測空白題目的語音輸入。
  await page.evaluate(()=>localStorage.removeItem('one-day-reset-snapshot-v1'));
  await page.reload();await click('workbench');await page.locator('#app [data-view="morning"]').first().click();
  const wb=page.locator('#focusedAnswer + .voice-row .voice-btn');
  check(await wb.count()===1,'Workbench answer has a microphone button after re-render');
  await wb.click();
  check(await page.evaluate(()=>window.__sr&&window.__sr.started===true),'Remembered notice lets workbench start in one click');
  const id=await page.locator('#focusedAnswer').getAttribute('data-answer');
  await emit('WORKBENCH_VOICE',true);
  check(await page.evaluate(id=>JSON.parse(localStorage.getItem('one-day-reset-tw-v1')).morning[id]==='WORKBENCH_VOICE',id),'Workbench speech is saved in the frozen workbench state');
  await page.locator('#app [data-step="1"]').first().click();
  check(await page.locator('#focusedAnswer + .voice-row .voice-btn').count()===1&&await page.locator('.voice-btn.is-listening').count()===0&&await page.evaluate(()=>window.__sr.ended===true),'Moving to the next question stops listening and re-attaches an idle button');

  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
  await page.evaluate(report=>{window.voiceV2Report=report;},{passed:checks.length,checks});
}
