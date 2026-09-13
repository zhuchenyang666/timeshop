import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

registerSW({
  immediate: true,
  onOfflineReady: () => window.dispatchEvent(new Event('pwa-ready')),
  onRegisterError: () => window.dispatchEvent(new Event('pwa-error')),
})
