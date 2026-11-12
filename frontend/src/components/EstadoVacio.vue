<script setup>
import BotonAccion from './BotonAccion.vue'

/**
 * Componente reutilizable de Estado Vacío (EstadoVacio.vue).
 * Muestra un mensaje centrado con ícono, título, descripción y un botón opcional
 * cuando una tabla o listado no tiene registros para mostrar.
 */

// 1. PROPS: Datos que recibe el componente para personalizar el mensaje vacío
const props = defineProps({
  icono: { type: String, default: 'inbox' },              // Ícono de Material Icons a mostrar en el círculo
  titulo: { type: String, required: true },               // Título principal en negrita
  descripcion: { type: String, default: '' },             // Explicación opcional debajo del título
  textoBoton: { type: String, default: '' },              // Si tiene texto, dibuja el botón de acción debajo
  iconoBoton: { type: String, default: '' },              // Ícono opcional para el botón de acción
  varianteBoton: { type: String, default: 'secundario' }, // Variante visual del BotonAccion
})

// 2. EMITS: Avisa al componente padre cuando el usuario presiona el botón de acción
const emit = defineEmits(['accion'])
</script>

<template>
  <!-- 3. TEMPLATE: Construido con componentes Quasar (<q-card-section>, <q-avatar>, <q-icon>, <q-item-label>) -->
  <q-card-section class="empty-state column items-center text-center">
    <!-- Círculo con el ícono representativo -->
    <q-avatar class="empty-icon" size="48px">
      <q-icon :name="props.icono" size="24px" />
    </q-avatar>

    <!-- Título principal del estado vacío -->
    <q-item-label class="empty-state-title text-weight-bold q-mt-xs">
      {{ props.titulo }}
    </q-item-label>

    <!-- Descripción secundaria explicativa -->
    <q-item-label v-if="props.descripcion" caption class="empty-state-desc q-mt-xs q-mb-md">
      {{ props.descripcion }}
    </q-item-label>

    <!-- Botón de acción opcional (reutiliza el componente BotonAccion.vue) -->
    <BotonAccion
      v-if="props.textoBoton"
      :variante="props.varianteBoton"
      :icono="props.iconoBoton"
      :etiqueta="props.textoBoton"
      @click="emit('accion')"
    />

    <!-- Espacio adicional por si el componente padre desea insertar contenido extra -->
    <slot />
  </q-card-section>
</template>
