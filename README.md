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
- 快照使用獨立 key `one-day-reset-snapshot-v1`，支援下載與清除。
- 分享預設是通用問題卡。使用者明確選「分享我的快照卡」後才帶入自己的原話供預覽／編輯，再按確認才能匯出；編輯後需再次確認。個人卡欄位僅存在記憶體，不寫入網址／統計。圖上都印有可讀短網址。
- 分享卡是 PNG，提供 1080×1350 貼文、1080×1920 限動版型。結果可直接開 LINE 邀請，也可編輯三種口吻並一鍵複製含連結的訊息。Threads 採複製文字備援；下載與分享受限時有長按 img，剪貼簿受限時顯示已選取文字。換瀏覽器不會帶走回答，離開前可複製或下載私人備份。
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
playwright-cli run-code --filename=tests/workbench-v2.js
playwright-cli eval "window.workbenchV2Report"
playwright-cli run-code --filename=tests/diagnostics-v2.js
playwright-cli eval "window.diagnosticsV2Report"
playwright-cli open http://127.0.0.1:4173 --browser=msedge
playwright-cli run-code --filename=tests/browser-flow.js
playwright-cli eval "window.testReport"
playwright-cli run-code --filename=tests/analytics-browser.js
playwright-cli eval "window.analyticsReport"
playwright-cli -s=mobile open http://127.0.0.1:4173 --browser=msedge --device="iPhone 15"
playwright-cli -s=mobile run-code --filename=tests/mobile-check.js
playwright-cli -s=mobile eval "window.mobileReport"
```

若全域 CLI 不存在，可使用安裝的 Playwright `node <playwright-package>/cli.js cli` 取代 `playwright-cli`。測試只操作隔離的本機測試瀏覽器，會清除該測試 context 的資料，不要對自己的日常瀏覽器執行。測試截圖／備份留在 `test-results/`（不 commit）。沒有產品依賴安裝、lint 或 build 命令。

2026-10-13 第二輪：318 項瀏覽器斷言通過，包含既有 67 項流程、8 項手機與分析檢查實際 21 項（舊文件記為 17），另有入口、三題、分享、全失敗降級、工作台、診斷與兩尺寸視覺驗證。Node 隱私／去重／受限儲存與實際 ICS 內容檢查通過，所有 JS 與 inline 語法通過。原生分享成功與取消使用模擬 API；Analytics 外部傳輸以攔截回應驗證，未上傳真實資料。實機與爬蟲限制見 [交付報告](docs/verification-report.md)。

可一次跑完整驗證，不新增依賴：先開本機預覽，再執行 `node scripts/verify.cjs <絕對路徑的-playwright-package>/cli.js`。會啟動獨立手機測試 context，保存 `test-results/verification.json` 與截圖，最後關閉測試瀏覽器。Windows 若瀏覽器受沙箱限制，需由允許啟動隔離 Edge 的環境執行。原有個別 CLI 命令仍可用。

社群預覽圖片為 `assets/social-preview.png`。`og:image` 先以此 repository 的 GitHub Pages 預期位置設定；若實際站點使用自訂網域或其他 base URL，發布前需調整。尚未驗證線上爬蟲快取或實際曝光。

## 待真實使用者驗證

三題是否能降低開始門檻、問題卡是否值得轉傳、快照能否帶動完整工作台，以及手機內建瀏覽器的儲存／分享相容性，都仍是待驗證假設，不能由本機測試推論成長效果。

## 完整工作台第二輪

28 節點與舊備份投影保留；手機早上、白天、晚上一次一題。每段可停下，提供明早續寫。白天六提醒可編輯時間與提問、可略過；ICS 標題與說明包含提問，不含筆記。下載後同時保留複製提問與逐筆加入 Google 行事曆的備援；點逐筆加入才把提問交給 Google，不會交出工作台回答。

六格卡可儲存在本機、複製、下載文字與列印；空白範本圖片不含回答，可公開分享。回訪有 7／30 天提醒與 `#review` 三題入口。快照「帶到完整工作台」先預覽並確認，只填 m1／m13／m15／m14 的空欄，不覆蓋舊內容。

新增本機 key：`one-day-reset-workbench-options-v1`（提醒提問、略過、單題位置、回顧），`one-day-reset-game-card-v1`（主動儲存的六格卡）。舊工作台 JSON 備份保持原格式，不包含這兩個獨立項目；六格卡請另外下載，提醒設定可匯出 ICS。沒有通知權限、推播或雲端同步。
