/**
 * Production build with GH_PAGES=true so Vite uses the GitHub Pages base path.
 * Avoids nested `npm run build`, which can drop env vars (especially on Windows).
 */
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env, GH_PAGES: 'true' }

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit', env })
}

run('npx tsc -b')
run('npx vite build')
