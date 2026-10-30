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
  kilometraje: null,
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
      kilometraje: Number(vehiculo.kilometraje),
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
      <q-item-label class="text-h6">Registrar vehículo</q-item-label>
      <q-item-label caption class="text-grey-7">
        Propietario: {{ props.cliente.nombre }} {{ props.cliente.apellido }}
      </q-item-label>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form class="q-gutter-md" @submit="guardarVehiculo">
        <q-input
          v-model="vehiculo.placa"
          outlined
          label="Placa"
          :rules="[(valor) => /^[A-Za-z0-9-]{5,9}$/.test((valor || '').trim()) || 'Ingresa una placa válida de 5 a 8 caracteres']"
        />

        <q-card-section class="row q-col-gutter-md q-pa-none">
          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.marca"
              outlined
              label="Marca"
              :rules="[(valor) => !!valor || 'La marca es obligatoria']"
            />
          </q-item-section>

          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.modelo"
              outlined
              label="Modelo"
              :rules="[(valor) => !!valor || 'El modelo es obligatorio']"
            />
          </q-item-section>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md q-pa-none">
          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model.number="vehiculo.anio"
              outlined
              type="number"
              label="Año"
            />
          </q-item-section>

          <q-item-section class="col-12 col-sm-6">
            <q-input
              v-model="vehiculo.color"
              outlined
              label="Color"
            />
          </q-item-section>
        </q-card-section>

        <q-input
          v-model.number="vehiculo.kilometraje"
          outlined
          type="number"
          min="0"
          max="2000000"
          step="1"
          label="Kilometraje actual"
          :rules="[(valor) => valor !== null && valor !== '' && Number.isSafeInteger(Number(valor)) && Number(valor) >= 0 && Number(valor) <= 2000000 || 'Ingresa un kilometraje entero válido']"
        />

        <q-banner v-if="error" rounded class="bg-red-2 text-red-10">
          {{ error }}
        </q-banner>

        <q-card-actions align="right" class="q-pa-none">
          <q-btn
            type="submit"
            color="primary"
            label="Guardar vehículo"
            :loading="guardando"
          />
        </q-card-actions>
      </q-form>
    </q-card-section>
  </q-card>
</template>
