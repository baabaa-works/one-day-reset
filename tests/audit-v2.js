async page => {
  const base = 'http://127.0.0.1:4173/';
  const findings = [];
  for (const size of [{width:390,height:844},{width:360,height:800}]) {
    await page.setViewportSize(size);
    for (const [entry, query] of [['root',''],['snapshot','?utm_source=threads&utm_medium=social&utm_campaign=snapshot#snapshot']]) {
      await page.goto(base);
      await page.evaluate(() => {localStorage.clear();sessionStorage.clear();});
      await page.goto(base+query);
      const prefix = `test-results/before-${size.width}-${entry}`;
      await page.screenshot({path:prefix+'-entry.png'});
      findings.push(await page.evaluate(({entry,size}) => {
        const start=document.querySelector('[data-g="start"]');
        const r=start?.getBoundingClientRect();
        return {entry,size,firstHeading:document.querySelector('#growth h1,#growth h2')?.textContent,
          startVisible:!!r&&r.top>=0&&r.bottom<=innerHeight,
          smallTargets:[...document.querySelectorAll('#growth button,#growth a')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})),
          inputFont:document.querySelector('#g-answer')?getComputedStyle(document.querySelector('#g-answer')).fontSize:null};
      },{entry,size}));
      if(entry==='root')await page.locator('[data-g="start"]').click();
      for(let i=0;i<3;i++) {
        await page.screenshot({path:prefix+`-q${i+1}.png`});
        await page.locator('#g-answer').fill(['練習資料：下班後還在看工作訊息','在安靜的房間醒來，有時間吃早餐','週三晚餐後散步十分鐘'][i]);
        await page.locator('[data-g="next"]').click();
      }
      await page.screenshot({path:prefix+'-result.png'});
      await page.locator('[data-g="share"]').click();
      await page.locator('#g-card').screenshot({path:prefix+'-card.png'});
      await page.screenshot({path:prefix+'-share.png'});
    }
  }
  await page.evaluate(report=>window.auditV2Report=report, findings);
  console.log(JSON.stringify(findings));
}
