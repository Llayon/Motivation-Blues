import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|mjs|cjs)$/;

const RULES = [
  {
    name: 'Components must not import the Supabase client directly',
    matchesFile: (file) => file.startsWith('src/components/'),
    matchesImport: (specifier) => specifier.includes('/services/supabase')
  },
  {
    name: 'Lib modules must not import UI, store, or services',
    matchesFile: (file) => file.startsWith('src/lib/') && !file.includes('.test.'),
    matchesImport: (specifier) =>
      specifier.includes('/components/') ||
      specifier.includes('/store/') ||
      specifier.includes('/services/')
  },
  {
    name: 'Store modules must not import UI components',
    matchesFile: (file) => file.startsWith('src/store/'),
    matchesImport: (specifier) => specifier.includes('/components/')
  },
  {
    name: 'Services must not import UI or store modules',
    matchesFile: (file) => file.startsWith('src/services/'),
    matchesImport: (specifier) =>
      specifier.includes('/components/') || specifier.includes('/store/')
  },
  {
    name: 'Static data must not import runtime state, services, or UI',
    matchesFile: (file) => file.startsWith('src/data/'),
    matchesImport: (specifier) =>
      specifier.includes('/store/') ||
      specifier.includes('/services/') ||
      specifier.includes('/components/')
  },
  {
    name: 'Scripts must not import app runtime modules',
    matchesFile: (file) => file.startsWith('scripts/'),
    matchesImport: (specifier) => specifier.includes('/src/')
  }
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
    .filter((file) => SOURCE_EXTENSIONS.test(file))
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('dist/'));
}

function normalizeSpecifier(specifier, file) {
  if (!specifier.startsWith('.')) {
    return specifier;
  }

  const segments = file.split('/');
  segments.pop();

  for (const part of specifier.split('/')) {
    if (part === '.' || part === '') {
      continue;
    }

    if (part === '..') {
      segments.pop();
      continue;
    }

    segments.push(part);
  }

  return segments.join('/');
}

function findImports(source) {
  const imports = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]+\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

const violations = [];

for (const file of listFiles()) {
  const source = readFileSync(file, 'utf8');
  const imports = findImports(source).map((specifier) => normalizeSpecifier(specifier, file));

  for (const rule of RULES) {
    if (!rule.matchesFile(file)) {
      continue;
    }

    for (const specifier of imports) {
      if (rule.matchesImport(specifier)) {
        violations.push({ file, rule: rule.name, specifier });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary check failed:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.rule} (${violation.specifier})`);
  }
  process.exit(1);
}

console.log('Architecture boundary check passed.');
