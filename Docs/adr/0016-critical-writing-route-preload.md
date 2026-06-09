# ADR 0016: Critical Writing Route Preload

## Status

Accepted.

## Decision

Keep route-level code splitting for product views, but preload the critical writing route chunks
(`Dashboard`, `ZenEditor`, and `Bank`) after the first paint once persisted local state is ready.

Do not preload reward/3D routes (`CapsuleQueue`, `Collection`, or `VoxelShowcase`) from the startup
path. Those chunks remain deferred by design.

## Context

Production timing on GitHub Pages showed that the first editor or bank click could intermittently
wait 15-20 seconds on tiny lazy chunks even though the app shell itself loaded. The slow samples were
resource timing delays for the `ZenEditor` and formatting chunks, not Supabase or React state.

The writing flow is the core product path, so the user should not pay lazy chunk delivery cost on
the first deliberate writing click. At the same time, the initial bundle must stay lean and must not
pull in Three/R3F reward surfaces.

## Consequences

- The landing/static shell still does not eagerly include editor or bank code in the initial Vite
  bundle.
- Critical writing chunks are warmed in the background immediately after startup.
- First dashboard/editor/bank transitions should become consistently sub-second after the landing
  page has painted.
- 3D reward chunks stay lazy and outside the writing startup path.
- Production performance should be checked after deploy because GitHub Pages/CDN behavior can vary.

## Verification

- `npm run quality`
- `npm run verify:pages`
- `npm run test:prod-smoke`
- Manual Playwright production timing for cold app shell and first editor/bank transitions.
