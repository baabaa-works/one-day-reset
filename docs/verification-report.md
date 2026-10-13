# 第二輪交付報告

2026-10-13。完成 A–H 與補充包 v2；全部留在本機，尚未 push、發布或部署。

## 變更

- 首屏改為承諾 → 開始 → 信任文案。根網址、Threads UTM 與短網址一致；朋友入口顯示邀請，舊工作台須明確點入後繼續。
- 三題可留白，有兩標籤與可編輯起手句；身份句與小行動分層呈現，空身份退回固定原話句型；可選時間接本機 ICS。
- 結果一動作開 LINE 邀請，三種可改口吻、一鍵複製含連結的訊息、Threads 複製備援。通用卡為預設，個人卡先選擇、預覽、編輯、確認；改字即取消確認。所有圖有可讀短網址。
- 能力全受限時可在記憶體完成、手動複製回答與 JSON、長按 img 或截圖；誠實提示換瀏覽器不帶走回答。
- 保留 28 節點與舊備份格式，重新表述問題。手機一次一題、段落可停、明早續寫。六個可編輯／略過提醒，ICS 標題與說明均有提問；複製與逐筆加入行事曆備援。
- 六格卡只在本機，可儲存、複製、下載、列印；空白公開圖沒有回答。快照帶入要確認，只填空欄。7／30 天回訪與三題本機回顧；清除工作台包含新快取與回顧。
- 本機失敗診斷、四種粗類別、安全與獨立署名、繁中修正、五組 Threads A/B 草稿與五張附圖、IG 限動短文。

## 驗證

| 檢查 | 通過 |
| --- | ---: |
| 原有流程／備份／相容性 | 67 |
| 原有手機／28 節點／列印 | 8 |
| 原有 Analytics 檔案（舊文件記 17，實際檔案為 21） | 21 |
| 首屏／短參數／邀請／舊回答 | 57 |
| 三題 v2／身份／行動 | 19 |
| 分享選擇／確認／私人邊界 | 21 |
| 四種 UA 同時禁止儲存、分享、剪貼簿、下載 | 52 |
| 工作台／六提醒／六格／回訪／清除 | 26 |
| 本機診斷表與投影 | 8 |
| 手機截圖／首屏／字級／對比／可見問題 | 35 |
| 可讀但不可寫儲存的去重與記憶體診斷 | 4 |
| **合計** | **318** |

`test-results/verification.json` 保存各斷言名稱。Node analytics 測來源白名單、去重、30 分鐘、同意／DNT／GPC、隱私投影、受限及可讀不可寫儲存；新失敗事件即使外部同意亦不傳送。Node calendar 核對實際下載檔：六提問、標題與說明、Asia/Taipei、跨日、UTF-8 折行、行動原話、7／30 天相隔 23 天與三題回顧。所有 assets JS、inline JS、preview 與驗證腳本語法及 diff 檢查通過。

首屏主按鈕對比 12.04:1、信任文字 5.44:1；可見首頁連結／按鈕至少 44px，快照與工作台文字輸入 16px。工作台手機標頭已縮減，白天提問在兩尺寸首屏可見。11 個草稿 UTM 連結均在白名單；五張附圖 1080×1350。外部分析仍關閉，Website ID 空白。

驗證中修正的失敗：Windows 沙箱 Edge 啟動受限，改用核准的隔離啟動；新增第二張表造成測試 locator 衝突，改為按漏斗名稱定位；可讀但寫入被拒的 sessionStorage 回讀舊值，改用記憶體去重。這些項目已通過相關回歸，沒有未處理的本機失敗。

## 手機前後對照

28 張 baseline 與 44 張最終截圖留在 `test-results/`，依規則不納入 Git。根網址與完整 Threads `#snapshot` 各有三題、結果、分享卡與分享畫面；最終另有身份卡與三段工作台圖。

| 尺寸／入口 | 改版前 | 改版後 |
| --- | --- | --- |
| 390×844 根網址 | [首屏](../test-results/before-390-root-entry.png) | [首屏](../test-results/after-390-root-entry.png) |
| 390×844 #snapshot | [直接進題](../test-results/before-390-snapshot-entry.png) | [承諾與開始](../test-results/after-390-snapshot-entry.png) |
| 360×800 根網址 | [首屏](../test-results/before-360-root-entry.png) | [首屏](../test-results/after-360-root-entry.png) |
| 360×800 #snapshot | [直接進題](../test-results/before-360-snapshot-entry.png) | [承諾與開始](../test-results/after-360-snapshot-entry.png) |

[390 結果](../test-results/after-390-root-result.png)、[360 結果](../test-results/after-360-root-result.png)、[身份卡](../test-results/after-360-root-identity-card.png)、[手機白天單題](../test-results/after-390-snapshot-workbench-day.png)。

## 逐條完成證據

| 要求 | 證據 |
| --- | --- |
| A 稽核、點擊與輸入、字級、署名與 28 節點差異 | redesign-audit.md、baseline 圖；依 v2 未取得原文全文，措辭稽核為概念對照與預防性改寫，不宣稱逐字相似度結論 |
| B 首屏、朋友邀請、短參數相容 | entry-v2 與 final-mobile；完整 UTM 優先、未知短碼忽略 |
| C 可跳過、標籤、起手句、身份、進度／返回／暫存、時間 | snapshot-v2 與下載的 snapshot-action.ics |
| D 固定原話／身份卡、預設通用、確認、可讀網址、LINE 順序、邀請口吻、IG 指引、friend 參數 | share-v2、final-mobile 與圖；LINE 使用 [官方 url/text 格式](https://developers.line.biz/en/docs/line-social-plugins/install-guide/using-line-share-buttons/)，Threads 官方 intent 格式未能取得可靠證據，採允許的複製文字備援 |
| E 功能偵測、try/catch、圖片與文字降級、記憶體、換瀏覽器警語 | resilience-v2 四種 UA、storage-quota-v2、零外部請求／零未捕捉錯誤 |
| F 分段／單題／停點、六 ICS、六格本機操作、空白卡、確認不覆蓋、7／30 回訪 | workbench-v2、calendar-check、原有 28 節點與備份回歸 |
| G 安全、分析、繁中、原創貼文 A/B 與 IG | diagnostics-v2、analytics-check、launch-posts.md、五張附圖；[衛福部號碼與時間](https://www.mohw.gov.tw/cp-2704-50587-1.html) |
| H 原有／新增檢查、兩尺寸前後、交付限制 | 本報告與 verification.json |
| 原生／無新依賴／舊 keys 格式／本機隱私／不外傳 | 原有 JSON round trip、Node／網路檢查、靜態 preview；沒有框架、後端、帳號、Umami ID、付費服務或部署 |

## 仍需實機與線上驗證

本機不能證明以下成功，也沒有用模擬結果代替：

1. 實機 Threads／IG／LINE 內建瀏覽器的長按存圖、相簿、日曆匯入、外開頁面與 LINE 選朋友傳送；Facebook 與 Android 行為也需實機抽查。UA 模擬不是其 WebView。
2. 實際 Threads 發文、IG 限動連結貼圖、LINE 收件畫面。請使用通用卡與測試回答；個人卡需自行確認。
3. 真實 Umami 收件：2026-10-13 站方已同意並填入 Website ID、enabled=true（本報告其餘「外部分析關閉」敘述為啟用前的驗證當下狀態）。同日改為預設傳送匿名事件、訪客可停止（opt-out），11 套瀏覽器測試 318 項與 Node 檢查重跑通過。本機只有攔截模擬，發布後的真實收件尚未驗證；全站統計不含已停止傳送或開啟 DNT／GPC 的訪客。
4. GitHub Pages 新版線上頁面、社群爬蟲預覽與快取、實際曝光／完成／轉傳率。尚未 push，公開站仍是原版；圖上正式短網址將在你確認發布後才對應新版。

目前無待完成的本機實作。下一步由站方檢視這份成果與素材，確認後才 push；此任務沒有自動 push。

## 分階段提交

A `8597fe9`、B `761c6e7`、C `82ae720`、D `894e56d`、E `ee0f62d`、F `b6916df`、G `686216c`。H 為本報告所在的最後一筆本機提交；完整 hash 見交付訊息與 Git log。

## 2026-10-13 語音輸入

- `voice-v2`：17 項通過（假的 SpeechRecognition）；完整套件 12 組共 335 項瀏覽器斷言與 Node 檢查全數通過。
- `share-v2` 補上 400ms 等待：原本在通用卡 `toBlob` 回呼落地前取樣基準值，偶發誤判，與產品行為無關。
- 未驗證：真實麥克風的辨識品質、iOS Safari、Threads／IG／LINE 內建瀏覽器。
