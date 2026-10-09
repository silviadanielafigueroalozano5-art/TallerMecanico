<script setup>
import { reactive, ref } from "vue";
import { crearCliente } from "../services/api";
import { esCorreoValido } from "../utils/validation";

const emit = defineEmits(["cliente-creado"]);

const cliente = reactive({
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  email: "",
  direccion: "",
});

const guardando = ref(false);
const error = ref("");

async function guardarCliente() {
  guardando.value = true;
  error.value = "";

  try {
    const nuevoCliente = await crearCliente(cliente);
    emit("cliente-creado", nuevoCliente);
  } catch (err) {
    error.value = err.message;
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6">Registrar cliente</div>
      <div class="text-caption text-grey-7">
        Primero registra al propietario del vehículo.
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form class="q-gutter-md" @submit="guardarCliente">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="cliente.nombre"
              outlined
              label="Nombre"
              :rules="[(valor) => !!valor || 'El nombre es obligatorio']"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="cliente.apellido"
              outlined
              label="Apellido"
              :rules="[(valor) => !valor || valor.trim().length >= 2 || 'El apellido debe tener al menos 2 caracteres']"
            />
          </div>
        </div>

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

        <div class="row justify-end">
          <q-btn
            type="submit"
            color="primary"
            label="Guardar cliente"
            :loading="guardando"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>
