import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function readPackageVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(new URL('./package.json', import.meta.url), 'utf8')
    );
    return typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readBuildSha() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }

  try {
    return execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  define: {
    __APP_BUILD_SHA__: JSON.stringify(readBuildSha()),
    __APP_VERSION__: JSON.stringify(readPackageVersion())
  },
  plugins: [react()],
  build: {
    // R3F/Three is lazy-loaded behind capsule/collection screens; keep the initial chunk below 500 kB.
    chunkSizeWarningLimit: 900
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
