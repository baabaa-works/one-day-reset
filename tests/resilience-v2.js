async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const browser=page.context().browser();
  for(const [name,userAgent]of [['instagram','Mozilla/5.0 iPhone Instagram 350.0'],['line','Mozilla/5.0 iPhone Line/14.0'],['facebook','Mozilla/5.0 iPhone FBAN/FBIOS'],['threads','Mozilla/5.0 iPhone Barcelona Threads']]) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent});
    await context.addInitScript(()=>{
      Storage.prototype.getItem=()=>{throw new DOMException('denied','SecurityError');};
      Storage.prototype.setItem=()=>{throw new DOMException('denied','SecurityError');};
      Storage.prototype.removeItem=()=>{throw new DOMException('denied','SecurityError');};
      Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('denied','NotAllowedError');}}});
      const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)throw Error('blocked download');return click.call(this);};
    });
    const test=await context.newPage();const errors=[];const remote=[];test.on('pageerror',e=>errors.push(e.message));test.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173'))remote.push(r.url());});
    const click=action=>test.locator(`#growth [data-g="${action}"]`).first().click();
    try {
      await test.goto('http://127.0.0.1:4173/?utm_source=threads&utm_medium=social&utm_campaign=snapshot#snapshot');
      check(await test.locator('.g-storage-warning').isVisible(),`${name}: upfront memory warning`);
      await click('start');for(const value of ['MEMORY_PRIVATE 忙碌','有自己的時間','週三散步']){await test.locator('#g-answer').fill(value);await click('next');}
      check((await test.locator('.g-summary').textContent()).includes('MEMORY_PRIVATE'),`${name}: completes with all capabilities blocked`);
      await test.locator('.g-more summary').click();await click('copy-answers');check((await test.locator('#reset-copy').inputValue()).includes('MEMORY_PRIVATE'),`${name}: selected manual private answer fallback`);
      check(await test.locator('#reset-copy').evaluate(e=>e.selectionEnd===e.value.length),`${name}: fallback text selected`);await test.locator('#reset-fallback button').click();
      await click('draft-export');check((await test.locator('#reset-copy').inputValue()).includes('one-day-reset-snapshot-v1'),`${name}: backup denial offers manual JSON`);await test.locator('#reset-fallback button').click();
      await click('share');await test.waitForTimeout(120);await test.locator('#g-more summary').click();await click('native');check(await test.locator('#reset-fallback img').isVisible(),`${name}: native unavailable gives long-press img`);await test.locator('#reset-fallback button').click();
      await click('download');check(await test.locator('#reset-fallback img').isVisible(),`${name}: blocked download gives long-press img`);await test.locator('#reset-fallback button').click();
      await click('copy-invite');check((await test.locator('#g-copy').inputValue()).includes('utm_medium=friend')&&!(await test.locator('#g-copy').inputValue()).includes('MEMORY_PRIVATE'),`${name}: public manual invitation excludes answer`);
      await test.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('denied','NotAllowedError');}}));await click('native');check(await test.locator('#reset-fallback img').isVisible(),`${name}: native rejection gives img`);await test.locator('#reset-fallback button').click();
      await test.screenshot({path:`test-results/resilience-${name}.png`,fullPage:true});
      check(!(await test.evaluate(()=>JSON.stringify(ResetAnalytics.report()))).includes('MEMORY_PRIVATE'),`${name}: analytics excludes answer with blocked storage`);
      check(await test.evaluate(browser=>{const r=ResetAnalytics.report().in_app_browser[browser];return r.share_failed>=2&&r.download_failed>=2&&r.storage_unavailable>0;},name==='facebook'?'other':name),`${name}: local failure category without UA storage`);
      check(remote.length===0,`${name}: no external requests`);check(errors.length===0,`${name}: no uncaught exceptions`);
    } finally {await context.close();}
  }
  await page.evaluate(report=>window.resilienceV2Report=report,{passed:checks.length,checks});
}
