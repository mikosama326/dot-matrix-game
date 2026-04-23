import { defineConfig } from 'vite'

export default defineConfig({
  base: '/dot-matrix-game/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
