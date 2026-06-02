import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'];

const result = spawnSync(command, args, {
  env: {
    ...process.env,
    VITE_BASE_PATH: '/Motivation-Blues/'
  },
  stdio: 'inherit'
});

if (result.error) {
  console.error(`Failed to run Pages build: ${result.error.message}`);
}

process.exit(result.status ?? 1);
