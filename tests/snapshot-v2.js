async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const base='http://127.0.0.1:4173/';
  const click=action=>page.locator(`#growth [data-g="${action}"]`).first().click();
  const text=selector=>page.locator(selector).textContent();
  await page.setViewportSize({width:360,height:800});
  for(let skip=0;skip<3;skip++) {
    await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();await click('start');
    for(let i=0;i<3;i++){if(i!==skip)await page.locator('#g-answer').fill('使用者原話 '+i);else check((await text('[data-g="next"]')).includes('先跳過'),`Skip ${skip+1}: empty answer turns next into skip`);await click('next');}
    check(await page.locator('.g-summary').isVisible(),`Question ${skip+1} can be skipped`);
    check((await text('.g-summary')).includes('（先留白）'),`Question ${skip+1} has honest blank fallback`);
  }
  await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();await click('start');
  check(await page.locator('#growth').evaluate(e=>!/可選|可略過|可跳過/.test(e.textContent)),'Question screen does not repeat that it is optional');
  await page.locator('[data-g="tag"][data-index="0"]').click();await page.locator('[data-g="tag"][data-index="1"]').click();await page.locator('[data-g="tag"][data-index="2"]').click();
  check(await page.locator('.g-tags [aria-pressed="true"]').count()===2,'Tags limited to two');
  check(await page.locator('#g-answer').inputValue()==='','Tags do not write the user answer');
  check((await text('[data-g="next"]'))==='下一題'&&await page.locator('.g-steps .filled').count()===1,'Tapping a tag is answered on screen at once');
  await page.locator('#g-answer').fill('SNAPSHOT_PRIVATE：工作訊息一直來');await click('next');
  check((await text('.g-echo')).includes('SNAPSHOT_PRIVATE')&&(await text('.g-echo')).includes('一直很忙'),'Next question carries the previous answer and tags forward');
  await page.locator('[data-g="phrase"][data-index="0"]').click();await page.locator('[data-g="phrase"][data-index="2"]').click();
  check(await page.locator('#g-answer').inputValue()==='睡到自然醒，慢慢吃早餐','Phrase chips write complete words with nothing to delete');
  await page.locator('[data-g="phrase"][data-index="0"]').click();
  check(await page.locator('#g-answer').inputValue()==='慢慢吃早餐'&&!(await page.locator('#growth').innerHTML()).includes('＿'),'Phrase chips toggle off and no blanks are inserted');
  await page.locator('#g-answer').fill('在安靜房間醒來，心情自在');await click('next');
  check(await page.locator('#g-identity').count()===0&&await page.locator('#g-when').count()===0&&await page.locator('#growth textarea').count()===1,'Third question asks for one thing only');
  await page.locator('#g-answer').fill('這週三晚飯後散步');
  await page.reload();await click('start');
  check(await page.locator('#g-answer').inputValue()==='這週三晚飯後散步','Step and words restored');
  await click('back');check(await page.locator('#g-answer').inputValue()==='在安靜房間醒來，心情自在','Back retains words');await click('next');await click('next');
  check((await text('.g-node-tags')).includes('一直很忙')&&(await text('.g-node-tags')).includes('很少休息'),'Chosen tags appear on the result card');
  check((await text('.g-node-step .g-words'))==='這週三晚飯後散步'&&!(await text('.g-card-live')).includes('這週我先'),'Action shown verbatim without a glued prefix');
  check(await page.locator('.g-node').count()===3&&await page.locator('#growth .g-primary').count()===1,'Result is one line of three nodes with a single primary action');
  check(await page.locator('.g-invite [data-g="bring"]').isVisible()&&(await text('.g-invite [data-carried]'))==='3','Finishing the snapshot shows an invitation to the full version with what carries over');
  await page.locator('#g-float:not([hidden])').waitFor({timeout:8000});
  check(await page.evaluate(()=>{const f=document.querySelector('#g-float').getBoundingClientRect(),p=document.querySelector('.g-result .g-primary').getBoundingClientRect(),c=document.querySelector('.g-card-live').getBoundingClientRect();return f.bottom<=c.top&&f.bottom<p.top&&f.left>=0&&f.right<=innerWidth;}),'After a pause a floating invitation appears without covering the card or the primary action');
  await click('float-close');check(await page.locator('#g-float').isHidden()&&await page.locator('.g-invite [data-g="bring"]').count()===1,'Floating invitation can be dismissed and the entrance stays on the page');
  for(const [typed,line]of [['晚上會關機休息','我是晚上會關機休息的人'],['會晚上關機休息','我是會晚上關機休息的人'],['我是會留時間給自己的人','我是會留時間給自己的人'],['留時間給自己','我是會留時間給自己的人']]){await page.locator('#g-identity').fill(typed);check((await text('#g-sign'))===line,'Identity never doubles a word: '+typed);}
  check((await text('.g-invite [data-carried]'))==='4','Adding the identity line updates the carry-over count at once');
  await click('action-calendar');check((await text('#g-status')).includes('先選一個時間'),'Calendar asks for a time instead of failing silently');
  await page.locator('[data-g="when"]').first().click();check(await page.locator('#g-when-badge').isVisible(),'Picking a time marks the card at once');
  await page.locator('[data-g="when"][data-value="custom"]').click();await page.locator('#g-when').fill('2026-10-15T18:37');
  await page.reload();await click('start');
  check(await page.locator('#g-identity').inputValue()==='留時間給自己'&&await page.locator('#g-when').inputValue()==='2026-10-15T18:37','Finished snapshot reopens on the card with identity and schedule');
  const wait=page.waitForEvent('download');await click('action-calendar');const download=await wait;await download.saveAs('test-results/snapshot-action.ics');
  check(download.suggestedFilename().endsWith('.ics'),'Action reminder is an explicit local ICS download');
  check(!(await page.evaluate(()=>JSON.stringify(ResetAnalytics.report()))).includes('SNAPSHOT_PRIVATE'),'Analytics excludes answers');
  check(!page.url().includes('SNAPSHOT_PRIVATE'),'URL excludes answers');
  for(const width of [360,390]){await page.setViewportSize({width,height:width===360?800:844});await page.screenshot({path:`test-results/after-c-${width}-result.png`});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: snapshot fits`);}
  await page.evaluate(()=>localStorage.setItem('one-day-reset-snapshot-v1',JSON.stringify({answers:['舊版現況','舊版畫面','舊版行動'],tags:['方向模糊'],identity:'我是會留時間給自己的人',scheduledAt:'2026-10-15T18:37',step:2})));
  await page.reload();await click('start');await click('next');
  check((await text('#g-sign'))==='我是會留時間給自己的人'&&(await text('.g-summary')).includes('舊版現況')&&await page.locator('#g-identity').inputValue()==='留時間給自己','Draft saved by the previous version still opens intact');
  await page.locator('.g-more summary').click();await page.evaluate(()=>window.confirm=()=>true);await click('draft-clear');
  check(await page.evaluate(()=>localStorage.getItem('one-day-reset-snapshot-v1')===null)&&await page.locator('[data-g="start"]').isVisible(),'Private snapshot can still be cleared');
  await page.evaluate(report=>window.snapshotV2Report=report,{passed:checks.length,checks});
}
