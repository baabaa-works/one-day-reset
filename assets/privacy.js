(() => {
  const a=window.ResetAnalytics;
  window.resetPrivacySettings=()=>`<details class="g-privacy"><summary>隱私與資料</summary><p>你的回答只留在此瀏覽器。快照與完整工作台分開儲存，分享卡不會自動帶入回答。清除瀏覽器資料會刪除紀錄；完整工作台可下載備份。</p><p>我們在此裝置記錄不含回答的操作次數，協助檢查體驗流程。${a.config.enabled?'本站預設也會傳送匿名使用統計，你可以隨時停止，不影響使用。':'目前沒有向外部分析服務傳送資料。'}</p>${a.config.enabled?'<p>Umami 會收到匿名操作事件、來源代號與連線資訊（IP、瀏覽器），用來統計網站使用情況。不傳送你的回答、個人分享卡文字或備份，不使用 Cookie 或個人識別碼。瀏覽器開啟「不要追蹤」或 GPC 時不會傳送。</p><button type="button" class="g-secondary" data-privacy="deny">停止傳送</button><button type="button" class="g-secondary" data-privacy="allow">恢復匿名使用統計</button><p id="privacy-status" role="status"></p>':''}</details>`;
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-privacy]')?.dataset.privacy;if(!action)return;
    a.consent(action==='allow');
    document.getElementById('privacy-status').textContent=action==='deny'?'已停止傳送，此瀏覽器之後不再傳送。':a.ready()?'已恢復，僅記錄之後的匿名操作。':'目前不會傳送，瀏覽器的隱私設定仍優先。';
  });
})();
