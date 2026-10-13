const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={window:{},URL,TextEncoder,Date};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/calendar.js','utf8'),context);
const api=context.window.ResetCalendar;
const text='測試提問，含分號；換行\n與反斜線\\'.repeat(12);
const ics=api.calendar([{date:'2026-10-13',time:'23:57',title:text,description:text}]);
assert.match(ics,/DTSTART;TZID=Asia\/Taipei:20261013T235700/);
assert.match(ics,/DTEND;TZID=Asia\/Taipei:20261014T000700/);
assert(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
const unfolded=ics.replace(/\r\n /g,'');
assert(unfolded.includes('SUMMARY:測試提問\\，')===false);
assert(unfolded.includes('SUMMARY:測試提問，含分號；換行\\n與反斜線\\\\'));
assert.throws(()=>api.calendar([{date:'2026-02-30',time:'12:00',title:'問題'}]));
assert.throws(()=>api.calendar([{date:'2026-10-13',time:'24:00',title:'問題'}]));
assert.equal(new URL(api.google({date:'2026-10-13',time:'10:17',title:'公開提問'})).searchParams.get('ctz'),'Asia/Taipei');
if(fs.existsSync('test-results/snapshot-action.ics')) {
  const result=fs.readFileSync('test-results/snapshot-action.ics','utf8').replace(/\r\n /g,'');
  assert(result.includes('SUMMARY:這週我先：晚飯後散步'));
  assert(result.includes('DTSTART;TZID=Asia/Taipei:20261015T183700'));
}
console.log('PASS: calendar date/time validation, midnight rollover, UTF-8 folding, escaping, timezone and snapshot action content.');
if(fs.existsSync('test-results/day-prompts.ics')) {
  const result=fs.readFileSync('test-results/day-prompts.ics','utf8').replace(/\r\n /g,'');
  assert.equal((result.match(/BEGIN:VEVENT/g)||[]).length,6);
  assert(result.includes('SUMMARY:EDITED 公開提問？'));
  assert(result.includes('DESCRIPTION:EDITED 公開提問？'));
  assert(!result.includes('KEEP_PRIVATE'));
}
if(fs.existsSync('test-results/return-reminders.ics')) {
  const result=fs.readFileSync('test-results/return-reminders.ics','utf8').replace(/\r\n /g,'');
  assert.equal((result.match(/BEGIN:VEVENT/g)||[]).length,2);
  assert(result.includes('#review'));
  for(const q of ['哪件小事真的發生了','哪個地方和上次不同','繼續或調整哪一步'])assert(result.includes(q));
  assert(!result.includes('PRIVATE'));
  const dates=[...result.matchAll(/DTSTART;TZID=Asia\/Taipei:(\d{4})(\d\d)(\d\d)T/g)].map(m=>Date.UTC(+m[1],+m[2]-1,+m[3]));
  assert.equal((dates[1]-dates[0])/86400000,23);
}
if(fs.existsSync('test-results/six-grid.txt'))assert(fs.readFileSync('test-results/six-grid.txt','utf8').includes('PRIVATE 行動一'));
console.log('PASS: downloaded daytime questions, six-grid words and 7/30-day calendar content when fixtures exist.');
