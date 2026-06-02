# Risk Register

## Magic Link Redirect

Risk: Supabase redirects user to wrong path and the app does not hydrate session.
Mitigation: Keep `https://llayon.github.io/Motivation-Blues/` in `supabase/config.toml` and use `import.meta.env.BASE_URL` when creating magic links.

## RLS Regression

Risk: users can access another user's rows.
Mitigation: keep owner-based policies and avoid service-role frontend usage.

## Autosave Regression

Risk: editor loses active text or restores stale text after banking.
Mitigation: keep IndexedDB buffer, ordered writes, and clear buffer on successful bank/new editor.

## Cloud Hydration Stall

Risk: Supabase Auth or REST requests hang and leave the user on the startup loader.
Mitigation: bound cloud hydration with a short timeout, preserve local state when available, run later refreshes in background, and expose retry from the Auth gate.

## Large JS Bundle

Risk: Three/R3F inflate initial load.
Mitigation: lazy-load capsule and collection screens.

## GitHub Pages Subpath

Risk: assets break because Vite base path is wrong.
Mitigation: keep `VITE_BASE_PATH=/Motivation-Blues/` in workflow and verify Pages build locally.

## Applied Migration Editing

Risk: editing old migrations diverges local and remote schema history.
Mitigation: add new migrations only.
