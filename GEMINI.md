# P5R Guide 專案指南 (GEMINI.md)

## 1. 專案概述
P5R Guide 是一個專為《女神異聞錄5 皇家版》開發的攻略網站，提供 Persona 數據庫、屬性抗性查詢及合成路徑規劃功能。

### 技術棧 (Tech Stack)
- **前端**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **數據管理**: SQLite (sql.js) + 靜態 JSON (`lib/personas.json`)
- **爬蟲**: Node.js (ESM), Axios, Cheerio (數據源: BWIKI)
- **單元測試**: Vitest

### 核心功能
- **Persona 列表**: 分頁、Arcana 篩選、實時搜索。
- **Persona 詳情**: 五維圖表、屬性抗性、特性、技能列表、電刑道具。
- **合成系統**: 二體合成計算、寶魔加成、逆向合成路徑規劃（支持多步、技能、特性篩選）。
- **本地化**: 支援 簡體中文 (CN) 與 繁體中文 (TW) 的自動轉換。

---

## 2. 目錄結構
```
p5r/
├── app/                    # Next.js 頁面路由 (App Router)
│   ├── fusion/             # 合成規劃頁面
│   ├── personas/           # Persona 列表頁面
│   └── globals.css         # 全域樣式 (Tailwind v4 + CSS Vars)
├── components/             # React 組件 (PersonaCard, PersonaModal 等)
├── lib/                    # 核心邏輯與靜態數據
│   ├── fusion.ts           # 合成算法 (BFS, 價格計算)
│   ├── types.ts            # 全域 TypeScript 接口定義
│   ├── personas.json       # 導出的靜態數據 (主要數據源)
│   └── cn-tw.ts            # 中文繁簡轉換工具
├── data/                   # 原始數據 (gitignore)
│   └── personas.db         # SQLite 數據庫
├── scripts/                # 開發工具與爬蟲
│   ├── scraper.js          # Wiki 爬蟲 (基本數據)
│   ├── scrape-detail.js    # Wiki 爬蟲 (五維、特性詳情)
│   └── export-json.js      # SQLite 轉 JSON 工具
└── public/                 # 靜態資源 (不含 Persona 圖片)
```

---

## 3. 開發規範與指令

### 常用命令 (Scripts)
- `pnpm dev`: 啟動 Next.js 開發服務器 (http://localhost:3000)
- `pnpm build`: 生產環境構建
- `pnpm scrape`: 執行主爬蟲獲取基本數據
- `pnpm export`: 將 SQLite 數據導出為 `lib/personas.json` (前端數據源)
- `pnpm test`: 執行 Vitest 測試

### 編碼約定
- **組件**: 優先使用 Server Components，僅在需要狀態或交互時使用 `'use client'`。
- **樣式**: 使用 Tailwind CSS v4。主題色定義在 `globals.css` 中的 `:root`。
- **類型**: 嚴格遵守 `lib/types.ts` 中的接口定義，不使用 `any`。
- **本地化**: 數據存儲為簡體中文，前端顯示時通過 `lib/i18n.ts` 或 `lib/cn-tw.ts` 轉換。

---

## 4. 核心領域邏輯

### 屬性抗性 (Resistances)
| 狀態 | 縮寫 | 效果 |
|---|---|---|
| `weak` | 弱 | 1.5倍傷害 |
| `resist` | 耐 | 0.5倍傷害 |
| `repel` | 反 | 反射傷害 |
| `absorb` | 吸 | 吸收傷害 |
| `null`/`block` | 無/封 | 免疫傷害 |

### 合成算法 (`lib/fusion.ts`)
1. **二體合成**: 根據 Arcana 合成矩陣 (`fusion-matrix.ts`) 決定結果 Arcana，再取平均等級向上取最接近的 Persona。
2. **寶魔合成**: 根據 Persona 的 Arcana 與寶魔種類決定等級升降。
3. **規劃器**: 使用 BFS 尋找多步合成路徑，支持 `requiredSkills`、`requiredTrait` 與 `requiredPersonas` 篩選。

### 主題色彩
- **主色 (Red)**: `#E31C34`
- **背景 (Black)**: `#0D0D0D`
- **強調 (Yellow)**: `#FFD32A`

---

## 5. 注意事項
- **數據庫同步**: 修改數據後務必執行 `pnpm export` 刷新 `lib/personas.json`。
- **爬蟲限制**: BWIKI 有頻率限制 (567 Error)，腳本中已包含延遲邏輯。
- **特殊 Persona**: `NON_FUSIBLE_PERSONAS` (如初期人格面具) 不參與合成計算。
