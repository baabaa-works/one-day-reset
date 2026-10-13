async page => {
  const checks=[],wire=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  await page.route('https://gateway.umami.is/**',async route=>{wire.push(route.request().postDataJSON());await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
  await page.goto('http://127.0.0.1:4173/?utm_source=threads&utm_medium=social&utm_campaign=launch_202610&utm_content=threads_question_01');
  await page.locator('#growth > .growth-shell > details > summary').click();
  check(await page.locator('.g-analytics table').isVisible(),'Local source funnel visible');
  await page.locator('#a-source').selectOption('instagram');await page.locator('#a-campaign').selectOption('evergreen');await page.locator('#a-content').selectOption('ig_question_01');await page.locator('[data-analytics="build"]').click();
  const link=await page.locator('#a-link').inputValue();check(link.includes('utm_source=instagram')&&link.includes('utm_content=ig_question_01')&&link.includes('#snapshot'),'Campaign builder outputs distinct direct-experience link');
  check(await page.locator('[data-analytics="allow"]').isDisabled(),'External opt-in unavailable without owner configuration');
  await page.reload();
  check(await page.evaluate(()=>window.ResetAnalytics.report().groups['threads|social|launch_202610|threads_question_01'].sessions.visit_started===1),'Reload does not inflate visits');
  for(const width of [360,390,768,1440]){await page.setViewportSize({width,height:844});await page.locator('#growth > .growth-shell > details > summary').click();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Open analytics panel fits ${width}px`);await page.locator('#growth > .growth-shell > details > summary').click();}
  await page.locator('[data-g="start"]').click();
  for(const answer of ['PRIVATE_ANSWER','PRIVATE_GOAL','PRIVATE_ACTION']){await page.locator('#g-answer').fill(answer);await page.locator('[data-g="next"]').click();}
  await page.locator('[data-g="share"]').click();
  await page.waitForFunction(()=>Object.values(window.ResetAnalytics.report().groups).some(row=>row.sessions.card_generated===1));
  const local=await page.evaluate(()=>window.ResetAnalytics.report());const row=local.groups['threads|social|launch_202610|threads_question_01'];
  check(row.sessions.snapshot_started===1&&row.sessions.snapshot_completed===1&&row.sessions.card_generated===1,'Actual UI triggers funnel stages');
  check(!JSON.stringify(local).includes('PRIVATE'),'Local report excludes answers');
  await page.locator('#growth [data-g="workbench"]').click();
  check(await page.evaluate(()=>window.ResetAnalytics.report().groups['threads|social|launch_202610|threads_question_01'].sessions.snapshot_workbench_entered===1),'Quick-to-workbench conversion counts');
  check(wire.length===0,'No external transmission in shipped configuration');
  await page.route('**/assets/analytics-config.js',route=>route.fulfill({contentType:'text/javascript',body:`window.RESET_ANALYTICS_CONFIG=Object.freeze({enabled:true,websiteId:'00000000-0000-0000-0000-000000000001',hostname:'127.0.0.1',pathname:'/one-day-reset/',campaigns:['snapshot','launch_202610','evergreen'],contents:['question_card','personal_card','threads_question_01','threads_action_01','ig_question_01']});`}));
  await page.goto('http://127.0.0.1:4173/?utm_source=PRIVATE_EMAIL&utm_campaign=PRIVATE_ANSWER&utm_content=PRIVATE_GOAL#snapshot');
  await page.locator('#growth .growth-logo').click();
  await page.locator('#growth > .growth-shell > details > summary').click();
  check(wire.length===0,'Configured external provider still waits for visitor consent');
  await page.locator('[data-analytics="allow"]').click();
  const sent=page.waitForResponse('https://gateway.umami.is/api/send');
  await page.locator('[data-g="share"]').click();await sent;
  await page.waitForFunction(()=>Object.values(window.ResetAnalytics.report().groups).some(row=>row.actions.card_generated));
  check(wire.length>0,'Opted-in provider payload exercised via intercepted network only');
  check(!JSON.stringify(wire).includes('PRIVATE'),'Wire payload excludes private text and unregistered UTMs');
  check(wire.every(x=>x.payload.url==='/one-day-reset/'&&x.payload.referrer===''&&!('id'in x.payload)),'Wire uses fixed path, empty referrer and no visitor ID');
  await page.locator('#growth .growth-logo').click();await page.locator('#growth > .growth-shell > details > summary').click();await page.locator('[data-analytics="deny"]').click();
  const before=wire.length;await page.locator('[data-g="share"]').click();await page.waitForTimeout(200);check(wire.length===before,'Revocation stops further requests');
  await page.unroute('**/assets/analytics-config.js');await page.unroute('https://gateway.umami.is/**');
  await page.goto('http://127.0.0.1:4173/');if(await page.locator('#app').isVisible())await page.locator('.g-workbench-home').click();
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/desktop-home.png',fullPage:true});
  await page.evaluate(report=>window.analyticsReport=report,{passed:checks.length,checks});
}
