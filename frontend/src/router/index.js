import { createRouter, createWebHistory } from 'vue-router'
import BusquedaPlacaView from '../views/BusquedaPlacaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

export default router
