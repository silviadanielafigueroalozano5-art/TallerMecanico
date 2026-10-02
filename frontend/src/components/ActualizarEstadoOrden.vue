<script setup>
import { computed, ref } from 'vue'
import { cambiarEstadoOrden } from '../services/api'

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
const error = ref('')

async function avanzarEstado() {
  if (!siguienteEstado.value) return

  actualizando.value = true
  error.value = ''

  try {
    const ordenActualizada = await cambiarEstadoOrden(
      props.orden._id,
      siguienteEstado.value,
    )
    emit('estado-actualizado', ordenActualizada)
  } catch (err) {
    error.value = err.message
  } finally {
    actualizando.value = false
  }
}
</script>

<template>
  <div class="row items-center justify-end q-gutter-sm">
    <q-btn
      v-if="siguienteEstado"
      dense
      flat
      color="primary"
      :label="`Pasar a ${siguienteEstado}`"
      :loading="actualizando"
      @click="avanzarEstado"
    />

    <span v-else class="text-caption text-grey-7">Finalizada</span>

    <span v-if="error" class="text-caption text-negative">
      {{ error }}
    </span>
  </div>
</template>
