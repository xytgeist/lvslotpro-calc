import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function resolveBuildSha() {
  const vercelSha = String(process.env.VERCEL_GIT_COMMIT_SHA || '').trim()
  if (vercelSha) return vercelSha.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'local'
  }
}

process.env.VITE_BUILD_SHA = resolveBuildSha()

export default defineConfig({
  plugins: [react(), tailwindcss()],
})