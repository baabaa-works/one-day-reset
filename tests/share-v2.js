async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const click=action=>page.locator(`#growth [data-g="${action}"]`).first().click();
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();await click('start');
  for(const value of ['SHARE_PRIVATE_現況','SHARE_PRIVATE_方向','SHARE_PRIVATE_行動']){await page.locator('#g-answer').fill(value);await click('next');}
  const line=await page.locator('[data-g="line"]').getAttribute('href');
  const parsed=await page.evaluate(href=>{const line=new URL(href),url=new URL(line.searchParams.get('url'));return {origin:line.origin,path:line.pathname,url:url.href,params:Object.fromEntries(url.searchParams)};},line);
  check(parsed.origin==='https://social-plugins.line.me'&&parsed.path==='/lineit/share','Result exposes direct official LINE share in one action');
  check(parsed.params.utm_source==='share'&&parsed.params.utm_medium==='friend'&&parsed.params.utm_campaign==='snapshot','Friend attribution is exact');
  check(!line.includes('PRIVATE')&&!decodeURIComponent(line).includes('PRIVATE'),'LINE invitation has no answer');
  await page.locator('details summary').click();await page.locator('#g-tone').selectOption('1');await page.locator('#g-invite').fill('EDITED_INVITE 一起寫幾句');
  check(decodeURIComponent(await page.locator('[data-g="line"]').getAttribute('href')).includes('EDITED_INVITE'),'LINE follows edited invitation');
  await page.evaluate(()=>{window.copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copied=text}});});
  await click('copy-invite');check(await page.evaluate(()=>window.copied.includes('EDITED_INVITE')&&window.copied.includes('#snapshot')&&!window.copied.includes('PRIVATE')),'One copy includes invitation and safe link');
  await click('threads');check(await page.evaluate(()=>window.copied.includes('EDITED_INVITE')),'Threads offers verified copy fallback');
  await click('share');check(!(await page.locator('#growth').textContent()).includes('SHARE_PRIVATE'),'Default share page excludes answers');
  check((await page.locator('#g-card').getAttribute('aria-label')).includes('哪件小事'),'Default preview is general question');
  await page.waitForTimeout(400); // 等通用卡的 toBlob 回呼落地，避免基準值取樣過早
  const count=await page.evaluate(()=>Object.values(ResetAnalytics.report().groups).reduce((n,r)=>n+(r.actions.card_generated||0),0));
  await page.locator('input[value="personal"]').check();
  check((await page.locator('#g-personal').inputValue()).includes('SHARE_PRIVATE'),'Explicit choice loads editable personal snapshot');
  check((await page.locator('#growth').textContent()).includes('這張卡會包含你的回答'),'Personal preview disclosure');
  await click('download');check((await page.locator('#g-status').textContent()).includes('先看過'),'Personal export blocked until preview confirmation');
  check(await page.evaluate(expected=>Object.values(ResetAnalytics.report().groups).reduce((n,r)=>n+(r.actions.card_generated||0),0)===expected,count),'Preview alone does not count personal generation');
  await page.locator('#g-personal').fill('我的分享原話');await click('confirm-personal');await page.waitForTimeout(100);
  const wait=page.waitForEvent('download');await click('download');check((await wait).suggestedFilename()==='one-day-reset.png','Confirmed card download');
  check(await page.locator('#reset-fallback img').isVisible(),'Image download always offers long-press preview');
  await page.locator('#reset-fallback button').click();
  await page.locator('#g-personal').fill('修改後的文字');await click('copy-text');check((await page.locator('#g-status').textContent()).includes('先看過'),'Editing invalidates confirmation');
  await click('confirm-personal');await page.waitForTimeout(100);
  await page.evaluate(()=>{window.shared=null;Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.shared={text:data.text,file:data.files?.[0]?.type}});});
  await click('native');check(await page.evaluate(()=>window.shared.text.includes('修改後的文字')&&window.shared.file==='image/png'&&!window.shared.text.includes('SHARE_PRIVATE')),'Native share sends confirmed card only');
  for(const width of [360,390]){await page.setViewportSize({width,height:width===360?800:844});await page.locator('#g-card').screenshot({path:`test-results/after-d-${width}-personal-card.png`});await page.screenshot({path:`test-results/after-d-${width}-share.png`});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: share fits`);}
  await page.goto(parsed.url);check(await page.locator('.g-invitation').isVisible()&&await page.locator('[data-g="start"]').isVisible(),'Recipient sees invitation and explicit start');
  await page.goto('http://127.0.0.1:4173/?s=f#snapshot');check(await page.locator('.g-invitation').isVisible(),'Printed short link resolves friend invitation');
  check(!(await page.evaluate(()=>JSON.stringify(ResetAnalytics.report()))).includes('SHARE_PRIVATE'),'Local analytics excludes answers');
  await page.evaluate(report=>window.shareV2Report=report,{passed:checks.length,checks});
}
