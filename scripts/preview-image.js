async page => {
  await page.setViewportSize({width:1200,height:630});
  await page.setContent(`<html lang="zh-Hant"><meta charset="utf-8"><body style="margin:0;background:#263b2c;color:#fffefa;font-family:Microsoft JhengHei,sans-serif;padding:64px 78px;box-sizing:border-box;width:1200px;height:630px"><div style="font-size:28px;color:#e3fa9c">給最近有點迷路的自己</div><h1 style="font-size:64px;line-height:1.45;margin:30px 0">最近很努力，<br>卻不知道在往哪裡走？</h1><p style="font-size:28px">三個問題，寫下現況與下一步。</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:44px"><b style="font-size:32px">One Day Reset</b><span style="color:#e3fa9c;font-size:28px">90 秒人生快照 · 免費體驗</span></div></body></html>`);
  await page.screenshot({path:'assets/social-preview.png'});
  await page.goto('http://127.0.0.1:4173/');
  return 'Created 1200×630 static social preview';
}
