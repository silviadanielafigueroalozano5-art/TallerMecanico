<script setup>
import { computed } from 'vue'
import ModalDialogo from './ModalDialogo.vue'
import BotonAccion from './BotonAccion.vue'

/**
 * Modal de edición de propietario y vehículo (EditorClienteVehiculo.vue).
 * Si form.vehiculo.vehiculoId existe, muestra y edita también los datos del vehículo;
 * de lo contrario, edita únicamente al propietario.
 */
const props = defineProps({
  guardando: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['cerrar', 'guardar'])

/** Datos compartidos con el composable: cliente + vehículo opcional. */
const form = defineModel('form', { type: Object, required: true })

// Año máximo permitido para la validación del modelo del vehículo
const anioMaximo = computed(() => new Date().getFullYear() + 1)

// Indica si el modal se abrió desde la pestaña de Vehículos (incluye edición de vehículo)
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

    <!-- Pie del modal usando el componente reutilizable BotonAccion -->
    <template #pie>
      <BotonAccion
        variante="secundario"
        etiqueta="Cancelar"
        :deshabilitado="props.guardando"
        @click="emit('cerrar')"
      />
      <BotonAccion
        variante="primario"
        :etiqueta="props.guardando ? 'Guardando…' : 'Guardar cambios'"
        :icono-derecha="props.guardando ? 'hourglass_top' : 'save'"
        :cargando="props.guardando"
        :deshabilitado="props.guardando"
        @click="emit('guardar')"
      />
    </template>
  </ModalDialogo>
</template>
