# ADR 0006: Lazy 3D Code Splitting

## Status

Accepted.

## Decision

Load capsule and collection screens with `React.lazy` so R3F/Three code is fetched only when the user opens the reward surfaces. Keep the initial dashboard/editor bundle below the default Vite 500 kB warning target, and set Vite's `chunkSizeWarningLimit` to 900 kB for the intentional lazy 3D chunk.

## Context

The writing flow should start quickly and should not pay the cost of 3D reward rendering before the user opens capsules or the collection. Three/R3F is large, but it is not needed for the auth, dashboard, editor, bank, season, or export views.

## Consequences

- Initial route code no longer imports capsule/collection components synchronously.
- Reward screens show small text fallbacks while their chunks load.
- The main app chunk stays below 500 kB in the production build.
- The 3D chunk remains large by design; the warning limit documents that this cost is deferred and intentional.
- Future 3D work should preserve this split and avoid importing R3F from always-loaded views.

## Verification

- `npm run build`
- `npm run verify:pages`
- Build output shows a separate `VoxelShowcase` chunk and a main `index` chunk below 500 kB.
