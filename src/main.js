import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import router from './router'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true
})
createApp(App).use(router).mount('#app')
