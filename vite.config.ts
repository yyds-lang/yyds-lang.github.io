import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'

const base = process.env.VITE_BASE_URL ?? '/'

export default defineConfig({
  base,
  optimizeDeps: {
    include: ['modern-monaco/core']
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      dts: '.auto-generated/typed-router.d.ts',
      watch: false
    }),
    Vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: '.auto-generated/auto-imports.d.ts',
      vueTemplate: true
    }),
    Components({
      dirs: ['src/components'],
      dts: '.auto-generated/components.d.ts'
    }),
    UnoCSS()
  ],
  resolve: {
    dedupe: ['modern-monaco'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
