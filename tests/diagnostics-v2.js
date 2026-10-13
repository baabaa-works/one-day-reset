async page => {
  const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();
  check(await page.locator('#growth .w-safety a[href="tel:1925"]').isVisible(),'Snapshot safety line present');
  await page.evaluate(()=>{ResetAnalytics.track('download_failed',{answer:'PRIVATE_DIAGNOSTIC',userAgent:'RAW_UA'});ResetAnalytics.track('share_failed');ResetAnalytics.track('storage_unavailable');});
  await page.goto('http://127.0.0.1:4173/growth-tools.html');
  check((await page.locator('#owner-panel').textContent()).includes('內建瀏覽器降級紀錄'),'Owner sees diagnostic table');
  check(await page.locator('.g-analytics table').count()===2,'Funnel and diagnostic tables both present');
  check((await page.locator('.g-analytics table').nth(1).textContent()).includes('LINE'),'Only coarse browser classes displayed');
  check(!JSON.stringify(await page.evaluate(()=>ResetAnalytics.report())).includes('PRIVATE')&&!JSON.stringify(await page.evaluate(()=>ResetAnalytics.report())).includes('RAW_UA'),'Diagnostic projection excludes raw values');
  for(const width of [360,390,1440]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Diagnostic panel fits ${width}px`);}
  await page.evaluate(report=>window.diagnosticsV2Report=report,{passed:checks.length,checks});
}
