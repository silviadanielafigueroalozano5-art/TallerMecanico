<script setup>
import { reactive, ref } from 'vue'
import { crearCliente } from '../services/api'
import { esCorreoValido } from '../utils/validation'

const emit = defineEmits(['cliente-creado'])

const cliente = reactive({
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  email: '',
  direccion: '',
})

const guardando = ref(false)
const error = ref('')

async function guardarCliente() {
  guardando.value = true
  error.value = ''

  try {
    const nuevoCliente = await crearCliente(cliente)
    emit('cliente-creado', nuevoCliente)
  } catch (err) {
    error.value = err.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <q-card flat bordered>
    <q-card-section>
      <q-item-label class="text-h6">Registrar cliente</q-item-label>
      <q-item-label caption class="text-grey-7">
        Primero registra al propietario del vehículo.
      </q-item-label>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form class="q-gutter-md" @submit="guardarCliente">
        <q-card-section class="row q-col-gutter-md q-pa-none">
          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model="cliente.nombre"
              outlined
              label="Nombre"
              :rules="[(valor) => !!valor || 'El nombre es obligatorio']"
            />
          </q-item-section>

          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model="cliente.apellido"
              outlined
              label="Apellido"
              :rules="[(valor) => !valor || valor.trim().length >= 2 || 'El apellido debe tener al menos 2 caracteres']"
            />
          </q-item-section>
        </q-card-section>

        <q-input
          v-model="cliente.cedula"
          outlined
          label="Cédula"
          :rules="[(valor) => !!valor && valor.trim().length >= 5 || 'La cédula debe tener al menos 5 caracteres']"
        />

        <q-input
          v-model="cliente.telefono"
          outlined
          label="Teléfono"
          :rules="[(valor) => !!valor && /^[+()\d .-]+$/.test(valor) && valor.replace(/\D/g, '').length >= 7 && valor.replace(/\D/g, '').length <= 15 || 'Ingresa un teléfono válido de 7 a 15 dígitos']"
        />

        <q-input
          v-model="cliente.email"
          outlined
          type="email"
          label="Correo electrónico"
          :rules="[(valor) => !valor || esCorreoValido(valor.trim()) || 'Ingresa un correo electrónico válido']"
        />

        <q-input v-model="cliente.direccion" outlined label="Dirección" />

        <q-banner v-if="error" rounded class="bg-red-2 text-red-10">
          {{ error }}
        </q-banner>

        <q-card-actions align="right" class="q-pa-none">
          <q-btn
            type="submit"
            color="primary"
            label="Guardar cliente"
            :loading="guardando"
          />
        </q-card-actions>
      </q-form>
    </q-card-section>
  </q-card>
</template>
