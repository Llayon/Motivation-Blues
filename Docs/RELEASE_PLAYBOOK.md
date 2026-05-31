# Release Playbook

## Local Verification
```bash
npm test
npm run test:e2e
npm run build
```

GitHub Pages base-path verification:
```powershell
$env:VITE_BASE_PATH='/Motivation-Blues/'
npm run build
Remove-Item Env:\VITE_BASE_PATH
```

## Database Changes
1. Add a new migration under `supabase/migrations/`.
2. Run `npx supabase migration list`.
3. Run `npx supabase db push`.
4. Run `npx supabase migration list` again.

## Deploy
1. Commit changes.
2. Push to `main`.
3. Watch GitHub Actions:
```bash
gh run list --repo Llayon/Motivation-Blues --limit 3
gh run watch <run-id> --repo Llayon/Motivation-Blues --exit-status
```
4. Verify production:
```powershell
(Invoke-WebRequest -UseBasicParsing https://llayon.github.io/Motivation-Blues/).StatusCode
```

## After Release
- Update `Docs/PROJECT_MEMORY.md` for significant changes.
- Update `Docs/TASKS.md` if tasks were completed or added.
- Note remaining warnings, especially bundle-size warnings.
