<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  titulo: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  ancho: { type: String, default: '520px' },
  cerrable: { type: Boolean, default: true },
  clase: { type: String, default: '' },
})

const emit = defineEmits(['cerrar'])

const abierto = ref(true)

watch(
  () => props.titulo,
  () => {
    abierto.value = true
  },
)

function cerrar() {
  if (!props.cerrable) return
  abierto.value = false
  emit('cerrar')
}

function alCambiarVisibilidad(valor) {
  if (!valor) cerrar()
}
</script>

<template>
  <q-dialog
    :model-value="abierto"
    :persistent="!props.cerrable"
    @update:model-value="alCambiarVisibilidad"
  >
    <q-card
      class="modal-card"
      :class="props.clase"
      role="dialog"
      aria-modal="true"
      :aria-label="props.titulo"
      :style="{ maxWidth: props.ancho, width: '100%' }"
    >
      <q-card-section class="modal-header row items-start justify-between no-wrap">
        <q-item-section>
          <q-item-label class="text-h6 text-weight-bold">{{ props.titulo }}</q-item-label>
          <q-item-label v-if="props.descripcion" caption>{{ props.descripcion }}</q-item-label>
        </q-item-section>
        <q-btn
          v-if="props.cerrable"
          flat
          round
          dense
          icon="close"
          aria-label="Cerrar"
          @click="cerrar"
        />
      </q-card-section>

      <q-card-section class="modal-body">
        <slot />
      </q-card-section>

      <q-card-actions v-if="$slots.pie" align="right" class="modal-footer">
        <slot name="pie" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
