import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const budgets = [
  { pattern: /^src\/components\/.*\.tsx$/, lines: 350, label: 'component' },
  { pattern: /^src\/components\/.*\.ts$/, lines: 400, label: 'component helper' },
  { pattern: /^src\/lib\/[^/]+\.ts$/, lines: 250, label: 'lib module' },
  { pattern: /^src\/store\/[^/]+\.ts$/, lines: 650, label: 'store module' },
  { pattern: /^scripts\/[^/]+\.mjs$/, lines: 250, label: 'script' },
  { pattern: /^src\/.*\.css$/, lines: 700, label: 'stylesheet' }
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

function listFiles() {
  const tracked = runGit(['ls-files']);
  const untracked = runGit(['ls-files', '--others', '--exclude-standard']);
  const output = [tracked.stdout, untracked.stdout].filter(Boolean).join('\n');

  return output
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean)
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('dist/'));
}

const warnings = [];

for (const file of listFiles()) {
  const budget = budgets.find((entry) => entry.pattern.test(file));
  if (!budget) {
    continue;
  }

  const lineCount = readFileSync(file, 'utf8').split(/\r?\n/).length;
  if (lineCount > budget.lines) {
    warnings.push({ file, lineCount, budget });
  }
}

if (warnings.length === 0) {
  console.log('Size budget check passed.');
  process.exit(0);
}

console.warn('Size budget warnings:');
for (const warning of warnings) {
  console.warn(
    `- ${warning.file}: ${warning.lineCount} lines, ${warning.budget.label} budget is ${warning.budget.lines}`
  );
}

if (process.env.SIZE_BUDGET_STRICT === '1') {
  process.exit(1);
}

console.warn('Size budget is currently advisory. Set SIZE_BUDGET_STRICT=1 to fail on warnings.');
