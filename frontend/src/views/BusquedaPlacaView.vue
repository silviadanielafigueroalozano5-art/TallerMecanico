<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useWorkshopStore, obtenerEstadosDisponibles } from '../stores/workshop'

const estados = ['Recibido', 'En Diagnóstico', 'En Reparación', 'Listo', 'Entregado']
const tiposReparacion = [
  'Cambio de aceite y filtros',
  'Reparación y cambio de llantas',
  'Reparación del sistema de frenos',
  'Cambio de pastillas, discos y zapatas',
  'Revisión y cambio de batería',
  'Cambio de bujías',
  'Cambio de correas y mangueras',
  'Reparación básica del motor',
  'Reparación de suspensión y dirección',
  'Cambio de amortiguadores, rótulas y bujes',
  'Revisión del sistema eléctrico',
  'Cambio de bombillos y fusibles',
  'Revisión del sistema de refrigeración',
  'Cambio de refrigerante',
  'Reparación básica del sistema de escape',
  'Revisión de niveles de líquidos',
  'Otro',
]
const pantalla = ref('buscar')
const route = useRoute()
const router = useRouter()
const workshop = useWorkshopStore()
const {
  searchMode: tipoBusqueda,
  clienteEncontrado,
  vehiculosCliente,
  vehiculo,
  historial,
  ordenes,
  historialGeneral,
} = storeToRefs(workshop)
const termino = ref('')
const cargando = ref(false)
const guardando = ref(false)
const cargandoSeguimiento = ref(false)
const error = ref('')
const aviso = ref('')
const noEncontrado = ref(false)
const propietarioExistente = ref(false)
const filtroSeguimiento = ref('')
const etapaRegistro = ref(1)
const estadosIniciales = [...estados]

const propietarioForm = reactive({
  nombre: '',
  cedula: '',
  telefono: '',
})
const vehiculoForm = reactive({
  placa: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
})
const ordenForm = reactive({
  tiposReparacion: [],
  tipoReparacion: '',
  otroTipo: '',
  monto: '',
  fechaIngreso: new Date().toISOString().slice(0, 10),
  estado: 'Recibido',
})

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return ''

  const mapa = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã±': 'ñ', 'Ã¼': 'ü',
    'Ã': 'Á', 'Ã': 'É', 'Ã': 'Í', 'Ã': 'Ó', 'Ã': 'Ú', 'Ã‘': 'Ñ', 'Ãœ': 'Ü',
    'Ã': 'A', 'Â': 'A',
    '?r': 'ér', '?s': 'és', '?n': 'én', '?l': 'él', '?m': 'ém', '?t': 'ét', '?d': 'éd',
    '?b': 'éb', '?p': 'ép', '?c': 'éc', '?v': 'év', '?g': 'ég', '?j': 'éj', '?z': 'ez',
  }

  let texto = String(valor)
  Object.entries(mapa).forEach(([entrada, salida]) => {
    texto = texto.split(entrada).join(salida)
  })

  return texto
}

const nombrePropietario = computed(() => {
  const propietario = vehiculo.value?.cliente || clienteEncontrado.value
  if (!propietario) return 'Propietario'
  return normalizarTexto(
    [propietario.nombre, propietario.apellido]
      .filter(Boolean)
      .join(' '),
  )
})

const ordenActual = computed(() =>
  historial.value.find((orden) => orden.estado !== 'Entregado') ||
  historial.value[0] ||
  null,
)

const ordenesFiltradas = computed(() => {
  const filtro = filtroSeguimiento.value.trim().toLocaleLowerCase()
  if (!filtro) return ordenes.value
  return ordenes.value.filter((orden) => {
    const auto = orden.vehiculo || {}
    const cliente = auto.cliente || {}
    return [
      auto.placa,
      auto.marca,
      auto.modelo,
      cliente.nombre,
      cliente.apellido,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(filtro)
  })
})

const gruposOrdenes = computed(() =>
  estados.map((estado) => ({
    estado,
    ordenes: ordenesFiltradas.value.filter((orden) => orden.estado === estado),
  })),
)

const historialEntregados = computed(() =>
  (historial.value || []).filter((orden) => orden.estado === 'Entregado'),
)

const historialGeneralOrdenado = computed(() =>
  [...(historialGeneral.value || [])].sort(
    (a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso),
  ),
)

function limpiarMensajes() {
  error.value = ''
  aviso.value = ''
}

function abrirBusqueda() {
  pantalla.value = 'buscar'
  workshop.limpiarBusqueda()
  noEncontrado.value = false
  propietarioExistente.value = false
  etapaRegistro.value = 1
  limpiarMensajes()
  router.push({ name: 'buscar' })
}

function iniciarRegistro() {
  noEncontrado.value = true
  etapaRegistro.value = 1
  propietarioExistente.value = false
  limpiarMensajes()

  if (tipoBusqueda.value === 'placa') {
    vehiculoForm.placa = termino.value.trim().toUpperCase()
    propietarioForm.nombre = ''
    propietarioForm.cedula = ''
    propietarioForm.telefono = ''
  } else {
    propietarioForm.cedula = termino.value.trim()
    propietarioForm.nombre = ''
    propietarioForm.telefono = ''
    vehiculoForm.placa = ''
  }
}

async function buscar() {
  if (!termino.value.trim()) return
  cargando.value = true
  limpiarMensajes()
  noEncontrado.value = false
  etapaRegistro.value = 1
  propietarioExistente.value = false
  workshop.limpiarBusqueda()

  try {
    if (tipoBusqueda.value === 'placa') {
      abrirFicha(await workshop.buscarPorPlaca(termino.value))
      return
    }

    const resultado = await workshop.buscarPorCedula(termino.value)
    if (resultado.vehiculos.length === 1) {
      await seleccionarVehiculo(resultado.vehiculos[0])
    } else if (!resultado.vehiculos.length) {
      noEncontrado.value = true
      propietarioForm.nombre = [resultado.cliente.nombre, resultado.cliente.apellido]
        .filter(Boolean)
        .join(' ')
      propietarioForm.cedula = resultado.cliente.cedula
      propietarioForm.telefono = resultado.cliente.telefono || ''
      etapaRegistro.value = 2
      propietarioExistente.value = true
    }
  } catch (err) {
    if (err.status === 404) {
      noEncontrado.value = true
      if (tipoBusqueda.value === 'cedula') {
        propietarioForm.cedula = termino.value.trim()
        propietarioForm.nombre = ''
        propietarioForm.telefono = ''
        vehiculoForm.placa = ''
      } else {
        vehiculoForm.placa = termino.value.trim().toUpperCase()
        propietarioForm.nombre = ''
        propietarioForm.cedula = ''
        propietarioForm.telefono = ''
      }
    } else {
      error.value = err.message || 'No fue posible completar la búsqueda.'
    }
  } finally {
    cargando.value = false
  }
}

function abrirFicha(resultado) {
  workshop.guardarFicha(resultado)
  pantalla.value = 'ficha'
  noEncontrado.value = false
  limpiarMensajes()
  router.push({
    name: 'ficha-vehiculo',
    params: { placa: resultado.vehiculo.placa },
  })
}

function volverPasoRegistro() {
  if (propietarioExistente.value) {
    abrirBusqueda()
    return
  }
  etapaRegistro.value = 1
}

async function seleccionarVehiculo(auto) {
  cargando.value = true
  limpiarMensajes()
  try {
    const resultado = await workshop.buscarPorPlaca(auto.placa)
    abrirFicha(resultado)
  } catch (err) {
    error.value = err.message || 'No fue posible cargar la ficha del vehículo.'
  } finally {
    cargando.value = false
  }
}

async function registrarPropietario() {
  guardando.value = true
  limpiarMensajes()
  const partesNombre = propietarioForm.nombre.trim().split(/\s+/)
  try {
    await workshop.registrarCliente({
      nombre: partesNombre.shift() || '',
      apellido: partesNombre.join(' '),
      cedula: propietarioForm.cedula.trim(),
      telefono: propietarioForm.telefono.trim(),
    })
    etapaRegistro.value = 2
  } catch (err) {
    error.value = err.message || 'No fue posible registrar al propietario.'
  } finally {
    guardando.value = false
  }
}

async function registrarVehiculo() {
  guardando.value = true
  limpiarMensajes()
  try {
    const nuevo = await workshop.registrarVehiculo({
      ...vehiculoForm,
      placa: vehiculoForm.placa.trim().toUpperCase(),
      anio: Number(vehiculoForm.anio),
    })
    pantalla.value = 'ficha'
    noEncontrado.value = false
    aviso.value = 'Vehículo registrado. Ya puedes crear su primera orden.'
    router.push({ name: 'ficha-vehiculo', params: { placa: nuevo.placa } })
  } catch (err) {
    error.value = err.message || 'No fue posible registrar el vehículo.'
  } finally {
    guardando.value = false
  }
}

function abrirNuevaOrden() {
  ordenForm.tiposReparacion = []
  ordenForm.tipoReparacion = ''
  ordenForm.otroTipo = ''
  ordenForm.monto = ''
  ordenForm.fechaIngreso = new Date().toISOString().slice(0, 10)
  ordenForm.estado = 'Recibido'
  pantalla.value = 'orden'
  limpiarMensajes()
  router.push({ name: 'nueva-orden', params: { placa: vehiculo.value.placa } })
}

function formatearMonto() {
  const digitos = String(ordenForm.monto).replace(/\D/g, '').slice(0, 12)
  if (!digitos) {
    ordenForm.monto = ''
    return
  }
  ordenForm.monto = new Intl.NumberFormat('es-CO').format(Number(digitos))
}

async function guardarOrden() {
  guardando.value = true
  limpiarMensajes()

  const tiposSeleccionados = (Array.isArray(ordenForm.tiposReparacion) ? ordenForm.tiposReparacion : [])
    .filter(Boolean)

  const descripcion = [...tiposSeleccionados]
  if (tiposSeleccionados.includes('Otro')) {
    const otro = ordenForm.otroTipo.trim()
    if (!otro) {
      guardando.value = false
      error.value = 'Indica cuál es la reparación adicional que elegiste como "Otro".'
      return
    }
    descripcion.push(otro)
  }

  if (!descripcion.length) {
    guardando.value = false
    error.value = 'Selecciona al menos un tipo de reparación.'
    return
  }
  try {
    await workshop.crearOrdenReparacion({
      descripcionProblema: descripcion.join(', '),
      monto: Number(String(ordenForm.monto).replace(/\D/g, '') || 0),
      fechaIngreso: new Date(`${ordenForm.fechaIngreso}T12:00:00`).toISOString(),
      estado: ordenForm.estado,
    })
    pantalla.value = 'ficha'
    aviso.value = 'La orden de reparación se creó correctamente.'
    router.push({ name: 'ficha-vehiculo', params: { placa: vehiculo.value.placa } })
  } catch (err) {
    error.value = err.message || 'No fue posible crear la orden.'
  } finally {
    guardando.value = false
  }
}

async function abrirHistorial() {
  pantalla.value = 'historial'
  limpiarMensajes()
  if (route.name !== 'historial') {
    await router.push({ name: 'historial' })
    return
  }
  await cargarHistorialGeneral()
}

async function cargarSeguimiento() {
  pantalla.value = 'seguimiento'
  if (route.name !== 'seguimiento') {
    await router.push({ name: 'seguimiento' })
    return
  }
  await cargarOrdenes()
}

async function cargarOrdenes() {
  cargandoSeguimiento.value = true
  limpiarMensajes()
  try {
    await workshop.cargarOrdenesActivas()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar las órdenes activas.'
  } finally {
    cargandoSeguimiento.value = false
  }
}

async function cargarHistorialGeneral() {
  try {
    await workshop.cargarHistorialGeneral()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar el historial general.'
  }
}

async function actualizarEstado(orden, estado) {
  limpiarMensajes()
  try {
    if (!obtenerEstadosDisponibles(orden.estado).includes(estado)) {
      throw new Error('No puedes saltarte etapas del proceso. Avanza en orden.')
    }
    await workshop.actualizarEstadoOrden(orden, estado)
  } catch (err) {
    error.value = err.message || 'No fue posible actualizar el estado.'
  }
}

function formatoFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatoDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)
}

watch(
  () => [route.name, route.params.placa],
  async ([name, placa]) => {
    if (name === 'buscar') {
      pantalla.value = 'buscar'
      return
    }
    if (name === 'seguimiento') {
      pantalla.value = 'seguimiento'
      await cargarOrdenes()
      return
    }
    if (name === 'historial') {
      pantalla.value = 'historial'
      await cargarHistorialGeneral()
      return
    }
    if (name === 'ficha-vehiculo' || name === 'nueva-orden') {
      pantalla.value = name === 'ficha-vehiculo' ? 'ficha' : 'orden'
      if (placa && vehiculo.value?.placa !== placa) {
        cargando.value = true
        try {
          await workshop.buscarPorPlaca(placa)
        } catch (err) {
          error.value = err.message || 'No fue posible cargar el vehículo solicitado.'
          pantalla.value = 'buscar'
          await router.replace({ name: 'buscar' })
        } finally {
          cargando.value = false
        }
      }
    }
  },
  { immediate: true },
)

</script>

<template>
  <div class="app-shell">
    <div class="main-column">
      <header class="topbar">
        <div class="topbar-left">
          <a class="brand" href="#" @click.prevent="abrirBusqueda">
            <span class="brand-mark"><span class="material-icons">build</span></span>
            <span class="brand-copy"><strong>Torque</strong><small>TALLER MECÁNICO</small></span>
          </a>
          <nav class="topbar-nav" aria-label="Navegación principal">
            <button
              class="nav-link"
              :class="{ active: pantalla === 'buscar' || pantalla === 'ficha' || pantalla === 'orden' }"
              @click="abrirBusqueda"
            >
              <span class="material-icons">search</span><span>Buscar vehículo</span>
            </button>
            <button
              class="nav-link"
              :class="{ active: pantalla === 'seguimiento' }"
              @click="cargarSeguimiento"
            >
              <span class="material-icons">view_kanban</span><span>Seguimiento</span>
              <span class="nav-count">{{ ordenes.length }}</span>
            </button>
            <button
              class="nav-link"
              :class="{ active: pantalla === 'historial' }"
              @click="abrirHistorial"
            >
              <span class="material-icons">history</span><span>Historial</span>
            </button>
          </nav>
        </div>
        <div class="topbar-actions">
          <span class="today"><span class="material-icons">calendar_today</span>{{ new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) }}</span>
          <button class="icon-button notification-button" aria-label="Notificaciones"><span class="material-icons">notifications_none</span><i></i></button>
          <div class="top-avatar">JM</div>
        </div>
      </header>

      <main class="page-content">
        <div v-if="error" class="feedback error-feedback">
          <span class="material-icons">error_outline</span>{{ error }}
          <button aria-label="Cerrar mensaje" @click="error = ''"><span class="material-icons">close</span></button>
        </div>
        <div v-if="aviso" class="feedback success-feedback">
          <span class="material-icons">check_circle</span>{{ aviso }}
          <button aria-label="Cerrar mensaje" @click="aviso = ''"><span class="material-icons">close</span></button>
        </div>

        <template v-if="pantalla === 'buscar'">
          <section class="page-heading">
            <div>
              <div class="eyebrow">GESTIÓN DEL TALLER</div>
              <h1>Todo en marcha.</h1>
              <p>Encuentra un vehículo, revisa su historial o inicia una nueva reparación.</p>
            </div>
            <button class="secondary-button" @click="cargarSeguimiento">
              <span class="material-icons">view_kanban</span> Ver órdenes activas
            </button>
          </section>

          <section class="search-panel">
            <div class="search-intro">
              <div class="search-icon"><span class="material-icons">manage_search</span></div>
              <div><h2>¿Qué vehículo buscas?</h2><p>Consulta rápidamente la información y el historial de servicio.</p></div>
            </div>
            <div class="search-controls">
              <div class="search-field">
                <label for="search-input">Buscar por</label>
                <div class="input-combo">
                  <select v-model="tipoBusqueda" aria-label="Tipo de búsqueda" @change="termino = ''">
                    <option value="placa">Placa del vehículo</option>
                    <option value="cedula">Cédula / CC del propietario</option>
                  </select>
                  <span class="material-icons">expand_more</span>
                  <input
                    id="search-input"
                    v-model="termino"
                    :placeholder="tipoBusqueda === 'placa' ? 'Ej. ABC-123' : 'Número de cédula / CC'"
                    @keyup.enter="buscar"
                  />
                  <button class="search-submit" :disabled="!termino.trim() || cargando" @click="buscar">
                    <span class="material-icons">{{ cargando ? 'hourglass_top' : 'search' }}</span>
                    {{ cargando ? 'Buscando…' : 'Buscar' }}
                  </button>
                </div>
              </div>
            </div>
            <div class="search-footer">
              <div class="search-hint"><span class="material-icons">info</span>Puedes buscar por placa o por número de cédula del propietario.</div>
              <button v-if="!noEncontrado" class="register-link" type="button" @click="iniciarRegistro">
                <span class="material-icons">person_add</span> ¿No aparece? Registrar vehículo
              </button>
            </div>
          </section>

          <section v-if="vehiculosCliente.length > 1 && pantalla === 'buscar'" class="selection-panel">
            <div class="section-heading">
              <div><h2>{{ clienteEncontrado ? `Vehículos de ${nombrePropietario}` : 'Vehículos asociados a esta cédula / CC' }}</h2><p>Selecciona el vehículo que quieres consultar.</p></div>
              <span class="result-count">{{ vehiculosCliente.length }} vehículos</span>
            </div>
            <button v-for="auto in vehiculosCliente" :key="auto._id" class="vehicle-choice" @click="seleccionarVehiculo(auto)">
              <div class="vehicle-choice-icon"><span class="material-icons">directions_car</span></div>
              <div><strong>{{ auto.marca }} {{ auto.modelo }}</strong><span>{{ auto.anio || 'Año no registrado' }} · {{ auto.placa }}</span></div>
              <span class="material-icons choice-arrow">arrow_forward</span>
            </button>
          </section>

          <section
            v-if="noEncontrado"
            class="registration-panel"
            :class="{ 'registration-vehicle': etapaRegistro === 2 }"
          >
            <div class="section-heading">
              <div>
                <div class="eyebrow">NUEVO REGISTRO</div>
                <h2>{{ clienteEncontrado ? 'Registra un vehículo' : 'No encontramos este registro' }}</h2>
                <p>{{ clienteEncontrado ? 'Completa los datos del vehículo para continuar.' : 'Registra los datos del propietario y del vehículo para continuar.' }}</p>
              </div>
              <button class="text-button" @click="noEncontrado = false"><span class="material-icons">close</span></button>
            </div>
            <div class="stepper">
              <div class="step" :class="{ complete: etapaRegistro > 1, current: etapaRegistro === 1 }"><span>{{ etapaRegistro > 1 ? '✓' : '1' }}</span> Propietario</div>
              <i></i>
              <div class="step" :class="{ current: etapaRegistro === 2 }"><span>2</span> Vehículo</div>
            </div>
            <form v-if="etapaRegistro === 1" class="form-grid" @submit.prevent="registrarPropietario">
              <label class="field"><span>Nombre completo <b>*</b></span><input v-model="propietarioForm.nombre" required placeholder="Nombre y apellido" /></label>
              <label class="field"><span>Cédula <b>*</b></span><input v-model="propietarioForm.cedula" required placeholder="Número de identificación" /></label>
              <label class="field field-wide"><span>Teléfono <b>*</b></span><input v-model="propietarioForm.telefono" required placeholder="Número de contacto" /></label>
              <div class="form-actions field-wide"><button class="primary-button" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Continuar' }}<span class="material-icons">arrow_forward</span></button></div>
            </form>
            <form v-else class="form-grid" @submit.prevent="registrarVehiculo">
              <label class="field"><span>Placa <b>*</b></span><input v-model="vehiculoForm.placa" required placeholder="Ej. ABC-123" /></label>
              <label class="field"><span>Marca <b>*</b></span><input v-model="vehiculoForm.marca" required placeholder="Ej. Toyota" /></label>
              <label class="field"><span>Modelo <b>*</b></span><input v-model="vehiculoForm.modelo" required placeholder="Ej. Corolla" /></label>
              <label class="field"><span>Año <b>*</b></span><input v-model.number="vehiculoForm.anio" type="number" min="1900" :max="new Date().getFullYear() + 1" required /></label>
              <div class="form-actions field-wide">
                <button type="button" class="secondary-button" @click="volverPasoRegistro">{{ propietarioExistente ? 'Volver a búsqueda' : 'Atrás' }}</button>
                <button class="primary-button" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar vehículo' }}<span class="material-icons">check</span></button>
              </div>
            </form>
          </section>

        </template>

        <template v-else-if="pantalla === 'ficha'">
          <div class="back-link" @click="abrirBusqueda"><span class="material-icons">arrow_back</span> Volver a la búsqueda</div>
          <section class="page-heading vehicle-heading">
            <div><div class="eyebrow">FICHA DEL VEHÍCULO</div><h1>{{ vehiculo?.marca }} {{ vehiculo?.modelo }}</h1><p>Consulta la información del vehículo y sus reparaciones anteriores.</p></div>
            <button class="primary-button" @click="abrirNuevaOrden"><span class="material-icons">add</span> Crear nueva orden</button>
          </section>

          <section class="vehicle-summary">
            <div class="car-emblem"><span class="material-icons">directions_car</span></div>
            <div class="car-primary"><span>PLACA</span><strong>{{ vehiculo?.placa }}</strong><small>{{ vehiculo?.color || 'Vehículo registrado' }}</small></div>
            <div class="summary-divider"></div>
            <div class="car-spec"><span>MARCA Y MODELO</span><strong>{{ vehiculo?.marca }} {{ vehiculo?.modelo }}</strong></div>
            <div class="car-spec"><span>AÑO</span><strong>{{ vehiculo?.anio || '—' }}</strong></div>
            <div class="car-owner"><div class="avatar">{{ normalizarTexto(nombrePropietario).slice(0, 2).toUpperCase() }}</div><div><span>PROPIETARIO</span><strong>{{ nombrePropietario }}</strong><small>{{ vehiculo?.cliente?.telefono || vehiculo?.cliente?.cedula || 'Sin contacto registrado' }}</small></div></div>
          </section>

          <section class="history-section">
            <div class="section-heading">
              <div><div class="eyebrow">REGISTRO DE SERVICIOS</div><h2>Historial de reparaciones</h2><p>Todos los trabajos realizados a este vehículo.</p></div>
              <span class="result-count">{{ historial.length }} {{ historial.length === 1 ? 'orden' : 'órdenes' }}</span>
            </div>
            <div v-if="historial.length" class="history-table-wrap">
              <table class="history-table"><thead><tr><th>ORDEN / REPARACIÓN</th><th>FECHA DE INGRESO</th><th>ESTADO</th><th>COSTO</th><th></th></tr></thead>
                <tbody><tr v-for="(orden, index) in historial" :key="orden._id">
                  <td><div class="repair-name"><span class="repair-icon" :class="index % 2 ? 'repair-blue' : 'repair-orange'"><span class="material-icons">{{ index % 2 ? 'settings' : 'build' }}</span></span><div><strong>{{ normalizarTexto(orden.descripcionProblema) }}</strong><small>Servicio de reparación</small></div></div></td>
                  <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
                  <td><span class="status-pill" :class="`status-${orden.estado.toLowerCase().replaceAll(' ', '-')}`"><i></i>{{ orden.estado }}</span></td>
                  <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
                  <td><span class="material-icons table-more">more_horiz</span></td>
                </tr></tbody>
              </table>
            </div>
            <div v-else class="empty-state"><div class="empty-icon"><span class="material-icons">history</span></div><strong>Aún no hay reparaciones registradas</strong><p>Cuando se creen órdenes para este vehículo, aparecerán aquí.</p><button class="secondary-button" @click="abrirNuevaOrden"><span class="material-icons">add</span> Crear primera orden</button></div>
          </section>

          <section class="history-section delivered-section">
            <div class="section-heading">
              <div><div class="eyebrow">VEHÍCULOS ENTREGADOS</div><h2>Historial de entregas</h2><p>Reparaciones ya finalizadas y entregadas al cliente.</p></div>
              <span class="result-count">{{ historialEntregados.length }} {{ historialEntregados.length === 1 ? 'entrega' : 'entregas' }}</span>
            </div>
            <div v-if="historialEntregados.length" class="history-table-wrap">
              <table class="history-table"><thead><tr><th>ORDEN / REPARACIÓN</th><th>FECHA DE INGRESO</th><th>FECHA DE ENTREGA</th><th>COSTO</th></tr></thead>
                <tbody><tr v-for="orden in historialEntregados" :key="orden._id">
                  <td><div class="repair-name"><span class="repair-icon repair-blue"><span class="material-icons">done</span></span><div><strong>{{ normalizarTexto(orden.descripcionProblema) }}</strong><small>Servicio entregado</small></div></div></td>
                  <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
                  <td>{{ formatoFecha(orden.fechaEntrega || orden.fechaIngreso) }}</td>
                  <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
                </tr></tbody>
              </table>
            </div>
            <div v-else class="empty-state"><div class="empty-icon"><span class="material-icons">check_circle</span></div><strong>No hay entregas registradas</strong><p>Cuando una orden pase a estado entregado, aparecerá aquí.</p></div>
          </section>
        </template>

        <template v-else-if="pantalla === 'orden'">
          <div class="back-link" @click="pantalla = 'ficha'"><span class="material-icons">arrow_back</span> Volver a la ficha</div>
          <section class="page-heading"><div><div class="eyebrow">ORDEN DE SERVICIO</div><h1>Nueva orden de reparación</h1><p>Registra el trabajo para {{ vehiculo?.placa }} · {{ vehiculo?.marca }} {{ vehiculo?.modelo }}.</p></div></section>
          <section class="order-form-panel">
            <div class="panel-title"><div class="panel-icon"><span class="material-icons">assignment_add</span></div><div><h2>Detalles de la orden</h2><p>Los campos marcados con <b>*</b> son obligatorios.</p></div></div>
            <form class="form-grid" @submit.prevent="guardarOrden">
              <div class="field field-wide">
                <span>Tipo de reparación <b>*</b></span>
                <div class="repair-options" aria-label="Tipos de reparación">
                  <label v-for="tipo in tiposReparacion" :key="tipo" class="repair-option">
                    <input v-model="ordenForm.tiposReparacion" type="checkbox" :value="tipo" />
                    <span>{{ tipo }}</span>
                  </label>
                </div>
              </div>
              <label v-if="ordenForm.tiposReparacion.includes('Otro')" class="field field-wide"><span>¿Cuál? <b>*</b></span><input v-model="ordenForm.otroTipo" required placeholder="Escribe el tipo de reparación…" /></label>
              <label class="field"><span>Costo estimado (COP)</span><div class="money-input"><span>$</span><input v-model="ordenForm.monto" type="text" inputmode="numeric" placeholder="0" @input="formatearMonto" /></div></label>
              <label class="field"><span>Fecha de ingreso <b>*</b></span><div class="money-input"><span class="material-icons">today</span><input :value="ordenForm.fechaIngreso" type="date" readonly disabled /></div></label>
              <label class="field field-wide"><span>Estado inicial <b>*</b></span><select v-model="ordenForm.estado" required><option v-for="estado in estadosIniciales" :key="estado" :value="estado">{{ estado }}</option></select></label>
              <div class="form-actions field-wide"><button type="button" class="secondary-button" @click="pantalla = 'ficha'">Cancelar</button><button class="primary-button" :disabled="guardando">{{ guardando ? 'Creando orden…' : 'Crear orden' }}<span class="material-icons">arrow_forward</span></button></div>
            </form>
          </section>
        </template>

        <template v-else-if="pantalla === 'historial'">
          <section class="page-heading">
            <div><div class="eyebrow">HISTORIAL GENERAL</div><h1>Historial del taller</h1><p>Consulta todas las órdenes registradas, ordenadas por fecha más reciente.</p></div>
            <button class="secondary-button" @click="abrirHistorial"><span class="material-icons">refresh</span> Actualizar</button>
          </section>
          <section class="history-section">
            <div class="section-heading">
              <div><div class="eyebrow">REGISTRO COMPLETO</div><h2>Órdenes del taller</h2><p>Todo el historial del servicio organizado por fecha.</p></div>
              <span class="result-count">{{ historialGeneralOrdenado.length }} {{ historialGeneralOrdenado.length === 1 ? 'orden' : 'órdenes' }}</span>
            </div>
            <div v-if="historialGeneralOrdenado.length" class="history-table-wrap">
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
                  <tr v-for="orden in historialGeneralOrdenado" :key="orden._id">
                    <td>{{ formatoFecha(orden.fechaIngreso) }}</td>
                    <td><strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong><br><small>{{ orden.vehiculo?.placa }}</small></td>
                    <td>{{ normalizarTexto(orden.vehiculo?.cliente?.nombre || '—') }} {{ normalizarTexto(orden.vehiculo?.cliente?.apellido || '') }}</td>
                    <td>{{ normalizarTexto(orden.descripcionProblema) }}</td>
                    <td><span class="status-pill" :class="`status-${orden.estado.toLowerCase().replaceAll(' ', '-')}`"><i></i>{{ orden.estado }}</span></td>
                    <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state"><div class="empty-icon"><span class="material-icons">history</span></div><strong>No hay historial registrado</strong><p>Aún no se han creado órdenes en el taller.</p></div>
          </section>
        </template>

        <template v-else-if="pantalla === 'seguimiento'">
          <section class="page-heading">
            <div><div class="eyebrow">TALLER EN TIEMPO REAL</div><h1>Seguimiento de órdenes</h1><p>Visualiza el avance de cada reparación activa.</p></div>
            <button class="secondary-button" @click="cargarSeguimiento"><span class="material-icons">refresh</span> Actualizar</button>
          </section>
          <section class="tracker-toolbar">
            <div class="tracker-title"><div class="panel-icon"><span class="material-icons">view_kanban</span></div><div><h2>Tablero de reparaciones</h2><p>{{ ordenes.length }} órdenes activas en el taller</p></div></div>
            <label class="filter-input"><span class="material-icons">search</span><input v-model="filtroSeguimiento" placeholder="Filtrar por cliente o vehículo" /><span class="filter-shortcut">⌘ K</span></label>
          </section>
          <div v-if="cargandoSeguimiento" class="loading-board"><span class="material-icons">autorenew</span> Cargando órdenes…</div>
          <section v-else class="kanban-board">
            <div v-for="(grupo, index) in gruposOrdenes.slice(0, 4)" :key="grupo.estado" class="kanban-column">
              <div class="kanban-header"><span class="kanban-dot" :class="`dot-${index}`"></span><strong>{{ grupo.estado }}</strong><span class="column-count">{{ grupo.ordenes.length }}</span></div>
              <article v-for="orden in grupo.ordenes" :key="orden._id" class="order-card">
                <div class="order-card-top"><span class="order-ref">ORD-{{ String(orden._id).slice(-5).toUpperCase() }}</span><span class="material-icons">more_horiz</span></div>
                <h3>{{ normalizarTexto(orden.descripcionProblema) }}</h3>
                <div class="order-car"><span class="material-icons">directions_car</span><strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong></div>
                <div class="order-plate">{{ orden.vehiculo?.placa }}</div>
                <div class="order-client"><div class="avatar small-avatar">{{ normalizarTexto(orden.vehiculo?.cliente?.nombre || 'CL').slice(0, 2).toUpperCase() }}</div><span>{{ normalizarTexto(orden.vehiculo?.cliente?.nombre) }} {{ normalizarTexto(orden.vehiculo?.cliente?.apellido) }}</span><span class="order-date">{{ formatoFecha(orden.fechaIngreso) }}</span></div>
                <div class="order-card-footer"><strong>{{ formatoDinero(orden.monto) }}</strong><select :value="orden.estado" aria-label="Actualizar estado" @change="actualizarEstado(orden, $event.target.value)"><option v-for="estado in obtenerEstadosDisponibles(orden.estado)" :key="estado" :value="estado">{{ estado }}</option></select></div>
              </article>
              <div v-if="!grupo.ordenes.length" class="column-empty">No hay órdenes en esta etapa.</div>
            </div>
          </section>
          <div v-if="!cargandoSeguimiento && !ordenesFiltradas.length && !error" class="empty-state board-empty"><div class="empty-icon"><span class="material-icons">task_alt</span></div><strong>{{ filtroSeguimiento ? 'No hay resultados' : 'Todo al día' }}</strong><p>{{ filtroSeguimiento ? 'Prueba con otro nombre o placa.' : 'No hay órdenes activas en el taller por ahora.' }}</p><button class="secondary-button" @click="abrirBusqueda"><span class="material-icons">search</span> Buscar vehículo</button></div>
        </template>

      </main>
    </div>
  </div>
</template>
