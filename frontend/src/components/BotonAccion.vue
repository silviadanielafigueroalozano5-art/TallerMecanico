<script setup>
import { computed } from 'vue'

/**
 * Componente reutilizable de botón (BotonAccion.vue).
 * Centraliza los estilos y estados de carga/bloqueo usando <q-btn> de Quasar
 * para evitar repetir la configuración de botones en las vistas y modales.
 */

// 1. PROPS: Datos de configuración que recibe el botón desde el componente padre
const props = defineProps({
  etiqueta: { type: String, default: '' },          // Texto visible del botón
  variante: { type: String, default: 'primario' },  // Estilo visual: 'primario', 'secundario', 'peligro', 'accion', 'accion-peligro', 'accion-suave'
  icono: { type: String, default: '' },             // Nombre del icono de Material Icons a la izquierda
  iconoDerecha: { type: String, default: '' },      // Nombre del icono de Material Icons a la derecha
  tipo: { type: String, default: 'button' },        // Tipo del botón: 'button' o 'submit'
  cargando: { type: Boolean, default: false },      // Muestra el indicador giratorio de carga si es true
  deshabilitado: { type: Boolean, default: false }, // Desactiva el botón si es true
  denso: { type: Boolean, default: false },         // Reduce el relleno para tablas o barras compactas
})

// 2. EMITS: Avisa al componente padre cuando el usuario hace clic en el botón
const emit = defineEmits(['click'])

// 3. DICCIONARIO DE VARIANTES: Traduce nombres sencillos a las clases CSS globales de style.css
const mapaClases = {
  primario: 'primary-button',                           // Botón principal destacado
  secundario: 'secondary-button',                       // Botón secundario con fondo claro y borde suave
  peligro: 'primary-button danger-button',              // Botón de alerta para confirmar eliminaciones
  accion: 'icon-action',                                // Botón compacto "Editar" en tablas
  'accion-peligro': 'icon-action is-danger',            // Botón compacto "Eliminar" en tablas
  'accion-suave': 'summary-action-btn is-primary-soft', // Botón suave "Ficha" en tablas de resumen
}

// Propiedad calculada que devuelve la clase CSS según la variante elegida
const clasesBoton = computed(() => mapaClases[props.variante] || 'primary-button')

// Determina si el botón de Quasar debe renderizarse plano (flat) o sin sombra nativa (unelevated)
const esPlano = computed(() => props.variante !== 'primario' && props.variante !== 'peligro')
</script>

<template>
  <!-- 4. TEMPLATE: Usa el componente <q-btn> oficial de Quasar -->
  <q-btn
    :flat="esPlano"
    :unelevated="!esPlano"
    no-caps
    :dense="props.denso || props.variante === 'accion' || props.variante === 'accion-peligro'"
    :type="props.tipo"
    :class="clasesBoton"
    :label="props.etiqueta"
    :icon="props.icono || undefined"
    :icon-right="props.iconoDerecha || undefined"
    :loading="props.cargando"
    :disable="props.deshabilitado || props.cargando"
    @click="emit('click', $event)"
  />
</template>
