<script setup>
import { normalizarTexto } from '../utils/texto'
import { formatoFecha, formatoDinero } from '../utils/formato'

defineProps({
  ordenes: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="history-table-wrap">
    <table class="history-table">
      <thead>
        <tr>
          <th>ORDEN / REPARACIÓN</th>
          <th>FECHA DE INGRESO</th>
          <th>ESTADO</th>
          <th>COSTO</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(orden, index) in ordenes" :key="orden._id">
          <td>
            <div class="repair-name">
              <span class="repair-icon" :class="index % 2 ? 'repair-blue' : 'repair-orange'">
                <span class="material-icons">{{ index % 2 ? 'settings' : 'build' }}</span>
              </span>
              <div>
                <strong>{{ normalizarTexto(orden.descripcionProblema) }}</strong>
                <small>Servicio de reparación</small>
              </div>
            </div>
          </td>
          <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
          <td>
            <span class="status-pill" :class="`status-${orden.estado.toLowerCase().replaceAll(' ', '-')}`">
              <i></i>{{ orden.estado }}
            </span>
          </td>
          <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
          <td><span class="material-icons table-more">more_horiz</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
