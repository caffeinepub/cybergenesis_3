# CyberGenesis Guide — Content & Structure Updates

## Current State
Guide.tsx has LAND NFT section with a BIOMES multiplier table followed by biome land images. MODS section has rarity badges + 7×7 slot grid + tier legend. CACHES section shows 3 cache cards with CBR cost labels only. TechnicalDetails.tsx has 4 basic entries.

## Requested Changes (Diff)

### Add
- Rarity label (Common / Rare / Mythic) on each biome land card in the LAND section
- Energy cost values to each cache card (Low/Medium/High alongside CBR)
- Contents description to each cache card (Common: first 3 tiers; Rare: all tiers; Legendary: all tiers including Mythic) + mention boosters and crystals in all
- 3 new entries in TechnicalDetails: 4 canisters, all data on-chain, ownership on-chain

### Modify
- LAND section: remove BIOMES multiplier table, move biome land images block to where the table was (directly after the intro paragraph), add rarity badge on each land card
- MODS section: remove the 7x7 grid block and its tier legend below it (keep rarity badges above and sample mod cards)
- CACHE_TYPES constant: add energyCost and contents fields
- Cache card rendering: show both CBR cost and energy cost; show contents list
- TechnicalDetails: add entries for 4 canisters and full on-chain data

### Remove
- BIOMES multiplier table from LAND section
- 7×7 grid (GRID_CELLS) block and its tier legend from MODS section

## Implementation Plan
1. Update CACHE_TYPES constant with energyCost and contents arrays
2. Remove BIOMES table JSX from LAND section; move biome images block directly after intro paragraph; add rarity badge on each land card
3. Remove the 7×7 grid block + tier legend from MODS section
4. Update cache card rendering to show energy cost and contents
5. Update TechnicalDetails.tsx with 3 new entries about on-chain architecture and 4 canisters
