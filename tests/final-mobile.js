async page => {
  const checks=[],metrics=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  for(const size of [{width:390,height:844},{width:360,height:800}])for(const [entry,query]of [['root',''],['snapshot','?utm_source=threads&utm_medium=social&utm_campaign=snapshot#snapshot']]) {
    await page.setViewportSize(size);await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.goto('http://127.0.0.1:4173/'+query);
    const prefix=`test-results/after-${size.width}-${entry}`;
    check(await page.locator('[data-g="start"]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),`${size.width} ${entry}: first screen start`);await page.screenshot({path:prefix+'-entry.png'});
    await page.locator('[data-g="start"]').click();
    for(let i=0;i<3;i++) {
      check(await page.locator('#g-answer').evaluate(e=>getComputedStyle(e).fontSize==='16px'),`${size.width} ${entry} question ${i+1}: input 16px`);
      await page.locator('#g-answer').fill(['下班後還在回工作訊息','在安靜的房間醒來，慢慢吃早餐','週三晚餐後散步十分鐘'][i]);
      if(i===2)await page.locator('#g-identity').fill('替自己留時間');
      await page.screenshot({path:prefix+`-q${i+1}.png`});await page.locator('[data-g="next"]').click();
    }
    check(await page.locator('.g-identity-line').isVisible(),`${size.width} ${entry}: identity is main result`);
    check(await page.locator('.g-action-line').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)<parseFloat(getComputedStyle(e.previousElementSibling).fontSize)),`${size.width} ${entry}: action smaller than identity`);
    await page.screenshot({path:prefix+'-result.png'});await page.locator('[data-g="share"]').click();await page.locator('#g-card').screenshot({path:prefix+'-card.png'});await page.screenshot({path:prefix+'-share.png'});
    await page.locator('input[value="personal"]').check();await page.locator('[data-g="confirm-personal"]').click();await page.locator('#g-card').screenshot({path:prefix+'-identity-card.png'});
    await page.locator('#growth [data-g="workbench"]').first().click();await page.locator('#nav [data-view="morning"]').click();await page.screenshot({path:prefix+'-workbench-morning.png'});await page.locator('#nav [data-view="day"]').click();await page.screenshot({path:prefix+'-workbench-day.png'});check(await page.locator('.time-card:visible h3').evaluate(e=>e.getBoundingClientRect().top<innerHeight),`${size.width} ${entry}: daytime question visible without scrolling`);await page.locator('#nav [data-view="plan"]').click();await page.screenshot({path:prefix+'-workbench-plan.png'});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${size.width} ${entry}: workbench fits`);
  }
  await page.goto('http://127.0.0.1:4173/');
  const measurements=await page.evaluate(()=>{
    const rgb=value=>(value.match(/\d+/g)||[]).slice(0,3).map(Number);
    const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const e=document.querySelector('[data-g="start"]'),style=getComputedStyle(e);return {primaryContrast:ratio(style.color,style.backgroundColor),noteContrast:ratio(getComputedStyle(document.querySelector('.g-note')).color,getComputedStyle(document.querySelector('#growth')).backgroundColor),smallTargets:[...document.querySelectorAll('#growth button,#growth a')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).map(e=>e.textContent)};
  });
  check(measurements.primaryContrast>=4.5,'Primary button contrast >= 4.5');check(measurements.noteContrast>=4.5,'Trust note contrast >= 4.5');check(measurements.smallTargets.length===0,'Visible home links and buttons >=44px');
  metrics.push(measurements);await page.evaluate(report=>window.finalMobileReport=report,{passed:checks.length,checks,metrics});
}
