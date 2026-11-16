<script setup>
import { normalizarTexto } from '../utils/texto'
import { formatoFecha } from '../utils/formato'
import BotonAccion from './BotonAccion.vue'

defineProps({
  ordenes: {
    type: Array,
    required: true,
  },
})

defineEmits(['ver-ficha'])
</script>

<template>
  <div class="summary-table-wrap">
    <table class="summary-orders-table">
      <thead>
        <tr>
          <th>PLACA</th>
          <th>MARCA Y MODELO</th>
          <th>CLIENTE</th>
          <th>SERVICIO / REPARACIÓN</th>
          <th>FECHA DE INGRESO</th>
          <th>ESTADO</th>
          <th>MECÁNICO</th>
          <th class="summary-th-actions">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="orden in ordenes" :key="orden._id">
          <td class="summary-td-plate">
            <span class="summary-plate-badge">{{ orden.vehiculo?.placa || '—' }}</span>
          </td>
          <td>
            <div class="summary-cell-stack">
              <strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong>
              <small v-if="orden.vehiculo?.anio">Modelo {{ orden.vehiculo.anio }}</small>
            </div>
          </td>
          <td>
            <div class="summary-cell-stack">
              <strong>{{ normalizarTexto([orden.vehiculo?.cliente?.nombre, orden.vehiculo?.cliente?.apellido].filter(Boolean).join(' ')) || '—' }}</strong>
              <small v-if="orden.vehiculo?.cliente?.telefono">{{ orden.vehiculo.cliente.telefono }}</small>
            </div>
          </td>
          <td class="summary-td-service">
            <div class="summary-service-text">{{ normalizarTexto(orden.descripcionProblema) || '—' }}</div>
          </td>
          <td class="summary-td-date">{{ formatoFecha(orden.fechaIngreso) }}</td>
          <td class="summary-td-status">
            <span class="status-pill" :class="`status-${orden.estado.toLowerCase().replaceAll(' ', '-')}`">
              <i></i>{{ orden.estado }}
            </span>
          </td>
          <td class="summary-td-mechanic">
            <span :class="{ 'summary-unassigned': !orden.mecanico }">
              {{ orden.mecanico ? normalizarTexto(orden.mecanico) : 'Sin asignar' }}
            </span>
          </td>
          <td class="summary-td-actions">
            <div class="summary-row-actions">
              <!-- Botón reutilizable para abrir la ficha del vehículo -->
              <BotonAccion
                v-if="orden.vehiculo?.placa"
                variante="accion-suave"
                icono="visibility"
                etiqueta="Ficha"
                title="Ver ficha del vehículo"
                @click="$emit('ver-ficha', orden.vehiculo)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
