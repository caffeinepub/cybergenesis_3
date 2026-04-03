# CyberGenesis

## Current State
- Marketplace architecture uses external canister: `useMarketplaceActor.ts` points to stub ID, `marketplace-backend.d.ts/idl.ts` define external IDL, `transferLand`/`transferModifier`/`getLandOwner` are public but gated by `caller == marketplaceCanister`
- No `Listing` type or marketplace methods (`list_item`, `buy_item`, `cancelListing`, `getAllActiveListings`) exist in `main.mo`
- `gReceiveIncome` uses old distribution: 40% stakers / 25% treasury / 15% dev / 20% burn
- New users start with `cycleCharge = 0` — cannot open any cache immediately
- Staking Boost in LandDashboard is static string based only on biome
- `formatWeight` in GovernanceTypes.ts uses `.toFixed(4)` — 4 decimal places

## Requested Changes (Diff)

### Add
- `Listing` type in main.mo: `{ listingId: Nat; itemId: Nat; itemType: Text; seller: Principal; price: Nat; isActive: Bool }`
- `var listings: Map<Nat, Listing>` and `var nextListingId: Nat`
- Private `transferLandInternal(to, landId)` and `transferModifierInternal(from, to, instanceId)` — no caller guard
- Public `list_item(itemId, itemType, price)` — seller must own item
- Public `buy_item(listingId)` — buyer != seller, calls internal transfer
- Public `cancelListing(listingId)` — only seller can cancel
- Public `getAllActiveListings()` — query, returns all active listings
- Public `getUserListings(user)` — query
- 10% insurance reserve: `var gInsuranceReserve: Nat`
- Starter energy 600 for new users

### Modify
- `gReceiveIncome`: 35% stakers / 20% treasury / 20% dev / 15% burn / 10% insurance
- `getLandData`: `cycleCharge = 600` on first registration
- Remove marketplace canister guard from `getLandOwner` — make it public query no auth
- Keep `setMarketplaceCanister`, `transferLand`, `transferModifier` as-is for backward compat but they become unused
- `backend.d.ts` + `declarations/backend.did.d.ts` + `declarations/backend.did.js`: add new marketplace method signatures

### Remove
- Nothing removed in Stage 1 (frontend files removed in Stage 2)

## Implementation Plan
1. Add `Listing` type and state vars to main.mo
2. Add `transferLandInternal` and `transferModifierInternal` private functions
3. Add `list_item`, `buy_item`, `cancelListing`, `getAllActiveListings`, `getUserListings` public functions
4. Update `gReceiveIncome` to new 35/20/20/15/10 distribution + `gInsuranceReserve`
5. Update `getLandData` initial `cycleCharge` to 600
6. Make `getLandOwner` a public query without marketplace canister guard
7. Sync all changes to `.old/src/backend/main.mo`
8. Update `backend.d.ts` with new types and methods
9. Update `declarations/backend.did.d.ts` and `declarations/backend.did.js` with new IDL
