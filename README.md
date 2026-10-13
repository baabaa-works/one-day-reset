# One Day Reset

免費、免登入的繁體中文反思工具。新訪客可先用三題完成「90 秒人生快照」，再選擇分享問題卡，或進入保留原有 28 節點的完整工作台。

## 本機預覽

需要 Node.js，不需要安裝任何產品依賴。

```powershell
node scripts/preview.cjs
```

開啟 http://127.0.0.1:4173/ 。直接進入快照使用 `/?utm_source=threads&utm_medium=social&utm_campaign=snapshot#snapshot`。也可直接開啟 `index.html`，但剪貼簿與原生分享能力依瀏覽器／安全環境而異。GitHub Pages 可直接發布這些靜態檔案，沒有 build 步驟。公開站點：https://baabaa-works.github.io/one-day-reset/ 。

第二輪入口：根網址與 `#snapshot` 都先顯示「開始 90 秒快照」，點擊後進題目。舊工作台可由「完整工作台」繼續。短網址 `/?s=th-a#snapshot` 對應 Threads / snapshot / post-a；另有 th-b、ig-a，完整 UTM 優先。朋友邀請入口接受 `utm_medium=friend` 或舊版 `share`，網址不含回答。

## 私人資料與分享

- 原工作台 key 與 JSON 格式保持 `one-day-reset-tw-v1`，不遷移、不覆寫。
- 快照使用獨立 key `one-day-reset-snapshot-v1`，支援下载與清除。
- 個人分享卡只顯示使用者另外輸入的文字，不自動取用快照或工作台回答，也不寫入網址／統計。個人卡欄位僅存在記憶體。
- 分享卡是 PNG，提供 1080×1350 貼文、1080×1920 限動版型；原生分享不可用時，可下載、複製文字或複製網址。剪貼簿受限時顯示可手動複製文字。
- 完整工作台仍支援 JSON 匯入／匯出、Markdown 紀錄、行事曆與列印。不同裝置、不同網站 origin 的本機資料不互通。
- 所有分析目前只在本機；Umami 介接預設關閉，須站方與訪客同意才可傳送匿名操作事件。沒有後端或產品依賴。

## 查看成長數據

訪客首頁只提供快照、分享與「隱私與資料」。站方直接開啟 `growth-tools.html` 查看本機漏斗、產生 UTM 連結或匯出 JSON；首頁不提供管理入口。管理頁沒有登入保護，但只讀同一瀏覽器的本機統計，不展示私人回答，也不增加造訪數。全站數據仍須取得同意並連接 Umami，在其私人帳號查看。詳見 [Growth Analytics](docs/growth-analytics.md)。

## 驗證

```powershell
node --check assets/growth.js
node --check scripts/preview.cjs
node tests/analytics-check.cjs
node tests/calendar-check.cjs
playwright-cli run-code --filename=tests/entry-v2.js
playwright-cli eval "window.entryV2Report"
playwright-cli run-code --filename=tests/snapshot-v2.js
playwright-cli eval "window.snapshotV2Report"
playwright-cli run-code --filename=tests/share-v2.js
playwright-cli eval "window.shareV2Report"
playwright-cli run-code --filename=tests/resilience-v2.js
playwright-cli eval "window.resilienceV2Report"
playwright-cli open http://127.0.0.1:4173 --browser=msedge
playwright-cli run-code --filename=tests/browser-flow.js
playwright-cli eval "window.testReport"
playwright-cli run-code --filename=tests/analytics-browser.js
playwright-cli eval "window.analyticsReport"
playwright-cli -s=mobile open http://127.0.0.1:4173 --browser=msedge --device="iPhone 15"
playwright-cli -s=mobile run-code --filename=tests/mobile-check.js
playwright-cli -s=mobile eval "window.mobileReport"
```

若全域 CLI 不存在，可使用安裝的 Playwright `node <playwright-package>/cli.js cli` 取代 `playwright-cli`。測試只操作隔離的本機測試瀏覽器，會清除该測試 context 的資料，不要對自己的日常瀏覽器執行。測試截圖／備份留在 `test-results/`（不 commit）。沒有產品依賴安裝、lint 或 build 命令。

2026-10-13：67 項流程與相容性斷言、8 項手機觸控／28 節點／列印斷言、17 項 Analytics 瀏覽器斷言與 Node 計數／隱私測試通過。原生分享成功與取消使用模擬 API；Analytics 外部傳輸以攔截回應驗證，未上傳真實資料。不能證明實機 Threads／IG 發布成功或 Umami 真實帳號已收件。

社群預覽圖片為 `assets/social-preview.png`。`og:image` 先以此 repository 的 GitHub Pages 預期位置設定；若實際站點使用自訂網域或其他 base URL，發布前需調整。尚未驗證線上爬蟲快取或實際曝光。

## 待真實使用者驗證

三題是否能降低開始門檻、問題卡是否值得轉傳、快照能否帶動完整工作台，以及手機內建瀏覽器的儲存／分享相容性，都仍是待驗證假設，不能由本機測試推論成長效果。
