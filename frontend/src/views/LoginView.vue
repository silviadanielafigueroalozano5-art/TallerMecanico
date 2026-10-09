<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { esCorreoValido } from '../utils/validation'

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
  const email = form.email.trim().toLowerCase()
  const password = form.password
  error.value = ''
  if (!email) { error.value = 'Ingresa tu correo electrónico.'; return }
  if (!esCorreoValido(email)) { error.value = 'Ingresa un correo electrónico válido.'; return }
  if (!password || !password.trim()) { error.value = 'Ingresa tu contraseña.'; return }
  if (password.length < 8 || password.length > 128) { error.value = 'La contraseña debe tener entre 8 y 128 caracteres.'; return }
  cargando.value = true
  try {
    await authStore.login({ email, password })
    if (recordarCorreo.value) localStorage.setItem('taller-correo-recordado', email)
    else localStorage.removeItem('taller-correo-recordado')
    await router.replace(String(redirectPath.value))
  } catch (err) {
    error.value = err?.message || 'No se pudo iniciar sesión.'
  } finally { cargando.value = false }
}

function mostrarAyudaRecuperacion() {
  router.push({ name: 'recuperar-contrasena' })
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
            <span class="login-chip">Sistema de gestión</span>
            <h1>Inicia sesión</h1>
            <p>Accede al control operativo de tu taller.</p>
          </div>

          <form class="login-form" autocomplete="on" novalidate @submit.prevent="iniciarSesion">
            <div class="form-field">
              <label for="login-email">Correo electrónico</label>
              <input
                id="login-email"
                v-model="form.email"
                class="login-control"
                name="email"
                type="email"
                maxlength="254"
                dir="ltr"
                autocomplete="username"
                autocapitalize="off"
                spellcheck="false"
                placeholder="correo@taller.com"
                required
              />
            </div>

            <div class="form-field">
              <label for="login-password">Contraseña</label>
              <div class="password-field">
                <input
                  id="login-password"
                  v-model="form.password"
                  class="login-control"
                  name="password"
                  :type="mostrarContrasena ? 'text' : 'password'"
                  minlength="8"
                  maxlength="128"
                  dir="ltr"
                  autocomplete="current-password"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="Tu contraseña"
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
              </div>
            </div>

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
