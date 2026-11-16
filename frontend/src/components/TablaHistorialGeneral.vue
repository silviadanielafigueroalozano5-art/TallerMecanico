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
          <th>FECHA</th>
          <th>VEHÍCULO</th>
          <th>CLIENTE</th>
          <th>REPARACIÓN</th>
          <th>ESTADO</th>
          <th>COSTO</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="orden in ordenes" :key="orden._id">
          <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
          <td>
            <strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong><br>
            <small>{{ orden.vehiculo?.placa }}</small>
          </td>
          <td>
            {{ normalizarTexto(orden.vehiculo?.cliente?.nombre || '—') }}
            {{ normalizarTexto(orden.vehiculo?.cliente?.apellido || '') }}
          </td>
          <td>{{ normalizarTexto(orden.descripcionProblema) }}</td>
          <td>
            <span class="status-pill" :class="`status-${orden.estado.toLowerCase().replaceAll(' ', '-')}`">
              <i></i>{{ orden.estado }}
            </span>
          </td>
          <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
