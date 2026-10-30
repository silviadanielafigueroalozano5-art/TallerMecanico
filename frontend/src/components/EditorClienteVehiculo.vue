<script setup>
import { computed } from 'vue'
import ModalDialogo from './ModalDialogo.vue'

const props = defineProps({
  guardando: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['cerrar', 'guardar'])

/** Datos compartidos con el composable: cliente + vehículo opcional. */
const form = defineModel('form', { type: Object, required: true })

const anioMaximo = computed(() => new Date().getFullYear() + 1)
const incluyeVehiculo = computed(() => Boolean(form.value?.vehiculo?.vehiculoId))
</script>

<template>
  <ModalDialogo
    :titulo="incluyeVehiculo ? 'Editar cliente y vehículo' : 'Editar cliente'"
    :descripcion="
      incluyeVehiculo
        ? 'Actualiza los datos del propietario y del vehículo en un solo paso.'
        : 'Actualiza los datos de identificación y contacto del propietario.'
    "
    ancho="720px"
    :cerrable="!props.guardando"
    @cerrar="emit('cerrar')"
  >
    <q-form id="editor-cliente-vehiculo" class="modal-form" @submit.prevent="emit('guardar')">
      <q-card-section class="form-section q-pa-none">
        <q-item-label class="row items-center q-gutter-xs text-weight-bold q-mb-sm">
          <q-icon name="person" color="primary" size="18px" />
          <q-item-label>Datos del Propietario</q-item-label>
        </q-item-label>
        <q-card-section class="form-grid q-pa-none">
          <q-input
            v-model="form.cliente.nombre"
            class="field-wide"
            outlined
            dense
            label="Nombre completo *"
            maxlength="80"
            autocomplete="name"
            required
          />
          <q-input
            v-model="form.cliente.cedula"
            outlined
            dense
            label="Cédula *"
            maxlength="20"
            autocomplete="off"
            required
          />
          <q-input
            v-model="form.cliente.telefono"
            outlined
            dense
            type="tel"
            label="Teléfono *"
            maxlength="24"
            autocomplete="tel"
            required
          />
          <q-input
            v-model="form.cliente.email"
            class="field-wide"
            outlined
            dense
            type="email"
            label="Correo electrónico (opcional)"
            maxlength="254"
            autocomplete="email"
          />
        </q-card-section>
      </q-card-section>

      <q-card-section v-if="incluyeVehiculo" class="form-section q-pa-none">
        <q-item-label class="row items-center q-gutter-xs text-weight-bold q-mb-sm">
          <q-icon name="directions_car" color="primary" size="18px" />
          <q-item-label>Datos del Vehículo</q-item-label>
        </q-item-label>
        <q-card-section class="form-grid q-pa-none">
          <q-input
            v-model="form.vehiculo.placa"
            outlined
            dense
            label="Placa *"
            maxlength="9"
            autocomplete="off"
            required
          />
          <q-input
            v-model="form.vehiculo.marca"
            outlined
            dense
            label="Marca *"
            maxlength="80"
            required
          />
          <q-input
            v-model="form.vehiculo.modelo"
            outlined
            dense
            label="Modelo *"
            maxlength="80"
            required
          />
          <q-input
            v-model.number="form.vehiculo.anio"
            outlined
            dense
            type="number"
            label="Año *"
            min="1900"
            :max="anioMaximo"
            step="1"
            required
          />
          <q-input
            v-model.number="form.vehiculo.kilometraje"
            outlined
            dense
            type="number"
            label="Kilometraje *"
            min="0"
            max="2000000"
            step="1"
            required
          />
          <q-input
            v-model="form.vehiculo.color"
            outlined
            dense
            label="Color (opcional)"
            maxlength="40"
          />
        </q-card-section>
      </q-card-section>

      <q-banner v-if="props.error" rounded class="feedback error-feedback" role="alert">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ props.error }}
      </q-banner>
    </q-form>

    <template #pie>
      <q-btn
        flat
        no-caps
        class="secondary-button"
        label="Cancelar"
        :disable="props.guardando"
        @click="emit('cerrar')"
      />
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="primary-button"
        :label="props.guardando ? 'Guardando…' : 'Guardar cambios'"
        :icon-right="props.guardando ? 'hourglass_top' : 'save'"
        :loading="props.guardando"
        :disable="props.guardando"
        @click="emit('guardar')"
      />
    </template>
  </ModalDialogo>
</template>
