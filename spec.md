# CyberGenesis

## Current State
Marketplace is visually complete but all 4 marketplace hooks are stubs (`enabled: false` / `throw`). The `useMarketplaceActor` is fully built but never called. No `getLandDataById` public backend method exists. Inspector 7x7 places mods by array index, not by real modifierInstanceId. `useRemoveModifier` does not invalidate `activeListings`. Russian strings remain in hooks. `getLandDataForListing` only searches `myLands` (own lands), so foreign sellers' inspector shows empty.

## Requested Changes (Diff)

### Add
- `getLandDataById(landId: Nat)` public query in `main.mo` — iterates all lands, returns `?LandData`
- `getLandDataById` to `backend.did.js` (idlService + idlFactory) and `backend.d.ts`
- `useGetPublicLandDataBatch(landIds: bigint[])` hook — parallel `getLandDataById` calls, returns `Map<string, LandData>`
- PATH B reactive update: `invalidateQueries(["activeListings"])` + `invalidateQueries(["publicLandDataBatch"])` in `useRemoveModifier.onSuccess`

### Modify
- `useGetAllActiveListings` — remove stub, wire to `marketplaceActor.getAllActiveListings()`, add 30s poll + `refetchOnWindowFocus`
- `useListItem` — wire to `marketplaceActor.list_item()`
- `useBuyItem` — wire to `marketplaceActor.buy_item()`, invalidate `landData`, `modifierInventory`, `tokenBalance`, `publicLandDataBatch`
- `useCancelListing` — wire to `marketplaceActor.cancelListing()`
- All Russian toast strings → English throughout `useQueries.ts`
- Inspector 7x7: `mods[i]` → `mods.find(m => Number(m.modifierInstanceId) === i + 1)` for exact slot positioning
- `getLandDataForListing` in Marketplace — check `publicLandDataMap` first, fallback to `myLands`
- Marketplace component: extract land listing IDs, call `useGetPublicLandDataBatch`

### Remove
- Stub `throw new Error("not yet implemented")` from all 4 marketplace hooks
- `enabled: false` from `useGetAllActiveListings`

## Implementation Plan
1. Add `getLandDataById` to `main.mo` after `getAllLandsPublic`
2. Add `getLandDataById` to `backend.did.js` both sections
3. Add `getLandDataById` to `backend.d.ts`
4. Rewrite marketplace section of `useQueries.ts` with live actor calls
5. Add `useGetPublicLandDataBatch` to `useQueries.ts`
6. Update `useRemoveModifier` invalidations
7. Translate all Russian strings in `useQueries.ts`
8. Fix inspector slot in `Marketplace.tsx`
9. Add `useGetPublicLandDataBatch` usage + update `getLandDataForListing` in `Marketplace.tsx`
