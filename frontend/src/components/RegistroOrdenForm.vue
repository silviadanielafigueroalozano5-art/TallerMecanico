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
  costoRepuestos: 0,
  manoObra: 0,
  mecanico: '',
})

const guardando = ref(false)
const error = ref('')

async function guardarOrden() {
  error.value = ''
  const repuestos = Number(orden.costoRepuestos || 0)
  const manoObra = Number(orden.manoObra || 0)
  if (!orden.descripcionProblema.trim() || orden.descripcionProblema.trim().length < 5) { error.value = 'Describe el problema con al menos 5 caracteres.'; return }
  if (!Number.isSafeInteger(repuestos) || repuestos < 0 || !Number.isSafeInteger(manoObra) || manoObra < 0 || repuestos + manoObra > 1000000000000) { error.value = 'Los costos deben ser enteros no negativos y el total no puede superar 1.000.000.000.000 COP.'; return }
  guardando.value = true
  try {
    const nuevaOrden = await crearOrden({ descripcionProblema: orden.descripcionProblema.trim(), diagnostico: orden.diagnostico.trim(), trabajosRealizados: orden.trabajosRealizados.trim(), costoRepuestos: repuestos, manoObra, mecanico: orden.mecanico.trim(), vehiculo: props.vehiculo._id })
    emit('orden-creada', nuevaOrden)
  } catch (err) { error.value = err.message }
  finally { guardando.value = false }
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

        <q-input v-model.number="orden.costoRepuestos" outlined type="number" min="0" step="1" label="Costo de repuestos (COP)" />
        <q-input v-model.number="orden.manoObra" outlined type="number" min="0" step="1" label="Mano de obra (COP)" />
        <q-input v-model="orden.mecanico" outlined maxlength="100" label="Mecánico asignado (opcional)" />

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
