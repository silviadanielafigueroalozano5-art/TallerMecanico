<script setup>
import { reactive, ref } from 'vue'
import { crearOrden } from '../services/api'

const props = defineProps({
  vehiculo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['orden-creada'])

const orden = reactive({
  descripcionProblema: '',
  diagnostico: '',
  trabajosRealizados: '',
  monto: 0,
})

const guardando = ref(false)
const error = ref('')

async function guardarOrden() {
  guardando.value = true
  error.value = ''

  try {
    const nuevaOrden = await crearOrden({
      ...orden,
      vehiculo: props.vehiculo._id,
    })

    emit('orden-creada', nuevaOrden)
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
      <div class="text-h6">Nueva orden de reparación</div>
      <div class="text-caption text-grey-7">
        Vehículo: {{ vehiculo.placa }} — {{ vehiculo.marca }}
        {{ vehiculo.modelo }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form class="q-gutter-md" @submit="guardarOrden">
        <q-input
          v-model="orden.descripcionProblema"
          outlined
          type="textarea"
          label="Descripción del problema"
          :rules="[(valor) => !!valor || 'Describe el problema del vehículo']"
        />

        <q-input
          v-model="orden.diagnostico"
          outlined
          type="textarea"
          label="Diagnóstico"
        />

        <q-input
          v-model="orden.trabajosRealizados"
          outlined
          type="textarea"
          label="Trabajos realizados"
        />

        <q-input
          v-model.number="orden.monto"
          outlined
          type="number"
          min="0"
          label="Monto"
        />

        <q-banner v-if="error" rounded class="bg-red-2 text-red-10">
          {{ error }}
        </q-banner>

        <div class="row justify-end">
          <q-btn
            type="submit"
            color="primary"
            label="Crear orden"
            :loading="guardando"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>
