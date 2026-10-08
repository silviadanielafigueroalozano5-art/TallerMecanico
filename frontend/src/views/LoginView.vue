<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const error = ref('')
const cargando = ref(false)
const mostrarContrasena = ref(false)
const recordarCorreo = ref(false)
const mensajeRecuperacion = ref('')

const redirectPath = computed(() => route.query.redirect || '/')

onMounted(() => {
  const correoGuardado = localStorage.getItem('taller-correo-recordado')
  if (correoGuardado) {
    form.email = correoGuardado
    recordarCorreo.value = true
  }
})

async function iniciarSesion() {
  if (!form.email.trim() || !form.password.trim()) {
    error.value = 'Ingresa tu correo y contraseña para continuar.'
    return
  }

  cargando.value = true
  error.value = ''
  mensajeRecuperacion.value = ''

  try {
    await authStore.login({
      email: form.email,
      password: form.password,
    })

    if (recordarCorreo.value) {
      localStorage.setItem('taller-correo-recordado', form.email.trim())
    } else {
      localStorage.removeItem('taller-correo-recordado')
    }

    await router.replace(String(redirectPath.value))
  } catch (err) {
    error.value = err?.message || 'No se pudo iniciar sesión.'
  } finally {
    cargando.value = false
  }
}

function mostrarAyudaRecuperacion() {
  mensajeRecuperacion.value = 'Contacta al administrador del taller para restablecer tu contraseña.'
}
</script>

<template>
  <main class="login-screen">
    <div class="login-panel">
      <section class="login-showcase" aria-label="Gestión del taller">
        <div class="showcase-grid" aria-hidden="true"></div>
        <div class="showcase-brand">
          <div class="showcase-mark">
            <span class="material-icons">build</span>
          </div>
          <div class="showcase-brand-copy">
            <strong>Taller Mecánico</strong>
            <small>ADMINISTRACIÓN</small>
          </div>
        </div>

        <div class="showcase-info">
          <div class="showcase-message">
            <h2>Cada vehículo,<span>bajo control.</span></h2>
            <p>Gestiona órdenes de trabajo, clientes y reparaciones desde un solo lugar.</p>
          </div>
          <ul class="showcase-shortcuts">
            <li><span class="material-icons" aria-hidden="true">receipt_long</span>Órdenes de trabajo al día</li>
            <li><span class="material-icons" aria-hidden="true">groups</span>Clientes y vehículos organizados</li>
            <li><span class="material-icons" aria-hidden="true">build</span>Seguimiento de cada reparación</li>
          </ul>
        </div>
        <div class="gear gear-small" aria-hidden="true"></div>
        <div class="gear gear-large" aria-hidden="true"></div>
      </section>

      <section class="login-content">
        <div class="login-form-area">
          <div class="login-header">
            <h1>Inicia sesión</h1>
            <p>Ingresa para gestionar tu taller.</p>
          </div>

          <form class="login-form" @submit.prevent="iniciarSesion">
            <label class="form-field">
              <span>Correo electrónico</span>
              <span class="login-input-wrap">
                <span class="material-icons" aria-hidden="true">mail_outline</span>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="correo@taller.com"
                  autocomplete="email"
                  required
                />
            </span>
            </label>

            <label class="form-field">
              <span>Contraseña</span>
              <span class="login-input-wrap">
                <span class="material-icons" aria-hidden="true">lock_outline</span>
                <input
                  v-model="form.password"
                  :type="mostrarContrasena ? 'text' : 'password'"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                  required
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="mostrarContrasena = !mostrarContrasena"
                >
                  <span class="material-icons">{{ mostrarContrasena ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </span>
            </label>

            <div class="login-options">
              <label class="remember-option">
                <input v-model="recordarCorreo" type="checkbox" />
                <span>Recordarme</span>
              </label>
              <button class="forgot-password" type="button" @click="mostrarAyudaRecuperacion">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div v-if="error" class="login-error" role="alert">
              {{ error }}
            </div>
            <div v-if="mensajeRecuperacion" class="login-help" role="status">
              {{ mensajeRecuperacion }}
            </div>

            <button class="primary-button login-button" type="submit" :disabled="cargando">
              {{ cargando ? 'Ingresando...' : 'Ingresar' }}
              <span class="material-icons" aria-hidden="true">arrow_forward</span>
            </button>
          </form>
        </div>

        <p class="login-copyright">© 2026 Taller Mecánico · Todos los derechos reservados</p>
      </section>
    </div>
  </main>
</template>
