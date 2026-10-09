import { defineStore } from 'pinia'
import { iniciarSesionApi } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('taller-token') || '',
    user: JSON.parse(sessionStorage.getItem('taller-usuario') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login({ email, password }) {
      const respuesta = await iniciarSesionApi({ email, password })
      this.token = respuesta.token
      this.user = respuesta.usuario
      sessionStorage.setItem('taller-token', respuesta.token)
      sessionStorage.setItem('taller-usuario', JSON.stringify(respuesta.usuario))
      return this.user
    },
    logout() {
      this.token = ''
      this.user = null
      sessionStorage.removeItem('taller-token')
      sessionStorage.removeItem('taller-usuario')
    },
  },
})
