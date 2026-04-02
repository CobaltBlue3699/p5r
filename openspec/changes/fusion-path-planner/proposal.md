## Why

玩家需要規劃合成路徑來獲得目標面具及其技能/特性。目前網站只有數據查詢功能，缺乏合成規劃工具。這個功能可以幫助玩家：
1. 找到達到目標面具的最短路徑
2. 確保習得特定技能或特性
3. 評估不同合成方案的代價

## What Changes

- 新增合成規劃頁面 (`/fusion`)
- 目標選擇：玩家選擇目標面具
- 條件過濾：選擇目標技能或特性
- 路徑計算：使用動態規劃計算最優合成路徑
- 結果展示：顯示所有可能路徑及代價

## Capabilities

### New Capabilities
- `fusion-path-finding`: 合成路徑搜尋引擎，使用動態規劃演算法
- `fusion-ui`: 合成規劃頁面，包含目標選擇、路徑展示
- `fusion-data`: 處理合成矩陣、寶魔加成、價格計算

### Modified Capabilities
- 無

## Impact

- 新增頁面：`app/fusion/page.tsx`
- 新增組件：`components/FusionPlanner.tsx`, `components/FusionPathCard.tsx`
- 新增工具函數：`lib/fusion.ts` (合成計算邏輯)
- 數據變更：需要在數據庫中存儲合成矩陣
