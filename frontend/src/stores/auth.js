import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { iniciarSesionApi } from '../services/api'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref('')
    const user = ref(null)
    const correoRecordado = ref('')

    const isAuthenticated = computed(() => Boolean(token.value))

    async function login({ email, password }) {
      const respuesta = await iniciarSesionApi({ email, password })
      token.value = respuesta.token
      user.value = respuesta.usuario
      return user.value
    }

    function logout() {
      token.value = ''
      user.value = null
    }

    function actualizarCorreoRecordado(email) {
      correoRecordado.value = email || ''
    }

    return {
      token,
      user,
      correoRecordado,
      isAuthenticated,
      login,
      logout,
      actualizarCorreoRecordado,
    }
  },
  {
    persist: {
      key: 'taller-auth',
      pick: ['token', 'user', 'correoRecordado'],
    },
  },
)
