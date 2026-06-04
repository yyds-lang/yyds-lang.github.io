import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'

const breakpoints = {
  'xs': '320px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
  '3xl': '1920px'
}

export default defineConfig({
  theme: {
    breakpoints
  },
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      cdn: 'https://esm.sh/',
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'text-bottom'
      }
    })
  ]
})
