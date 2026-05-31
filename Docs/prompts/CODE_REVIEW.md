# Code Review Prompt

Review the current diff for Motivation Blues.

Focus on:
- Bugs and regressions.
- Supabase RLS or RPC risks.
- IndexedDB autosave data-loss risks.
- GitHub Pages base-path or auth redirect risks.
- Missing tests or manual QA gaps.
- Bundle-size impact if 3D imports changed.

Return findings first, ordered by severity, with file and line references.
