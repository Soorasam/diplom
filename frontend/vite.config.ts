import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const normalizeBaseSlashPlugin = (basePath: string) => ({
  name: 'normalize-base-slash',
  configureServer(server: { middlewares: { use: (cb: (req: { url?: string }, res: { statusCode: number; setHeader: (n: string, v: string) => void; end: () => void }, next: () => void) => void) => void } }) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? ''
      const normalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
      if (url === normalized || url.startsWith(`${normalized}?`)) {
        res.statusCode = 302
        res.setHeader('Location', `${normalized}/user/`)
        res.end()
        return
      }
      if (url === `${normalized}/` || url === `${normalized}/?`) {
        res.statusCode = 302
        res.setHeader('Location', `${normalized}/user/`)
        res.end()
        return
      }
      next()
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBase =
    env.VITE_BASE ?? (mode === 'production' ? '/' : '/coopykt/')
  const appBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  const appBaseSlash = appBase

  return {
    base: appBase,
    plugins: [
      normalizeBaseSlashPlugin(appBase),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'Коопзакупки — Якутия',
          short_name: 'КоопЯкутия',
          description:
            'Кооперативные закупки и логистика в труднодоступные районы Республики Саха',
          lang: 'ru',
          theme_color: '#2563EB',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait',
          start_url: `${appBaseSlash}user/`,
          scope: appBaseSlash,
          icons: [
            {
              src: `${appBaseSlash}icons/pwa-192x192.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: `${appBaseSlash}icons/pwa-512x512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: `${appBaseSlash}icons/pwa-192x192.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: `${appBaseSlash}icons/pwa-512x512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
      }),
    ],
    server: {
      host: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
