## 1. 資料庫基礎建設

- [ ] 1.1 建立 `scripts/init-db.js` 以定義新的正規化 Schema (arcanas, elements, skills, personas, persona_skills)。
- [ ] 1.2 填充 `arcanas` 靜態資料。
- [ ] 1.3 填充 `elements` 靜態資料（物理, 槍械, 火焰, 冰凍, 電擊, 疾風, 念動, 核熱, 祝福, 咒怨, 異常, 恢復, 輔助, 萬能, 被動）。

## 2. 爬蟲重構 (Skills)

- [ ] 2.1 建立 `scripts/scrape-skills.js` 從 BWIKI 技能列表抓取所有技能。
- [ ] 2.2 實現技能名稱的繁簡轉換處理。
- [ ] 2.3 將抓取到的技能資料填充至 `skills` 表，並建立與 `elements` 的關聯。

## 3. 爬蟲重構 (Personas)

- [ ] 3.1 建立 `scripts/scrape-personas-new.js` 以抓取面具詳情。
- [ ] 3.2 修正技能關聯邏輯：根據面具頁面的技能名稱尋找 `skills` 表中的 ID。
- [ ] 3.3 將面具基本資料、特性、電刑道具與技能關聯填充至新資料庫。

## 4. 資料匯出與整合

- [ ] 4.1 更新 `scripts/export-json.js` 以執行多表 Join 並匯出新的 `lib/personas.json`。
- [ ] 4.2 確保 JSON 結構向下相容或同步更新 `lib/types.ts`。
- [ ] 4.3 重新執行反向合成抓取與合併腳本。

## 5. 前端適配與測試

- [ ] 5.1 更新 `lib/types.ts` 中的介面定義。
- [ ] 5.2 修正 `PersonaModal.tsx` 與 `PersonaCard.tsx` 的資料讀取路徑。
- [ ] 5.3 執行 `pnpm test` 並驗證合成路徑搜尋功能是否正常。
