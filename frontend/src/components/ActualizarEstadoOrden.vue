<script setup>
import { computed, ref } from 'vue'
import { cambiarEstadoOrden } from '../services/api'
import ModalDialogo from './ModalDialogo.vue'

const props = defineProps({
  orden: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['estado-actualizado'])

const siguientesEstados = {
  Recibido: 'En Diagnóstico',
  'En Diagnóstico': 'En Reparación',
  'En Reparación': 'Listo',
  Listo: 'Entregado',
}

const siguienteEstado = computed(() => siguientesEstados[props.orden.estado])
const actualizando = ref(false)
const confirmarEntrega = ref(false)
const error = ref('')

function solicitarAvance() {
  if (!siguienteEstado.value) return
  if (siguienteEstado.value === 'Entregado') {
    confirmarEntrega.value = true
    return
  }
  ejecutarCambioEstado(false)
}

async function ejecutarCambioEstado(pagado = false) {
  if (!siguienteEstado.value) return
  actualizando.value = true
  error.value = ''

  try {
    const ordenActualizada = await cambiarEstadoOrden(
      props.orden._id,
      siguienteEstado.value,
      pagado,
    )
    confirmarEntrega.value = false
    emit('estado-actualizado', ordenActualizada)
  } catch (err) {
    error.value = err.message
  } finally {
    actualizando.value = false
  }
}
</script>

<template>
  <q-card-actions align="right" class="q-gutter-sm q-pa-none">
    <q-btn
      v-if="siguienteEstado"
      dense
      flat
      color="primary"
      :label="`Pasar a ${siguienteEstado}`"
      :loading="actualizando"
      @click="solicitarAvance"
    />

    <q-item-label v-else caption class="text-grey-7">Finalizada</q-item-label>

    <q-item-label v-if="error" caption class="text-negative">
      {{ error }}
    </q-item-label>

    <ModalDialogo
      v-if="confirmarEntrega"
      titulo="Confirmar entrega"
      ancho="460px"
      :cerrable="!actualizando"
      @cerrar="confirmarEntrega = false"
    >
      <q-item-label class="confirm-copy">
        Confirma que el cliente pagó la cuenta completa y retiró el vehículo.
      </q-item-label>
      <template #pie>
        <q-btn
          flat
          no-caps
          class="secondary-button"
          label="Cancelar"
          :disable="actualizando"
          @click="confirmarEntrega = false"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="primary-button"
          label="Sí, entregar"
          :loading="actualizando"
          @click="ejecutarCambioEstado(true)"
        />
      </template>
    </ModalDialogo>
  </q-card-actions>
</template>
