async page => {
  const checks=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const urls=['','?utm_source=threads&utm_medium=social&utm_campaign=snapshot#snapshot','?utm_source=share&utm_medium=friend&utm_campaign=snapshot#snapshot','?utm_medium=share#snapshot','?s=th-a#snapshot'];
  for(const size of [{width:390,height:844},{width:360,height:800}]) {
    await page.setViewportSize(size);
    for(const [i,query]of urls.entries()) {
      await page.goto('http://127.0.0.1:4173/');
      await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('one-day-reset-tw-v1',JSON.stringify({morning:{m1:'ENTRY_TEST_OLD'},view:'morning'}));});
      await page.goto('http://127.0.0.1:4173/'+query);
      check(await page.locator('[data-g="start"]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),`${size.width} entry ${i}: start in first viewport`);
      check(await page.locator('#app').isHidden(),`${size.width} entry ${i}: workbench below explicit entrance`);
      check(await page.locator('.growth-logo').evaluate(e=>e.getBoundingClientRect().height>=44),`${size.width} entry ${i}: logo touch target`);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${size.width} entry ${i}: no horizontal overflow`);
      if(i===2||i===3)check(await page.locator('.g-invitation').isVisible(),`${size.width} entry ${i}: friend invitation`);
      if(i===4)check(await page.evaluate(()=>{const a=ResetAnalytics.attribution();return a.source==='threads'&&a.campaign==='snapshot'&&a.content==='post-a';}),`${size.width}: short attribution`);
      if(i<3)await page.screenshot({path:`test-results/after-b-${size.width}-entry-${i}.png`});
      await page.locator('#growth [data-g="workbench"]').first().click();
      check(await page.locator('#focusedAnswer').inputValue()==='ENTRY_TEST_OLD',`${size.width} entry ${i}: old answer intact`);
    }
  }
  await page.goto('http://127.0.0.1:4173/?s=th-a&utm_source=instagram&utm_content=post-b#snapshot');
  check(await page.evaluate(()=>{const a=ResetAnalytics.attribution();return a.source==='instagram'&&a.content==='post-b';}),'Explicit UTM overrides short defaults');
  await page.evaluate(report=>window.entryV2Report=report,{passed:checks.length,checks});
}
