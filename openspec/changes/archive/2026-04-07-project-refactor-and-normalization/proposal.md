## Why

目前的資料結構存在嚴重的冗餘與不穩定性。Arcana 資訊散落在面具表中，技能資料從各個面具詳情頁抓取導致解析困難且易出錯（SKILLS:0 問題）。透過資料庫正規化與集中化技能抓取，能提升系統穩定性、簡化合成算法邏輯，並為後續功能開發（如按屬性搜尋技能）奠定堅實基礎。

## What Changes

- **資料庫正規化**: 將 Arcana (塔羅牌)、Skills (技能) 與 Elements (屬性) 拆分為獨立表格。
- **面具關聯**: Persona 表將透過外鍵 (Foreign Key) 關聯到 Arcana 表。
- **技能系統升級**: 技能將有關聯的屬性，且技能與面具的關係改為多對多 (或透過中間表 `persona_skills`)。
- **抓取邏輯重構**: 
    - 建立新的爬蟲腳本，從 [技能列表](https://wiki.biligame.com/persona/P5R%E6%8A%80%E8%83%BD%E5%88%97%E8%A1%A8) 抓取完整技能庫。
    - 面具頁面僅抓取「面具學會哪些技能」的名稱與等級對應，不重複抓取技能描述。
- **BREAKING**: 移除舊有的 `personas.db` 結構與 `lib/personas.json` 的平面化技能欄位。

## Capabilities

### New Capabilities
- `database-normalization`: 定義新的 SQLite Schema (Arcana, Skills, Elements, Personas)。
- `centralized-skill-scraper`: 實作從技能列表頁面抓取完整技能資料的爬蟲。
- `data-migration-strategy`: 將現有資料遷移至新結構的工具或腳本。

### Modified Capabilities
- `persona-data-source`: 修改 `lib/personas.json` 的產生方式，以符合新的正規化結構。
- `fusion-engine-update`: 調整 `lib/fusion.ts` 以適應新的資料關聯查詢。

## Impact

- **Database**: `data/personas.db` 的 Schema 將發生重大變更。
- **Library**: `lib/types.ts` 中的介面定義需全面更新。
- **Scripts**: 幾乎所有的 `scripts/` 下的爬蟲與匯出工具都需調整。
- **Frontend**: `PersonaCard` 與 `PersonaModal` 等組件的資料讀取邏輯需配合 JSON 結構變更進行修正。
