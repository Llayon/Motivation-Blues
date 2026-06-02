import { spawnSync } from 'node:child_process';

const ADR_PREFIX = 'Docs/adr/';

const ARCHITECTURE_SENSITIVE_PREFIXES = [
  '.github/workflows/',
  'scripts/',
  'supabase/',
  'src/App.tsx',
  'src/main.tsx',
  'src/services/',
  'src/store/',
  'src/lib/editorBuffer',
  'src/lib/cloudHydration',
  'src/types.ts',
  'vite.config',
  'playwright.config'
];

const ARCHITECTURE_SENSITIVE_DOCS = [
  'Docs/ARCHITECTURE.md',
  'Docs/BOUNDARIES.md',
  'Docs/DATA_CONTRACTS.md',
  'Docs/RELEASE_PLAYBOOK.md',
  'Docs/adr/README.md',
  'Docs/templates/ADR.md'
];

function runGit(args) {
  return spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function normalizePath(path) {
  return path.replaceAll('\\', '/').trim();
}

function hasPrefix(path, prefixes) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(prefix));
}

function getDefaultBase() {
  const result = runGit(['rev-parse', '--verify', 'HEAD~1']);
  return result.status === 0 ? result.stdout.trim() : null;
}

function getChangedFiles() {
  const envBase = process.env.ADR_CHECK_BASE;
  const envHead = process.env.ADR_CHECK_HEAD;

  if (!envBase && !envHead) {
    const workingTreeDiff = runGit(['diff', '--name-only', 'HEAD']);
    const untrackedFiles = runGit(['ls-files', '--others', '--exclude-standard']);
    const output = [
      workingTreeDiff.status === 0 ? workingTreeDiff.stdout : '',
      untrackedFiles.status === 0 ? untrackedFiles.stdout : ''
    ]
      .filter(Boolean)
      .join('\n');

    if (output.trim()) {
      return output.split(/\r?\n/).map(normalizePath).filter(Boolean);
    }
  }

  const base = envBase && !/^0+$/.test(envBase) ? envBase : getDefaultBase();
  const head = envHead || 'HEAD';

  if (!base) {
    console.warn('ADR check skipped: no previous commit is available.');
    return [];
  }

  const diff = runGit(['diff', '--name-only', base, head]);
  if (diff.status !== 0) {
    console.warn(`ADR check skipped: ${diff.stderr.trim()}`);
    return [];
  }

  return diff.stdout.split(/\r?\n/).map(normalizePath).filter(Boolean);
}

const changedFiles = getChangedFiles();
const adrChanged = changedFiles.some((file) => file.startsWith(ADR_PREFIX));
const architectureSensitiveChanges = changedFiles.filter(
  (file) =>
    hasPrefix(file, ARCHITECTURE_SENSITIVE_PREFIXES) || ARCHITECTURE_SENSITIVE_DOCS.includes(file)
);

if (architectureSensitiveChanges.length > 0 && !adrChanged) {
  console.error('ADR check failed: architecture-sensitive files changed without an ADR update.');
  console.error('Changed architecture-sensitive files:');
  for (const file of architectureSensitiveChanges) {
    console.error(`- ${file}`);
  }
  console.error('Add or update an ADR under Docs/adr/, or narrow the change if no ADR is needed.');
  process.exit(1);
}

console.log('ADR check passed.');
