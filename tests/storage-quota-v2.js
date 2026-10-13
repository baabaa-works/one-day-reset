async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();
  await page.evaluate(()=>Object.defineProperty(sessionStorage,'setItem',{configurable:true,value:()=>{throw Error('quota');}}));
  await page.locator('[data-g="start"]').click();await page.locator('[data-g="home"]').first().click();await page.locator('[data-g="start"]').click();
  check(await page.evaluate(()=>Object.values(ResetAnalytics.report().groups)[0].sessions.snapshot_started===1),'Readable session storage with denied writes deduplicates in memory');
  check(await page.evaluate(()=>Object.values(ResetAnalytics.report().groups)[0].actions.snapshot_started===2),'Repeated actions remain observable');
  await page.evaluate(()=>{Object.defineProperty(localStorage,'setItem',{configurable:true,value:()=>{throw Error('quota');}});ResetAnalytics.track('download_failed');});
  check(await page.evaluate(()=>ResetAnalytics.report().in_app_browser.other.download_failed===1),'Readable local storage with denied writes keeps current diagnostic in memory');
  check(await page.evaluate(()=>ResetAnalytics.report().in_app_browser.other.storage_unavailable>0),'Read-only storage reports storage unavailable');
  await page.evaluate(report=>window.storageQuotaReport=report,{passed:checks.length,checks});
}
