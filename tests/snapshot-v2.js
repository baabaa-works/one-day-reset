async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const base='http://127.0.0.1:4173/';
  const click=action=>page.locator(`#growth [data-g="${action}"]`).first().click();
  await page.setViewportSize({width:360,height:800});
  for(let skip=0;skip<3;skip++) {
    await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();await click('start');
    for(let i=0;i<3;i++){if(i!==skip)await page.locator('#g-answer').fill('使用者原話 '+i);await click(i===skip?'skip':'next');}
    check(await page.locator('.g-summary').isVisible(),`Question ${skip+1} can be skipped`);
    check((await page.locator('#g-result-line').textContent()).includes('（先留白）'),`Question ${skip+1} has honest blank fallback`);
  }
  await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();await click('start');
  await page.locator('[data-g="tag"][data-index="0"]').click();await page.locator('[data-g="tag"][data-index="1"]').click();await page.locator('[data-g="tag"][data-index="2"]').click();
  check(await page.locator('.g-tags [aria-pressed="true"]').count()===2,'Tags limited to two');
  check(await page.locator('#g-answer').inputValue()==='','Tags do not write the user answer');
  await page.locator('#g-answer').fill('SNAPSHOT_PRIVATE：工作訊息一直來');await click('next');
  await page.locator('.g-starters summary').click();await page.locator('[data-g="starter"]').first().click();
  check((await page.locator('#g-answer').inputValue()).includes('＿＿'),'Starter is optional editable beginning');
  await page.locator('#g-answer').fill('在安靜房間醒來，心情自在');await click('next');
  await page.locator('#g-answer').fill('晚飯後散步');await page.locator('#g-identity').fill('留時間給自己');await page.locator('#g-when').fill('2026-10-15T18:37');
  await page.reload();await click('start');
  check(await page.locator('#g-identity').inputValue()==='留時間給自己','Identity and step restored');
  check(await page.locator('#g-when').inputValue()==='2026-10-15T18:37','Schedule restored');
  await click('back');check(await page.locator('#g-answer').inputValue()==='在安靜房間醒來，心情自在','Back retains words');await click('next');await click('next');
  check((await page.locator('#g-result-line').textContent())==='我是會留時間給自己的人\n這週我先：晚飯後散步。','Identity leads result without rewriting action');
  const wait=page.waitForEvent('download');await click('action-calendar');const download=await wait;await download.saveAs('test-results/snapshot-action.ics');
  check(download.suggestedFilename().endsWith('.ics'),'Action reminder is an explicit local ICS download');
  check(!(await page.evaluate(()=>JSON.stringify(ResetAnalytics.report()))).includes('SNAPSHOT_PRIVATE'),'Analytics excludes answers');
  check(!page.url().includes('SNAPSHOT_PRIVATE'),'URL excludes answers');
  for(const width of [360,390]){await page.setViewportSize({width,height:width===360?800:844});await page.screenshot({path:`test-results/after-c-${width}-result.png`});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: snapshot fits`);}
  await click('edit');await click('next');await click('next');await page.locator('#g-identity').fill('');await click('next');
  check((await page.locator('#g-result-line').textContent()).startsWith('最近的我：SNAPSHOT_PRIVATE'),'Empty identity falls back to fixed original-word sentence');
  await page.evaluate(report=>window.snapshotV2Report=report,{passed:checks.length,checks});
}
