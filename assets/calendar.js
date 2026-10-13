(() => {
  'use strict';
  const escape = value => String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  // RFC 5545 folds by UTF-8 octets, without splitting a Unicode character.
  function fold(line) {
    const rows=[];let row='',bytes=0;
    for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>75){rows.push(row);row=' ';bytes=1;}row+=char;bytes+=n;}
    rows.push(row);return rows.join('\r\n');
  }
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value+'T12:00:00').getTime()) && new Date(value+'T12:00:00').getDate()===Number(value.slice(8));
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const dateString = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function calendar(events) {
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const rows=['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN','METHOD:PUBLISH','PRODID:-//One Day Reset//Local Calendar//ZH-Hant-TW','BEGIN:VTIMEZONE','TZID:Asia/Taipei','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0800','TZOFFSETTO:+0800','END:STANDARD','END:VTIMEZONE'];
    for(const [i,event]of events.entries()) {
      if(!validDate(event.date)||!validTime(event.time))throw Error('請選擇有效日期與時間。');
      const start=new Date(event.date+'T'+event.time+':00'),end=new Date(start.getTime()+10*60000);
      const localStamp=d=>dateString(d).replace(/-/g,'')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';
      rows.push('BEGIN:VEVENT',`UID:reset-${event.date}-${event.time.replace(':','')}-${i}@local`,`DTSTAMP:${stamp}`,`DTSTART;TZID=Asia/Taipei:${localStamp(start)}`,`DTEND;TZID=Asia/Taipei:${localStamp(end)}`,`SUMMARY:${escape(event.title)}`,`DESCRIPTION:${escape(event.description||event.title)}`,'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY',`DESCRIPTION:${escape(event.title)}`,'END:VALARM','END:VEVENT');
    }
    rows.push('END:VCALENDAR');return rows.map(fold).join('\r\n')+'\r\n';
  }
  function google(event) {
    if(!validDate(event.date)||!validTime(event.time))throw Error('請選擇有效日期與時間。');
    const start=event.date.replace(/-/g,'')+'T'+event.time.replace(':','')+'00';
    const d=new Date(event.date+'T'+event.time+':00');d.setMinutes(d.getMinutes()+10);
    const end=dateString(d).replace(/-/g,'')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';
    const url=new URL('https://calendar.google.com/calendar/render');
    for(const [key,value]of Object.entries({action:'TEMPLATE',text:event.title,details:event.description||event.title,dates:start+'/'+end,ctz:'Asia/Taipei'}))url.searchParams.set(key,value);
    return url.href;
  }
  window.ResetCalendar=Object.freeze({calendar,google,validDate,validTime,dateString});
})();
