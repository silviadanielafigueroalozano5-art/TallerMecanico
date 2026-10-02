<script setup>
import { reactive, ref } from 'vue'
import { crearVehiculo } from '../services/api'

const props = defineProps({
  cliente: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['vehiculo-creado'])

const vehiculo = reactive({
  placa: '',
  marca: '',
  modelo: '',
  anio: null,
  color: '',
})

const guardando = ref(false)
const error = ref('')

async function guardarVehiculo() {
  guardando.value = true
  error.value = ''

  try {
    const nuevoVehiculo = await crearVehiculo({
      ...vehiculo,
      placa: vehiculo.placa.toUpperCase(),
      cliente: props.cliente._id,
    })

    emit('vehiculo-creado', nuevoVehiculo)
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
      <div class="text-h6">Registrar vehículo</div>
      <div class="text-caption text-grey-7">
        Propietario: {{ cliente.nombre }} {{ cliente.apellido }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form class="q-gutter-md" @submit="guardarVehiculo">
        <q-input
          v-model="vehiculo.placa"
          outlined
          label="Placa"
          :rules="[(valor) => !!valor || 'La placa es obligatoria']"
        />

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.marca"
              outlined
              label="Marca"
              :rules="[(valor) => !!valor || 'La marca es obligatoria']"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.modelo"
              outlined
              label="Modelo"
              :rules="[(valor) => !!valor || 'El modelo es obligatorio']"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="vehiculo.anio"
              outlined
              type="number"
              label="Año"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.color"
              outlined
              label="Color"
            />
          </div>
        </div>

        <q-banner v-if="error" rounded class="bg-red-2 text-red-10">
          {{ error }}
        </q-banner>

        <div class="row justify-end">
          <q-btn
            type="submit"
            color="primary"
            label="Guardar vehículo"
            :loading="guardando"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>