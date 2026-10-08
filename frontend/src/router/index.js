import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BusquedaPlacaView from '../views/BusquedaPlacaView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'buscar', component: BusquedaPlacaView },
    {
      path: '/vehiculos/:placa',
      name: 'ficha-vehiculo',
      component: BusquedaPlacaView,
      props: true,
    },
    {
      path: '/ordenes/nueva/:placa',
      name: 'nueva-orden',
      component: BusquedaPlacaView,
      props: true,
    },
    {
      path: '/seguimiento',
      name: 'seguimiento',
      component: BusquedaPlacaView,
    },
    {
      path: '/historial',
      name: 'historial',
      component: BusquedaPlacaView,
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'buscar' } },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.name === 'login') {
    if (authStore.isAuthenticated) {
      return { name: 'buscar' }
    }

    return true
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
