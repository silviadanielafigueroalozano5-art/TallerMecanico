<script setup>
import { normalizarTexto } from '../utils/texto'

const props = defineProps({
  modoGestion: { type: String, default: 'clientes' },
  clientes: { type: Array, default: () => [] },
  vehiculos: { type: Array, default: () => [] },
  clientesFiltrados: { type: Array, default: () => [] },
  vehiculosFiltrados: { type: Array, default: () => [] },
  cargandoGestion: { type: Boolean, default: false },
  errorGestion: { type: String, default: '' },
  cerrable: { type: Boolean, default: true },
})

const emit = defineEmits([
  'cerrar',
  'cambiar-modo',
  'actualizar',
  'limpiar-error',
  'editar-cliente',
  'eliminar-cliente',
  'editar-vehiculo',
  'eliminar-vehiculo',
])

const filtro = defineModel('filtro', { type: String, default: '' })

/** Placas vinculadas a un propietario. */
function placasDe(cliente) {
  return props.vehiculos
    .filter((auto) => String(auto.cliente?._id || auto.cliente) === String(cliente._id))
    .map((auto) => auto.placa)
    .filter(Boolean)
}
</script>

<template>
  <q-card flat class="history-section management-inline-card">
    <q-card-section class="management-panel q-pa-none">
      <q-toolbar class="management-head q-px-none">
        <q-btn-group flat class="segmented" role="tablist" aria-label="Tipo de registro">
          <q-btn
            flat
            no-caps
            icon="groups"
            :class="{ active: props.modoGestion === 'clientes' }"
            :label="`Clientes (${props.clientes.length})`"
            @click="emit('cambiar-modo', 'clientes')"
          />
          <q-btn
            flat
            no-caps
            icon="directions_car"
            :class="{ active: props.modoGestion === 'vehiculos' }"
            :label="`Vehículos (${props.vehiculos.length})`"
            @click="emit('cambiar-modo', 'vehiculos')"
          />
        </q-btn-group>

        <q-space />

        <q-input
          v-model="filtro"
          dense
          outlined
          type="search"
          placeholder="Buscar por nombre, documento o placa"
          aria-label="Filtrar registros"
          style="min-width: 280px"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-toolbar>

      <q-banner v-if="props.errorGestion" rounded class="feedback error-feedback" role="alert">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ props.errorGestion }}
        <template #action>
          <q-btn flat round dense icon="close" aria-label="Cerrar mensaje" @click="emit('limpiar-error')" />
        </template>
      </q-banner>

      <q-card-section v-if="props.cargandoGestion" class="loading-board row items-center justify-center q-gutter-sm">
        <q-spinner color="primary" size="22px" />
        <q-item-label>Cargando registros…</q-item-label>
      </q-card-section>

      <template v-else-if="props.modoGestion === 'clientes'">
        <q-markup-table
          v-if="props.clientesFiltrados.length"
          flat
          bordered
          class="management-table-wrap management-table management-table-lg"
        >
          <thead>
            <q-tr>
              <q-th class="text-left">PROPIETARIO</q-th>
              <q-th class="text-left">DOCUMENTO</q-th>
              <q-th class="text-left">CONTACTO</q-th>
              <q-th class="text-left">PLACAS VINCULADAS</q-th>
              <q-th class="text-right"></q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr
              v-for="cliente in props.clientesFiltrados"
              :key="cliente._id"
            >
              <q-td>
                <q-item-label class="text-weight-bold">
                  {{ normalizarTexto([cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || '—') }}
                </q-item-label>
              </q-td>
              <q-td>{{ cliente.cedula }}</q-td>
              <q-td class="contact-cell">
                <q-item-label>{{ cliente.telefono || '—' }}</q-item-label>
                <q-item-label caption>{{ cliente.email || 'Sin correo' }}</q-item-label>
              </q-td>
              <q-td>
                <q-chip
                  v-for="placa in placasDe(cliente)"
                  :key="placa"
                  dense
                  square
                  class="plate-chip"
                >
                  {{ placa }}
                </q-chip>
                <q-item-label v-if="!placasDe(cliente).length" caption>Sin vehículos</q-item-label>
              </q-td>
              <q-td class="text-right">
                <q-card-actions align="right" class="row-actions q-pa-none">
                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="edit"
                    label="Editar"
                    class="icon-action"
                    @click="emit('editar-cliente', cliente)"
                  />
                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="delete"
                    label="Eliminar"
                    class="icon-action is-danger"
                    @click="emit('eliminar-cliente', cliente)"
                  />
                </q-card-actions>
              </q-td>
            </q-tr>
          </tbody>
        </q-markup-table>

        <q-card-section v-else class="empty-state column items-center text-center">
          <q-icon name="groups" size="36px" color="primary" />
          <q-item-label class="text-weight-bold q-mt-sm">
            {{ props.clientes.length ? 'No hay resultados' : 'Aún no hay clientes registrados' }}
          </q-item-label>
          <q-item-label caption>
            {{ props.clientes.length ? 'Prueba con otro nombre, documento o placa.' : 'Registra un propietario desde la búsqueda de vehículos.' }}
          </q-item-label>
        </q-card-section>
      </template>

      <template v-else>
        <q-markup-table
          v-if="props.vehiculosFiltrados.length"
          flat
          bordered
          class="management-table-wrap management-table"
        >
          <thead>
            <q-tr>
              <q-th class="text-left">VEHÍCULO</q-th>
              <q-th class="text-left">PLACA</q-th>
              <q-th class="text-left">PROPIETARIO</q-th>
              <q-th class="text-left">KILOMETRAJE</q-th>
              <q-th class="text-left">ESTADO DE REPARACIÓN</q-th>
              <q-th class="text-right"></q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr
              v-for="auto in props.vehiculosFiltrados"
              :key="auto._id"
            >
              <q-td>
                <q-item-label class="text-weight-bold">
                  {{ normalizarTexto(auto.marca) }} {{ normalizarTexto(auto.modelo) }}
                </q-item-label>
                <q-item-label caption>Año {{ auto.anio || '—' }}</q-item-label>
              </q-td>
              <q-td>{{ auto.placa }}</q-td>
              <q-td>{{ auto.clienteNombre || '—' }}</q-td>
              <q-td>{{ auto.kilometraje ?? '—' }} km</q-td>
              <q-td>
                <q-badge class="state-pill" :class="auto.estadoClase" :label="auto.estadoReparacion" />
              </q-td>
              <q-td class="text-right">
                <q-card-actions align="right" class="row-actions q-pa-none">
                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="edit"
                    label="Editar"
                    class="icon-action"
                    :disable="!auto.cliente?._id"
                    @click="emit('editar-vehiculo', auto)"
                  />
                  <q-btn
                    flat
                    dense
                    no-caps
                    icon="delete"
                    label="Eliminar"
                    class="icon-action is-danger"
                    @click="emit('eliminar-vehiculo', auto)"
                  />
                </q-card-actions>
              </q-td>
            </q-tr>
          </tbody>
        </q-markup-table>

        <q-card-section v-else class="empty-state column items-center text-center">
          <q-icon name="directions_car" size="36px" color="primary" />
          <q-item-label class="text-weight-bold q-mt-sm">No hay vehículos para mostrar</q-item-label>
          <q-item-label caption>Registra un vehículo desde la búsqueda por placa.</q-item-label>
        </q-card-section>
      </template>
    </q-card-section>
  </q-card>
</template>
