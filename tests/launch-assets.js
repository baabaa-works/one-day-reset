async page => {
  await page.goto('http://127.0.0.1:4173/');
  const prompts=['哪件事，你已經說了很多次，還沒替它留出時間？','回看這一週，你把時間留給了什麼？','哪個熟悉的安排，讓你暫時安心？','三年後的一個平日，你想在哪裡醒來？','這週，哪件小事值得先留十分鐘？'];
  for(const [i,text]of prompts.entries()) {
    await page.evaluate(({text,i})=>{
      document.querySelector('#launch-card')?.remove();const canvas=document.createElement('canvas');canvas.id='launch-card';canvas.width=1080;canvas.height=1350;canvas.style.cssText='display:block;width:360px;height:450px';document.body.prepend(canvas);
      const c=canvas.getContext('2d');c.fillStyle='#263b2c';c.fillRect(0,0,1080,1350);c.fillStyle='#e3fa9c';c.font='32px "Microsoft JhengHei",sans-serif';c.fillText('留一個問題，給最近有點迷路的自己',80,180);
      c.fillStyle='#f5f8ef';c.font='700 64px "Microsoft JhengHei",sans-serif';let row='',y=440;for(const char of text){if(c.measureText(row+char).width>900&&!/[，。？！]/.test(char)){c.fillText(row,80,y);row='';y+=110;}row+=char;}c.fillText(row,80,y);
      c.font='34px "Microsoft JhengHei",sans-serif';c.fillText('沒有標準答案，也可以先留白。',80,1050);c.font='700 40px sans-serif';c.fillText('One Day Reset · 90 秒快照',80,1150);c.font='25px sans-serif';c.fillText(`baabaa-works.github.io/one-day-reset/?s=th-${'abcde'[i]}#snapshot`,80,1250);
    },{text,i});
    await page.locator('#launch-card').screenshot({path:`assets/launch-post-${'abcde'[i]}.png`});
  }
}
