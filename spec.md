# CyberGenesis

## Current State
- LandingPage.tsx has outdated text: 'COMPOSABLE LAND NFT' (without Collectible), 'independent NFT' for mods, no on-chain mention in COMPOSABLE LAND NFT section, 4 ecosystem cards (no CYBER MAP, no CRAFTING)
- Guide.tsx: missing on-chain accent in MAP section, missing ENERGY SYSTEM block in CACHES, missing CRAFTING section, missing ICRC-7 mention in TECHNICAL, 'real on-chain asset' wording for mods, no Keeper crafting tip, no on-chain phrase in MARKETPLACE

## Requested Changes (Diff)

### Add
- LandingPage ECOSYSTEM: 2 new cards — CYBER MAP and CRAFTING
- Guide: new CRAFTING section (between CACHES and CBR TOKEN)
- Guide CACHES: ENERGY SYSTEM info block
- Guide CYBER MAP: on-chain data sentence
- Guide MARKETPLACE: on-chain transactions sentence
- Guide LAND callout: on-chain coordinates phrase
- Guide MODS: Keeper crafting tip box
- Guide TECHNICAL: ICRC-7 standard note

### Modify
- LandingPage HERO: 'COMPOSABLE LAND NFT' → 'COMPOSABLE COLLECTIBLE LAND NFT'
- LandingPage COMPOSABLE LAND NFT section: add on-chain sentence
- LandingPage MODS section: 'independent NFT' → 'unique collectible on-chain object'
- Guide LAND NFT title/callout: add 'Composable Collectible'
- Guide MODS: 'real on-chain asset' → 'unique collectible on-chain object'
- Guide NAV: add CRAFTING item

### Remove
- Nothing structural removed

## Implementation Plan
1. Edit LandingPage.tsx — 4 text changes + 2 new ECOSYSTEM cards
2. Edit Guide.tsx — 7 text changes + new CRAFTING section + update NAV_ITEMS
