import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { devApiProxy } from './dev-server'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [react(), tailwindcss(), devApiProxy()],
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || (id.includes('react') && !id.includes('react-markdown') && !id.includes('react-router'))) {
                return 'vendor-react'
              }
              if (id.includes('react-router') || id.includes('@remix-run')) {
                return 'vendor-router'
              }
              if (id.includes('motion')) {
                return 'vendor-motion'
              }
            }
          },
        },
      },
    },
  }
})
