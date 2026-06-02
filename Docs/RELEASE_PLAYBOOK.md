# Release Playbook

## Local Verification
```bash
npm run verify
npm run adr:check
```

For full pre-release verification:

```bash
npm run verify:full
```

After committing, verify the commit message:

```bash
npm run commitlint:last
```

GitHub Pages base-path verification:
```bash
npm run verify:pages
```

## Database Changes
1. Add a new migration under `supabase/migrations/`.
2. Run `npx supabase migration list`.
3. Run `npx supabase db push`.
4. Run `npx supabase migration list` again.

## Deploy
1. Commit changes.
2. Use a Conventional Commit subject, for example `feat: add bank search`.
3. Run `npm run commitlint:last`.
4. Run `npm run adr:check` for architecture-sensitive changes.
5. Push to `main`.
6. Watch GitHub Actions:
```bash
gh run list --repo Llayon/Motivation-Blues --limit 3
gh run watch <run-id> --repo Llayon/Motivation-Blues --exit-status
```
7. Verify production:
```powershell
(Invoke-WebRequest -UseBasicParsing https://llayon.github.io/Motivation-Blues/).StatusCode
```

## After Release
- Update `Docs/PROJECT_MEMORY.md` for significant changes.
- Update `Docs/TASKS.md` if tasks were completed or added.
- Update `Docs/HANDOFF.md` if the next task or risk state changed.
- Note remaining warnings, especially bundle-size warnings.
