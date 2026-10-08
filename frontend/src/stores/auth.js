import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null,
  }),

  actions: {
    login({ email, password }) {
      const correo = String(email ?? '').trim().toLowerCase()
      const contrasena = String(password ?? '').trim()

      if (!correo || !contrasena) {
        throw new Error('Debes ingresar tu correo y contraseña.')
      }

      const credentials = {
        email: 'admin@gmail.com',
        password: 'admin123',
      }

      if (correo !== credentials.email || contrasena !== credentials.password) {
        throw new Error('Correo o contraseña incorrectos.')
      }

      this.user = { email: correo }
      this.isAuthenticated = true
      return this.user
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
    },
  },

  persist: {
    pick: ['isAuthenticated', 'user'],
  },
})
