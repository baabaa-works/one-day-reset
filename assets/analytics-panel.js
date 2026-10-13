(() => {
  const a=window.ResetAnalytics;
  const labels={threads:'Threads',instagram:'Instagram',share:'朋友分享',other:'其他',direct:'直接'};
  const ratio=(n,d)=>d?`${Math.round(n/d*100)}%`:'—';
  const count=(row,name)=>row.sessions?.[name]||0;
  const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.resetAnalyticsPanel=()=>{
    const report=a.report();
    const rows=Object.entries(report.groups).map(([group,row])=>{
      const [source,,campaign,content]=group.split('|'),v=count(row,'visit_started'),s=count(row,'snapshot_started'),c=count(row,'snapshot_completed');
      return `<tr><th scope="row">${labels[source]}<small>${campaign} / ${content}</small></th><td>${v}</td><td>${s} (${ratio(s,v)})</td><td>${c} (${ratio(c,s)})</td><td>${count(row,'card_generated')} (${ratio(count(row,'card_generated'),v)})</td><td>${count(row,'share_intent')} (${ratio(count(row,'share_intent'),v)})</td><td>${count(row,'image_download_started')} (${ratio(count(row,'image_download_started'),v)})</td><td>${count(row,'text_copied')} (${ratio(count(row,'text_copied'),v)})</td><td>${count(row,'link_copied')} (${ratio(count(row,'link_copied'),v)})</td><td>${count(row,'snapshot_workbench_entered')} (${ratio(count(row,'snapshot_workbench_entered'),s)})</td></tr>`;
    }).join('');
    const raw=JSON.stringify(report,null,2);
    return `<div class="g-analytics"><p><strong>目前：本機統計。${a.ready()?'外部匿名事件已啟用。':'外部傳輸未啟用。'}</strong></p><p>這是這台瀏覽器的造訪漏斗，不是全站使用者人數。同分頁 30 分鐘內的重新整理及重複點擊不增加轉換分子；不同貼文來源另計造訪。本機不建立個人識別碼，也不追蹤其他網站。</p><div class="g-table-scroll"><table><caption>依來源與貼文的造訪漏斗</caption><thead><tr><th>來源／貼文</th><th>造訪</th><th>開始／造訪</th><th>完成／開始</th><th>產卡／造訪</th><th>分享意圖／造訪</th><th>下載／造訪</th><th>複製文字／造訪</th><th>複製網址／造訪</th><th>工作台／開始</th></tr></thead><tbody>${rows||'<tr><td colspan="10">尚無紀錄</td></tr>'}</tbody></table></div><p>各欄人數指有該行為的造訪數。分享、下載、複製的詳細次數在下方 JSON 的 actions；sessions 是去重造訪數。image_download_started 僅表示瀏覽器開始下載；native_share_resolved 僅表示系統流程返回成功，無法證明發文。</p><details><summary>操作次數與匯出資料</summary><pre>${escape(raw)}</pre></details><h3>建立貼文推廣連結</h3><p>每篇貼文使用不同貼文代號，就能比較有效造訪：完成快照的造訪数。代號只接受預先登記的值；未知 UTM 不保存，避免誤收私人文字。要加入更多貼文，編輯 assets/analytics-config.js 的 contents 清單。</p><label for="a-source">平台</label><select id="a-source"><option value="threads">Threads</option><option value="instagram">Instagram</option></select><label for="a-campaign">活動</label><select id="a-campaign">${a.config.campaigns.map(x=>`<option>${escape(x)}</option>`).join('')}</select><label for="a-content">貼文代號</label><select id="a-content">${a.config.contents.map(x=>`<option>${escape(x)}</option>`).join('')}</select><button type="button" class="g-secondary" data-analytics="build">產生推廣連結</button><label for="a-link">可直接複製，接收者會進入快照</label><textarea id="a-link" readonly>${escape(a.buildLink())}</textarea><button type="button" class="g-secondary" data-analytics="export">下載本機統計</button><button type="button" class="g-secondary" data-analytics="clear">清除本機統計</button><p role="status" id="a-status"></p></div>`;
  };
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-analytics]')?.dataset.analytics;if(!action)return;
    if(action==='build'){document.getElementById('a-link').value=a.buildLink({source:document.getElementById('a-source').value,campaign:document.getElementById('a-campaign').value,content:document.getElementById('a-content').value});document.getElementById('a-link').select();document.getElementById('a-status').textContent='已產生；網址不包含任何個人回答。';}
    if(action==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(a.report(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='本機操作統計.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
    if(action==='clear'&&confirm('清除這台瀏覽器的操作統計？私人回答不受影響。')){a.clear();document.getElementById('owner-panel').innerHTML=window.resetAnalyticsPanel();}
  });
})();
