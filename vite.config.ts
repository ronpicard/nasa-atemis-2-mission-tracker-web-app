import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function readGhPagesBaseFromPackage(): string | undefined {
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      config?: { gh_pages_base?: string }
    }
    return pkg.config?.gh_pages_base
  } catch {
    return undefined
  }
}

// GitHub project pages need a subpath (e.g. /my-repo/). Set package.json → config.gh_pages_base.
// `npm_package_config_*` is only set when npm runs a script; also read package.json for robustness.
const ghBase =
  process.env.npm_package_config_gh_pages_base || readGhPagesBaseFromPackage()
const base =
  process.env.GH_PAGES === 'true' && ghBase && ghBase !== '/'
    ? ghBase.endsWith('/')
      ? ghBase
      : `${ghBase}/`
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
