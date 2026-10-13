async page => {
  const checks=[],wire=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const base='http://127.0.0.1:4173/';
  await page.route('https://gateway.umami.is/**',async route=>{wire.push(route.request().postDataJSON());await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
  const incoming=base+'?utm_source=threads&utm_medium=social&utm_campaign=launch_202610&utm_content=threads_question_01';
  await page.goto(incoming);
  check(await page.locator('.g-analytics,#a-source,[data-analytics]').count()===0,'Visitor UI has no owner statistics or promotion tools');
  check(await page.locator('.g-footer [data-g="share"]').textContent()==='分享給朋友','Requested share label');
  await page.locator('.g-privacy summary').click();check((await page.locator('.g-privacy').textContent()).includes('你的回答只留在此瀏覽器'),'Visitors retain privacy explanation');
  check(await page.locator('[data-privacy="allow"]').count()===0,'Disabled service shows no unused consent controls');
  await page.goto(base+'growth-tools.html');check(await page.getByRole('table',{name:'依來源與貼文的造訪漏斗'}).isVisible(),'Owner tools have local funnel');check(await page.evaluate(()=>Object.keys(window.ResetAnalytics.report().groups).length===1),'Owner page does not count as new visit');
  await page.locator('#a-source').selectOption('instagram');await page.locator('#a-campaign').selectOption('evergreen');await page.locator('#a-content').selectOption('ig_question_01');await page.locator('[data-analytics="build"]').click();
  const link=await page.locator('#a-link').inputValue();check(link.startsWith(base+'?')&&!link.includes('growth-tools')&&link.includes('utm_content=ig_question_01')&&link.includes('#snapshot'),'Owner links send friends to visitor experience');
  for(const width of [360,903,1440]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Owner page fits ${width}px`);}
  const wait=page.waitForEvent('download');await page.locator('[data-analytics="export"]').click();check((await wait).suggestedFilename().endsWith('.json'),'Owner can export statistics');
  await page.goto(incoming);check(await page.evaluate(()=>window.ResetAnalytics.report().groups['threads|social|launch_202610|threads_question_01'].sessions.visit_started===1),'Reload and owner page do not inflate visits');
  await page.locator('[data-g="start"]').click();for(const answer of ['PRIVATE_ANSWER','PRIVATE_GOAL','PRIVATE_ACTION']){await page.locator('#g-answer').fill(answer);await page.locator('[data-g="next"]').click();}
  await page.locator('[data-g="share"]').click();await page.waitForFunction(()=>Object.values(window.ResetAnalytics.report().groups).some(row=>row.sessions.card_generated===1));
  check(await page.locator('#g-card').evaluate(c=>{const p=c.getContext('2d').getImageData(0,0,1,1).data;return p[0]===38&&p[1]===59&&p[2]===44;}),'Share card uses forest green');await page.locator('#g-card').screenshot({path:'test-results/green-share-card.png'});
  const local=await page.evaluate(()=>window.ResetAnalytics.report());const row=local.groups['threads|social|launch_202610|threads_question_01'];check(row.sessions.snapshot_started===1&&row.sessions.snapshot_completed===1&&row.sessions.card_generated===1,'Actual UI triggers funnel stages');check(!JSON.stringify(local).includes('PRIVATE'),'Report excludes answers');
  await page.locator('#growth [data-g="workbench"]').click();check(await page.evaluate(()=>window.ResetAnalytics.report().groups['threads|social|launch_202610|threads_question_01'].sessions.snapshot_workbench_entered===1),'Quick-to-workbench conversion');check(wire.length===0,'Shipped config sends no external events');
  await page.route('**/assets/analytics-config.js',route=>route.fulfill({contentType:'text/javascript',body:`window.RESET_ANALYTICS_CONFIG=Object.freeze({enabled:true,websiteId:'00000000-0000-0000-0000-000000000001',hostname:'127.0.0.1',pathname:'/one-day-reset/',campaigns:['snapshot','launch_202610','evergreen'],contents:['question_card','personal_card','threads_question_01','threads_action_01','ig_question_01']});`}));
  await page.goto(base+'?utm_source=PRIVATE_EMAIL&utm_campaign=PRIVATE_ANSWER&utm_content=PRIVATE_GOAL#snapshot');await page.locator('#growth .growth-logo').click();await page.locator('.g-privacy summary').click();check(wire.length===0,'Provider waits for visitor consent');
  await page.locator('[data-privacy="allow"]').click();const sent=page.waitForResponse('https://gateway.umami.is/api/send');await page.locator('[data-g="share"]').click();await sent;await page.waitForFunction(()=>Object.values(window.ResetAnalytics.report().groups).some(row=>row.actions.card_generated));
  check(wire.length>0&&!JSON.stringify(wire).includes('PRIVATE'),'Opt-in payload excludes private text');check(wire.every(x=>x.payload.url==='/one-day-reset/'&&x.payload.referrer===''&&!('id'in x.payload)),'Fixed path and no identity');
  await page.locator('#growth .growth-logo').click();await page.locator('.g-privacy summary').click();await page.locator('[data-privacy="deny"]').click();const before=wire.length;await page.locator('[data-g="share"]').click();await page.waitForTimeout(200);check(wire.length===before,'Visitor revocation stops requests');
  await page.unroute('**/assets/analytics-config.js');await page.unroute('https://gateway.umami.is/**');await page.goto(base);await page.setViewportSize({width:903,height:764});await page.screenshot({path:'test-results/green-home.png',fullPage:true});await page.evaluate(report=>window.analyticsReport=report,{passed:checks.length,checks});
}
