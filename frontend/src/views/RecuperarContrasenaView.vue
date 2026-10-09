<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { esCorreoValido } from '../utils/validation'
import { restablecerContrasena, solicitarRestablecimiento } from '../services/api'

const route = useRoute()
const router = useRouter()
const formulario = reactive({ email: '', password: '', confirmar: '' })
const cargando = ref(false)
const error = ref('')
const mensaje = ref('')
const esRestablecimiento = computed(() => route.name === 'restablecer-contrasena')
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')

async function enviar() {
  error.value = ''
  mensaje.value = ''
  if (esRestablecimiento.value) {
    if (!token.value) { error.value = 'El enlace no contiene un token de recuperación válido.'; return }
    if (formulario.password.length < 12 || formulario.password.length > 128) { error.value = 'La contraseña debe tener entre 12 y 128 caracteres.'; return }
    if (formulario.password !== formulario.confirmar) { error.value = 'Las contraseñas no coinciden.'; return }
  } else {
    const email = formulario.email.trim().toLowerCase()
    if (!esCorreoValido(email)) { error.value = 'Ingresa un correo electrónico válido.'; return }
    formulario.email = email
  }
  cargando.value = true
  try {
    if (esRestablecimiento.value) {
      const respuesta = await restablecerContrasena(token.value, formulario.password)
      mensaje.value = respuesta.mensaje
      formulario.password = ''
      formulario.confirmar = ''
    } else {
      const respuesta = await solicitarRestablecimiento(formulario.email)
      mensaje.value = respuesta.mensaje
    }
  } catch (err) {
    error.value = err?.message || 'No se pudo completar la solicitud.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="login-screen recovery-screen">
    <section class="recovery-card" aria-labelledby="recovery-title">
      <a class="recovery-brand" href="/login" @click.prevent="router.push({ name: 'login' })">Taller Mecánico</a>
      <h1 id="recovery-title">{{ esRestablecimiento ? 'Crea una contraseña nueva' : 'Recupera tu contraseña' }}</h1>
      <p class="recovery-description">
        {{ esRestablecimiento ? 'Elige una contraseña segura de al menos 12 caracteres.' : 'Te enviaremos un enlace de recuperación al correo asociado a tu cuenta.' }}
      </p>

      <form class="recovery-form" novalidate @submit.prevent="enviar">
        <div v-if="!esRestablecimiento" class="form-field">
          <label for="recovery-email">Correo electrónico</label>
          <input id="recovery-email" v-model="formulario.email" class="login-control" type="email" autocomplete="username" maxlength="254" required />
        </div>
        <template v-else>
          <div class="form-field">
            <label for="new-password">Nueva contraseña</label>
            <input id="new-password" v-model="formulario.password" class="login-control" type="password" autocomplete="new-password" minlength="12" maxlength="128" required />
          </div>
          <div class="form-field">
            <label for="confirm-password">Confirma la contraseña</label>
            <input id="confirm-password" v-model="formulario.confirmar" class="login-control" type="password" autocomplete="new-password" minlength="12" maxlength="128" required />
          </div>
        </template>
        <div v-if="error" class="login-error" role="alert">{{ error }}</div>
        <div v-if="mensaje" class="login-help" role="status">{{ mensaje }}</div>
        <button class="primary-button login-button" type="submit" :disabled="cargando">
          {{ cargando ? 'Procesando...' : esRestablecimiento ? 'Cambiar contraseña' : 'Enviar enlace' }}
          <span class="material-icons" aria-hidden="true">arrow_forward</span>
        </button>
      </form>
      <button class="forgot-password recovery-back" type="button" @click="router.push({ name: 'login' })">Volver a iniciar sesión</button>
    </section>
  </main>
</template>
