import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub project pages need a subpath (e.g. /my-repo/). Set in package.json → config.gh_pages_base
// and run deploy via npm run deploy (sets GH_PAGES=true for that build only).
const ghBase = process.env.npm_package_config_gh_pages_base
const base =
  process.env.GH_PAGES === 'true' && ghBase && ghBase !== '/'
    ? (ghBase.endsWith('/') ? ghBase : `${ghBase}/`)
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
