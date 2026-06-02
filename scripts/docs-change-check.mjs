import { spawnSync } from 'node:child_process';

const DOC_PREFIXES = ['Docs/', 'AGENTS.md', 'GEMINI.md', 'README.md'];

const CODE_PREFIXES = [
  'src/',
  'supabase/',
  '.github/workflows/',
  'scripts/',
  'package.json',
  'package-lock.json',
  'vite.config',
  'playwright.config'
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

const envBase = process.env.DOCS_CHECK_BASE;
const envHead = process.env.DOCS_CHECK_HEAD;
let changedFiles = [];

if (!envBase && !envHead) {
  const workingTreeDiff = runGit(['diff', '--name-only', 'HEAD']);
  if (workingTreeDiff.status === 0) {
    changedFiles = workingTreeDiff.stdout.split(/\r?\n/).map(normalizePath).filter(Boolean);
  }
}

if (changedFiles.length === 0) {
  const base = envBase && !/^0+$/.test(envBase) ? envBase : getDefaultBase();
  const head = envHead || 'HEAD';

  if (!base) {
    console.warn('::warning::Docs freshness check skipped: no previous commit is available.');
    process.exit(0);
  }

  const diff = runGit(['diff', '--name-only', base, head]);
  if (diff.status !== 0) {
    console.warn(`::warning::Docs freshness check skipped: ${diff.stderr.trim()}`);
    process.exit(0);
  }

  changedFiles = diff.stdout.split(/\r?\n/).map(normalizePath).filter(Boolean);
}

const codeChanged = changedFiles.some((file) => hasPrefix(file, CODE_PREFIXES));
const docsChanged = changedFiles.some((file) => hasPrefix(file, DOC_PREFIXES));

if (codeChanged && !docsChanged) {
  console.warn(
    '::warning::Code changed without docs updates. Check Docs/PROJECT_MEMORY.md, Docs/TASKS.md, Docs/TRACEABILITY.md, and relevant ADRs.'
  );
}

process.exit(0);
