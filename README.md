# HW10-1112962 Othello（黑白棋）— GitHub Pages

## 功能對照（作業要求）
- ✅ 玩家先手黑棋（Black），電腦後手白棋（White）
- ✅ 電腦棋力分兩段：
  - **基本棋力**：Greedy + Corner Priority + 位置權重
  - **進階棋力**：Minimax + Alpha-Beta（含角落/行動力/位置權重評估）
- ✅ 非基本 UI/UX（現場檢視可展示）：
  - 立體黑白棋（CSS 高光/陰影）
  - 翻棋動作（翻轉動畫）
  - **依序翻棋**（逐顆翻轉）

---

## 線上繳交（GitHub Pages）上傳步驟
1. 開 GitHub → **New repository**（建議 repo 名稱：`hw10-1112962`）
2. 將本專案所有檔案上傳到 repo 根目錄：
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. 到 repo：**Settings → Pages**
   - Build and deployment → Source：選 **Deploy from a branch**
   - Branch：選 `main` / `(root)` → Save
4. 等 1~2 分鐘後，Pages 會給你網址（例如 `https://<你的帳號>.github.io/hw10-1112962/`）

---

## 執行截圖（給你貼作業格式用）
> 你老師的「下方格式」我這裡看不到，所以我先放常見範本（你可以照老師格式改）。

### 截圖 1：主畫面（可看到棋盤 + 棋力選單）
[![Screenshot-1](./screenshots/s1.png)](https://<你的帳號>.github.io/hw10-1112962/)

### 截圖 2：翻棋動畫（逐顆翻）
[![Screenshot-2](./screenshots/s2.png)](https://<你的帳號>.github.io/hw10-1112962/)

> 你可以自行新增 `screenshots/` 資料夾放圖片，然後把上面連結改成你的 GitHub Pages 網址。

---

## 使用方式
- 點棋盤上的合法落點下子（合法落點會有小點提示與翻子數字）
- 右上角可切換電腦棋力、提示開關
- **悔棋**：只保留最近一步（方便現場展示）

---

## 檔案結構
- `index.html`：版面與 UI
- `style.css`：立體棋子、翻棋動畫、棋盤樣式
- `script.js`：規則判定、電腦棋力、逐顆翻棋動畫
