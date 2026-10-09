import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './ui/styles.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

// Geliştirme kolaylığı: otomasyon testleri ve konsol için bus'a erişim (yalnızca dev build).
if (import.meta.env.DEV) {
  void Promise.all([import('./bus'), import('./services/theme/ThemeService')]).then(([{ bus }, { ThemeService }]) => {
    const w = window as unknown as { __bus: typeof bus; __theme: typeof ThemeService }
    w.__bus = bus
    w.__theme = ThemeService
  })
}
