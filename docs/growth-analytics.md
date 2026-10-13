# Growth Analytics 使用說明

## 已啟用：本機可驗證的數據

站方直接開啟 `growth-tools.html`：查看本機漏斗、產生 UTM 連結、匯出或清除統計。訪客首頁只保留簡單隱私說明。管理頁不增加造訪數；沒有登入保護，但只讀取同一瀏覽器的本機統計，不展示私人回答，無法讀到其他訪客，也不是全站儀表板。全站數據（不含已停止傳送或開啟 DNT／GPC 的訪客）在 Umami 的私人帳號查看。舊版操作計數不混入新版分母。

一個造訪定義為同分頁、同來源與貼文、30 分鐘內持續操作。重新整理仍算同一次；30 分鐘無操作或換不同 UTM 組合另計。sessionStorage 只記當前來源、已發生階段與閒置時間，不產生 UUID、個人識別或跨站追蹤。不同分頁、裝置或受限儲存空間可能另計，不能推論獨立人數。禁止儲存時，計數僅保留於該頁記憶體。

| 事件 | 觸發與含義 |
| --- | --- |
| visit_started | 新的一次造訪；分母，不是每次重新整理 |
| snapshot_started | 開始／續寫三題或由分享連結直接入題 |
| snapshot_completed | 走完三題並按整理（包含留白／跳過）；只計一次／造訪，不代表三題皆有回答 |
| card_generated | PNG 實際生成後，通用卡或非空個人卡；編輯造成重繪只增加操作數，不增加造訪分子 |
| share_intent | 進分享畫面、開系統選單、下載或複製的嘗試 |
| native_share_resolved | 系統 share promise resolved，**不代表社群發布** |
| native_share_cancelled / native_share_failed | 系統分享取消／錯誤 |
| image_download_started | 已發起 PNG 下載；不保證檔案已存入手機相簿 |
| text_copied / link_copied | Clipboard API 成功；手動複製顯示不假裝成功 |
| workbench_entered | 點入完整工作台 |
| snapshot_workbench_entered | 同一次造訪使用快照後，由快照或其分享畫面進工作台 |
| share_failed | 缺少原生分享或分享 promise 非取消地拒絕；僅本機 |
| download_failed | download 能力缺少或建立／點擊下載失敗；僅本機，不偵測靜默丟棄 |
| storage_unavailable | 本機分析寫入失敗，退到記憶體；僅本機 |

JSON `sessions` 為有此行為的造訪數，`actions` 為實際操作次數。開始率＝開始／造訪；完成率＝完成／開始；產卡、分享意圖、下載與複製操作率＝有此行為的造訪／所有造訪；快照到工作台＝快照入工作台／開始。不把點擊分享當成曝光或發文。空分母顯示 `—`。

## 貼文連結

`utm_source=threads` 或 `instagram`、`utm_medium=social`、`utm_campaign=snapshot`、`utm_content=post-a`，尾端 `#snapshot` 顯示承諾與開始按鈕，點擊後入題。分享邀請一律 `utm_source=share&utm_medium=friend&utm_campaign=snapshot#snapshot`，不含個人內容；舊 `utm_medium=share` 入口同樣顯示朋友邀請。

貼文規則：五種開頭使用 post-a～post-e；主貼文連結用原代號，第一則回覆的 A/B 版本加 `-reply`（例如 post-a-reply）。同一開頭、附圖與內容只改連結位置，對照「完成／開始」與有效造訪，不以少量操作宣稱勝出。IG 使用同代號與 instagram source 分組。草稿與圖在 [launch-posts.md](launch-posts.md)。短參數 th-a～th-e 映射到 Threads／snapshot／post-a～post-e，ig-a 為 IG／snapshot／post-a；完整 UTM 優先，未知 s 被忽略。圖上朋友短入口 `?s=f#snapshot` 映射 share／friend／snapshot。

管理頁另有內建瀏覽器降級表，JSON 的 `in_app_browser` 只含 threads／instagram／line／other 四類與失敗計數。UA 原文只暫時用於分類，不記錄或傳送，不儲存版本、裝置、尺寸或識別碼；功能降級依 API／實際 try/catch 決定。Facebook 與一般瀏覽器都歸 other。這三個事件與類別即使外部服務已啟用也只留在本機。受限儲存時只有當頁記憶體，切到管理頁或重新整理會消失，不能假裝能跨頁保存。

每篇貼文用不同 content。新增公開貼文代號到 `assets/analytics-config.js` 的 contents，活動代號到 campaigns，再透過管理頁連結產生器複製。代號使用小寫公開 slug，不放 email、姓名或私人句子。未知活動／貼文值會歸類 `unregistered` 並捨棄原值，未知來源歸 `other`。沒有 UTM 時僅根據 referrer hostname 的 Threads／Instagram 白名單或直接進站判斷，完整 referrer 不儲存。

比較貼文先看 `snapshot_completed` 的造訪數與完成率；單次測試或小樣本不能判斷貼文勝負。若點入多、開始少，先檢查貼文與首頁承諾是否一致；若開始多、完成少，檢查題目難度／手機輸入；完成多、產卡少，可訪談分享價值，不應強迫分享。

## 全站 Umami Cloud（2026-10-13 站方同意並啟用）

選擇 Umami Cloud 的原因：靜態網站可直接傳送自訂事件，不需應用後端或 API secret；目前 Hobby 為免費 1 個網站、每月最多 100K 計量事件、保留 6 個月。事件資料屬性也占用額度，100K **不是訪客數**；不開付費 trial。來源：[定價](https://umami.is/pricing)、[使用量說明](https://docs.umami.is/docs/cloud/faq)。

**目前 enabled=true，websiteId 已填入站方的公開 Website ID。** 站方選擇 opt-out：訪客不需點同意，預設即傳送白名單內的匿名事件；啟用前的造訪不補傳。本機驗證攔截了網路／模擬了回應，發布後仍須用專用測試 content 驗證真實帳號是否收到事件。

站方已同意以下影響，並提供 Umami 的公開 Website ID（不是密碼或 API Key）：外部服務會收到 IP、User-Agent、事件名稱及白名單中的來源／活動／貼文代號。依服務商說明，IP 用於地理資料而不保存，工作階段由連線資訊與輪替 salt 計算，與本機 30 分鐘造訪定義不同。來源：[官方指標定義](https://docs.umami.is/docs/metric-definitions)。

啟用步驟：

1. 站方同意，於 Umami 免費帳號新增此網站，取得 Website ID。
2. 設定 `analytics-config.js` 的 websiteId、實際 hostname、固定公開 pathname，最後將 enabled 改為 true。不能填私密頁面路徑。
3. 訪客進站即傳送 `visit_started`，不需點同意；「隱私與資料」說明服務商與收到的資料，並提供「停止傳送」（存在此瀏覽器，儲存被封鎖時只在當頁記憶體有效）與「恢復匿名使用統計」。DNT／GPC 一律阻擋。停止後恢復時，下一個操作會建立外部測量造訪分母；若直接完成正在使用的快照，補上該次開始標記，不補傳停止期間的分享／下載／私人資料或本機歷史。
4. 步驟 1–2 已完成。由站方自行決定發布；發布後用專用測試 content 驗證真實收件，再查看正式資料。

傳送採官方 `/api/send` 介面，不載入第三方追蹤腳本。payload 使用固定頁名／公開路徑、空 referrer、列舉事件與有限屬性，`credentials=omit`、`referrerPolicy=no-referrer`。不傳送原始 URL query/hash、答案、目標、個人卡文字、備份、螢幕尺寸、個人 ID，也不執行 session replay。服務商回傳的識別碼不保存、不再使用。來源：[官方事件傳送](https://docs.umami.is/docs/api/sending-stats)。

## 查看外部數據

Umami 網站 → Events：按事件名查看次數，在 Properties 依 `source`、`campaign`、`content` 分組／篩選。用 `visit_started` 比較進站、`snapshot_completed` 比較有效造訪，漏斗步驟為 visit_started → snapshot_started → snapshot_completed → snapshot_workbench_entered。這些轉換事件一個本機造訪只送一次；一般分享／下載／複製仍可多次。官方說明：[Events Properties](https://docs.umami.is/docs/event-data)。

來源 UTM 放在已清理的 event data，而不是原始網址；因此不要期待內建 Referrer／UTM 頁自動出現同樣數據，也不要用一般 Views 冒充進站人數。外部造訪／匿名訪客計算法不同，跨分頁會重算；訪客停止傳送、開啟 DNT／GPC、阻擋服務（如廣告攔截器）或離線會少計，不適合宣稱精準全站總人數。沒有補傳或重試佇列，避免重複上報與保存額外資料。

## 驗證命令

```powershell
node tests/analytics-check.cjs
playwright-cli run-code --filename=tests/analytics-browser.js
playwright-cli eval "window.analyticsReport"
```

Node 驗證來源、去重、30 分鐘界線、分母、服務關閉時零傳輸、預設傳送與停止／恢復開關（含重新載入與儲存被封鎖）、DNT／GPC、網域限制、白名單、受限儲存與清除；瀏覽器驗證真正 UI 事件、連結產生器、360–1440px 表格、非正式網域零傳輸，以及預設傳送／停止後的攔截 payload。全流程與手機驗證仍見 README。
