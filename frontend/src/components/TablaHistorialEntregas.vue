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
          <th>FECHA DE ENTREGA</th>
          <th>COSTO</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="orden in ordenes" :key="orden._id">
          <td>
            <div class="repair-name">
              <span class="repair-icon repair-blue">
                <span class="material-icons">done</span>
              </span>
              <div>
                <strong>{{ normalizarTexto(orden.descripcionProblema) }}</strong>
                <small>Servicio entregado</small>
              </div>
            </div>
          </td>
          <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
          <td>{{ formatoFecha(orden.fechaEntrega || orden.fechaIngreso) }}</td>
          <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
