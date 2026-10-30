import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { Quasar } from 'quasar'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { configurarClienteApi } from './services/api'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(Quasar, {
  config: {
    brand: {
      primary: '#4d3ec3',
      secondary: '#4338a7',
      accent: '#f4b26a',
      dark: '#1f2141',
      positive: '#4d3ec3',
      info: '#6253d4',
    },
  },
})

const authStore = useAuthStore(pinia)
configurarClienteApi({
  obtenerToken: () => authStore.token,
  alExpirarSesion: () => {
    authStore.logout()
    if (router.currentRoute.value.name !== 'login') {
      router.replace({ name: 'login' })
    }
  },
})

app.mount('#app')
