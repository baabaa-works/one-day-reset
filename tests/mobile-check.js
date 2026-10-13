async page => {
  const checks=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  await page.goto('http://127.0.0.1:4173/');
  await page.evaluate(()=>localStorage.clear());await page.reload();
  check(await page.evaluate(()=>navigator.maxTouchPoints>0),'Touch mobile context');
  await page.locator('[data-g="start"]').click();
  for(const answer of ['想保留自己的時間','每天安靜讀書','週三讀十頁']){await page.locator('#g-answer').fill(answer);await page.locator('[data-g="next"]').click();}
  check(await page.locator('.g-summary').isVisible(),'Mobile completes quick experience');
  await page.locator('[data-g="share"]').click();
  check(await page.locator('#g-card').isVisible(),'Mobile renders share card');
  await page.locator('#growth [data-g="workbench"]').click();
  // Seed all original nodes with observable fixture answers; no production data.
  await page.evaluate(()=>{
    const morning=Object.fromEntries(['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m13','m14','m15'].map(id=>[id,'完整答案 '+id]));
    const evening=Object.fromEntries(['e16','e17','e18','e19','e20','e21'].map(id=>[id,'完整答案 '+id]));
    localStorage.setItem('one-day-reset-tw-v1',JSON.stringify({view:'plan',morning,evening,dayDone:Object.fromEntries([1,2,3,4,5,6].map(i=>['d'+i,true])),constraints:'健康',quests:[{text:'行動一',time:'09:00'},{text:'行動二',time:'10:00'},{text:'行動三',time:'11:00'}]}));
  });
  await page.reload();
  check(await page.locator('#sideProgressLabel').textContent()==='28 / 28 個核心節點','All 28 nodes still count');
  check(await page.locator('#sidePercent').textContent()==='100%','Full workspace reaches 100%');
  await page.evaluate(()=>{window.print=()=>{};});await page.locator('[data-action="print"]').click();
  check((await page.locator('#printSheet').textContent()).includes('完整答案 m15'),'Full print report retains reflection');
  await page.emulateMedia({media:'print'});
  check(!await page.locator('#app').isVisible() && await page.locator('#printSheet').isVisible(),'Print layout hides app and shows report');
  await page.emulateMedia({media:'screen',reducedMotion:'reduce'});
  check(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior==='auto'),'Reduced motion honored');
  await page.locator('.g-workbench-home').click();
  await page.screenshot({path:'test-results/mobile-home.png',fullPage:true});
  await page.evaluate(report=>window.mobileReport=report,{passed:checks.length,checks});
  console.log(JSON.stringify({passed:checks.length,checks}));
}
