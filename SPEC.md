# P5R Guide 專案規格說明書

## 1. 專案概述

P5R Guide 是一個 Persona 5 Royal 攻略網站，提供 Persona 數據查詢、屬性抗性、電刑道具等功能。

### 技術堆疊
- **前端**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **後端**: Node.js (ESM) 爬蟲腳本
- **數據庫**: SQLite (sql.js 可在瀏覽器運行)
- **數據來源**: BWIKI wiki 網頁爬蟲

### 主題色彩
```css
--p5r-red: #E31C34     /* 主紅色 */
--p5r-black: #0D0D0D   /* 背景黑 */
--p5r-yellow: #FFD32A  /* 強調黃 */
--p5r-light: #F5F5F5   /* 淺色文字 */
--p5r-gray: #1A1A1A    /* 卡片背景 */
```

---

## 2. 目錄結構

```
p5r/
├── app/                      # Next.js App Router 頁面
│   ├── layout.tsx            # 根佈局 (字體、全局樣式)
│   ├── page.tsx              # 首頁
│   ├── personas/
│   │   └── page.tsx          # Persona 列表頁
│   └── globals.css           # Tailwind + CSS variables
├── components/               # React 組件
│   ├── PersonaCard.tsx       # Persona 卡片
│   ├── PersonaModal.tsx      # Persona 詳情彈窗
│   └── ...
├── lib/                      # 共享代碼
│   ├── types.ts              # TypeScript 接口定義
│   ├── api.ts                # 數據獲取函數
│   └── personas.json         # 導出的靜態數據 (259 personas)
├── data/                     # 運行時數據 (gitignore)
│   ├── personas.db           # SQLite 數據庫
│   └── images/               # 下載的圖片 (259 張)
├── scripts/                  # Node.js 工具 (ESM)
│   ├── scraper.js            # 主爬蟲 (基本數據)
│   ├── scrape-detail.js      # 詳情爬蟲 (五維、特化、電刑)
│   ├── scrape-missing.js     # 補爬缺失數據
│   └── export-json.js        # SQLite → JSON 導出
├── public/                   # 靜態資源 (不放 personas.json)
└── package.json
```

---

## 3. 數據流程

```
BWIKI Wiki (https://wiki.biligame.com/persona/P5R/...)
        ↓ scraper.js (爬基本數據: 名稱、等級、Arcana、抗性)
        ↓ scrape-detail.js (爬詳情: STR/MAG/END/AGI/LUK、特性、電刑)
        ↓
    SQLite (data/personas.db)
        ↓ export-json.js
        ↓
    JSON (lib/personas.json)
        ↓
    Next.js 前端 (通過 lib/api.ts 讀取)
```

### 常用命令
```bash
pnpm dev          # 開發服務器 (http://localhost:3000)
pnpm build        # 生產構建
pnpm start        # 生產服務器
pnpm scrape       # 爬蟲 (需手動執行)
pnpm export       # SQLite → JSON 導出
pnpm lint         # ESLint 檢查
```

---

## 4. 數據結構

### Persona 接口 (`lib/types.ts`)

```typescript
interface PersonaSkill {
  name: string;
  cost: string;
  unlock_level: number | null;  // null = 自带 (innate)
  description: string;
}

interface Persona {
  // 基本識別
  id: number;
  name_cn: string;           // 中文名 (唯一)
  name_en: string | null;    // 英文名
  name_jp: string | null;    // 日文名

  // 基礎數據
  level: number;
  arcana: string;            // 阿爾卡那 (愚者、魔術師、...)
  
  // 屬性抗性 (string | null)
  phys_resist: string | null;   // 'weak' | 'resist' | 'repel' | 'absorb' | 'null' | 'block'
  gun_resist: string | null;
  fire_resist: string | null;
  ice_resist: string | null;
  elec_resist: string | null;
  wind_resist: string | null;
  psy_resist: string | null;
  nuke_resist: string | null;
  bless_resist: string | null;
  curse_resist: string | null;

  // 圖片/連結
  image_url: string | null;      // 遠程 URL
  local_image_path: string | null;  // 本地路徑
  wiki_url: string | null;       // BWIKI 頁面

  // 五維屬性 (1-99)
  strength: number;
  magic: number;
  endurance: number;
  agility: number;
  luck: number;

  // 特化系統
  trait: string | null;         // 特性名稱
  trait_desc: string | null;    // 特性描述
  item_name: string | null;     // 電刑道具名稱
  item_desc: string | null;     // 電刑道具描述

  // 技能繼承 (1 = 可繼承, 0 = 不可繼承)
  inherit_phys: number;
  inherit_gun: number;
  inherit_fire: number;
  inherit_ice: number;
  inherit_elec: number;
  inherit_wind: number;
  inherit_psy: number;
  inherit_nuke: number;
  inherit_bless: number;
  inherit_curse: number;
  inherit_abnormal: number;    // 異常狀態
  inherit_recovery: number;   // 恢復技能

  // 技能列表
  skills: PersonaSkill[];
}
```

### 抗性值對照
| 值 | 符號 | 意義 |
|---|---|---|
| `weak` | 弱 | 受到 1.5 倍傷害 |
| `resist` | 耐 | 受到 0.5 倍傷害 |
| `repel` | 反 | 反射傷害 |
| `absorb` | 吸 | 吸收傷害回血 |
| `null` | 無 | 免疫傷害 |
| `block` | 封 | 封印該屬性攻擊 |
| `null` | - | 無特殊效果 |

### Arcana 順序
```
愚者 → 魔術師 → 女教皇 → 女皇 → 皇帝 → 教皇 → 恋人 → 戰車
→ 正義 → 隱士 → 命運 → 力量 → 倒懸者 → 死神 → 節制 → 惡魔
→ 塔 → 星星 → 月亮 → 太陽 → 審判 → 信念 → 顧問官 → 世界
```

---

## 5. 已實現功能

### ✅ 已完成的
1. **Persona 列表頁** - 分頁、Arcana 篩選、搜索
2. **Persona 卡片** - 顯示頭像、等級、Arcana、抗性
3. **Persona 詳情彈窗** - 五維圖表、特性描述、電刑道具
4. **屬性抗性顯示** - 8 大屬性格式化展示
5. **響應式設計** - 移動端優化
6. **主題樣式** - P5R 風格紅黑黃配色
7. **數據導出** - SQLite → JSON 自動轉換
8. **融合系統** - 二體合成計算機 (含寶魔加成)
9. **融合矩陣** - 23x23 Arcana 合成表
10. **特殊 Persona 過濾** - 排除無法合成的角色

### ⚠️ 已知問題
1. 爬蟲有 rate limiting (567 錯誤)，需要重試機制
2. 部分早期 Persona 缺少 trait/item 數據
3. 融合測試用例通過 6/6，但 wiki 可能顯示"逆推"食譜（與直接合成表不同）

---

## 6. 待實現功能 (Future)

1. **技能列表** - 每個 Persona 可學習的技能
2. **合成計算機** - 根據公式計算合成路徑
3. **Arcana 頁面** - 按 Arcana 分類查看
4. **詳情頁面** - 獨立的 URL 路由 (`/personas/:id`)
5. **數據對比** - 選擇多個 Persona 比較屬性

---

## 7. 爬蟲注意事項

### BWIKI 網站特點
- 使用複雜的 HTML table，`rowspan`/`colspan` 嵌套
- 有 rate limiting (HTTP 567 錯誤)
- 需要 User-Agent 偽裝
- 請求間隔需要 delay (3s-10s)

### URL 格式
- 正確: `https://wiki.biligame.com/persona/P5R/亞森`
- 錯誤: `/persona/index.php?title=...&redlink=1`

### 數據獲取邏輯 (`scrape-detail.js:104-113`)
```javascript
if (text === '特性') {
  const nextCell = $(cells[j + 1]);
  detail.trait = nextCell.text().trim() || null;
  const descCell = $(cells[j + 2]);  // 特性描述在第三格
  detail.trait_desc = descCell.text().trim() || null;
}
if (text === '電刑') {
  const nextCell = $(cells[j + 1]);
  detail.item_name = nextCell.text().trim() || null;
  // item_desc 需要從其他地方獲取
}
```

---

## 8. 交接清單

下次 AI 接手時需要：
1. [ ] 閱讀 `SPEC.md` 了解項目架構
2. [ ] 運行 `pnpm dev` 測試當前功能
3. [ ] 檢查 `lib/types.ts` 最新接口定義
4. [ ] 查看 `lib/personas.json` 確認數據結構
5. [ ] 閱讀 `components/PersonaModal.tsx` 了解 UI 實現

### 常用操作
```bash
# 更新數據後重新導出
pnpm export

# 補爬缺失數據
node scripts/scrape-missing.js

# 檢查數據庫狀態
node scripts/query.js "SELECT COUNT(*) FROM personas"
```
