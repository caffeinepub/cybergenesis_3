# CyberGenesis Marketplace Refactor

## Current State
- `src/frontend/src/components/Marketplace.tsx` — монолит 1972 строки, содержит все субкомпоненты инлайн
- `src/frontend/src/hooks/useQueries.ts` — `useGetAllActiveListings` имеет `refetchOnWindowFocus: true`
- `src/frontend/src/hooks/useMarketplaceActor.ts` — нет 8-секундного fallback, UI может висеть бесконечно пока идёт retry
- В маркетплейсе контент рендерится условно по activeTab (вызывает React Query re-trigger при переключении)

## Requested Changes (Diff)

### Add
- Папка `src/frontend/src/components/marketplace/` со следующими файлами:
  - `MarketplaceTypes.ts` — все типы, интерфейсы, константы, хелперы
  - `FilterDrawer.tsx` — компонент FilterDrawer
  - `InspectorModal.tsx` — компонент InspectorModal (7x7 grid)
  - `LandCard.tsx` — компонент LandCard
  - `ModCard.tsx` — компонент ModCard
  - `CreateListingModal.tsx` — компонент CreateListingModal
  - `Marketplace.tsx` — корневой компонент (хуки, стейт, хендлеры, рендер)

### Modify
- `src/frontend/src/components/Marketplace.tsx` → заменить на re-export из `./marketplace/Marketplace`
- `src/frontend/src/hooks/useQueries.ts` → Fix 1: refetchOnWindowFocus: false
- `src/frontend/src/hooks/useMarketplaceActor.ts` → Fix 2: 8-секундный fallback
- `src/frontend/src/components/marketplace/Marketplace.tsx` → Fix 3: CSS display вместо условного рендера, Fix 4: убрать key на activeTab

### Remove
- Весь инлайн код субкомпонентов из старого Marketplace.tsx (переносится в отдельные файлы)

## Implementation Plan
1. Создать MarketplaceTypes.ts с экспортом всех типов, констант, хелперов из оригинала
2. Создать FilterDrawer.tsx с компонентом 1:1
3. Создать InspectorModal.tsx с компонентом 1:1
4. Создать LandCard.tsx с компонентом 1:1
5. Создать ModCard.tsx с компонентом 1:1
6. Создать CreateListingModal.tsx с компонентом 1:1
7. Создать marketplace/Marketplace.tsx — только корневой компонент, с Fix 3 (CSS display) и Fix 4 (нет key на activeTab)
8. Заменить src/components/Marketplace.tsx на re-export
9. Fix 1 в useQueries.ts: refetchOnWindowFocus: true → false
10. Fix 2 в useMarketplaceActor.ts: 8-секундный setTimeout fallback
