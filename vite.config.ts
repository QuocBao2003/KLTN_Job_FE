import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.PORT)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
        components: path.resolve(__dirname, "./src/components/"),
        styles: path.resolve(__dirname, "./src/styles/"),
        config: path.resolve(__dirname, "./src/config/"),
        pages: path.resolve(__dirname, "./src/pages/"),
      },
    },
    optimizeDeps: {
      include: ['jspdf', 'canvg', 'html2canvas', 'dompurify']
    },
    build: {
      target: 'esnext',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  }
})