## Context

目前專案使用 SQLite 儲存資料，但在執行 `pnpm export` 時會產生一個巨大的 `personas.json`。現有的 JSON 結構中，每個 Persona 都包含完整的技能物件數組（包含重複的描述文字），這導致檔案體積過大且資料一致性難以維護。

## Goals / Non-Goals

**Goals:**
- 將資料庫正規化為 `arcanas`, `elements`, `skills`, `personas`, `persona_skills` 表格。
- 實現獨立的技能爬蟲，從 BWIKI 技能列表獲取權威數據。
- 減小 `personas.json` 體積，改為引用技能 ID 或精簡結構。
- 提升爬蟲穩定性，解決因個別面具頁面結構變異導致的資料缺失。

**Non-Goals:**
- 改變現有的合成演算法核心邏輯（僅調整資料獲取方式）。
- 重新設計 UI 視覺風格。

## Decisions

### 1. 資料庫 Schema 正規化
- **arcanas**: `id`, `name_cn`, `name_tw`, `order_index`
- **elements**: `id`, `name_cn`, `name_tw` (如 物理, 火焰, 恢復...)
- **skills**: `id`, `element_id` (FK), `name_cn`, `name_tw`, `cost`, `description_cn`, `description_tw`
- **personas**: `id`, `arcana_id` (FK), `name_cn`, `name_en`, `name_jp`, `level`, `stats...`
- **persona_skills**: `persona_id` (FK), `skill_id` (FK), `unlock_level`

**Rationale**: 這樣做可以確保「恢復」屬性的定義在全域只有一份，且技能描述不再隨著面具重複儲存。

### 2. 爬蟲策略調整
- **Stage 1**: 執行 `scripts/scrape-skills.js`。抓取所有屬性與技能，填充 `elements` 與 `skills` 表。
- **Stage 2**: 執行 `scripts/scrape-personas.js`。抓取面具基本屬性與其學會的「技能名稱」，透過名稱關聯回 `skills` 表。

**Rationale**: 技能列表頁面結構統一，適合一次性獲取完整定義；面具頁面只需負責「關係」的建立。

### 3. JSON 匯出格式
- 匯出的 `personas.json` 依然會包含必要的技能資訊以便前端渲染，但會透過腳本在匯出時進行 Join，確保匯出的資料是經過繁簡轉換後的最終狀態。

## Risks / Trade-offs

- **[Risk]**: 部分舊面具的技能名稱可能與技能列表不完全匹配（如標點符號差異）。
- **[Mitigation]**: 在關聯時使用模糊匹配或建立 `name_aliases` 對應表。
- **[Trade-off]**: 資料庫查詢變複雜（需多表 Join），但考慮到是靜態匯出 JSON，這不影響執行期效能。

## Migration Plan

1. 備份現有的 `personas.db`。
2. 建立 `scripts/init-new-db.js` 初始化新 Schema。
3. 實作並執行新爬蟲。
4. 更新 `scripts/export-json.js`。
5. 全面測試前端功能。
