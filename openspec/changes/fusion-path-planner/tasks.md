## 1. Data Layer - Fusion Matrix

- [x] 1.1 Create `lib/fusion-matrix.ts` with the 22x22 Arcana fusion table
- [x] 1.2 Create `lib/treasure-demons.ts` with treasure demon level modifiers
- [x] 1.3 Create `lib/persona-index.ts` with helper functions for querying Personas by Arcana, level, skill, trait

## 2. Core Algorithm - Fusion Path Finding

- [x] 2.1 Implement `calculateFusionResult(arcanaA, arcanaB)` function
- [x] 2.2 Implement `calculateFusionPrice(personas, treasureDemon?)` function
- [x] 2.3 Implement `findFusionPaths(targetPersona, options)` with BFS algorithm
- [x] 2.4 Add memoization/caching for performance optimization

## 3. UI Components - Fusion Planner

- [x] 3.1 Create `components/FusionSearch.tsx` - target Persona search dropdown
- [x] 3.2 Create `components/SkillFilter.tsx` - skill selection modal
- [x] 3.3 Create `components/TraitFilter.tsx` - trait selection modal
- [x] 3.4 Create `components/FusionPathCard.tsx` - single path display card
- [x] 3.5 Create `components/FusionPathList.tsx` - list of all paths

## 4. Page Integration

- [x] 4.1 Create `app/fusion/page.tsx` - main fusion planner page
- [x] 4.2 Add navigation link to fusion page from header
- [ ] 4.3 Test responsive layout on mobile

## 5. Testing & Optimization

- [ ] 5.1 Test path finding with various target Personas
- [ ] 5.2 Verify skill/trait filtering works correctly
- [ ] 5.3 Performance test - ensure results return within 3 seconds
- [ ] 5.4 Fix any edge cases or bugs discovered during testing
