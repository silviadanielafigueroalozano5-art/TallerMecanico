<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorkshopStore, obtenerEstadosDisponibles, obtenerEstadosOrden } from '../stores/workshop'
import { esCorreoValido } from '../utils/validation'
import { normalizarTexto } from '../utils/texto'
import ModalDialogo from '../components/ModalDialogo.vue'
import GestorClientesModal from '../components/GestorClientesModal.vue'
import EditorClienteVehiculo from '../components/EditorClienteVehiculo.vue'
import { useGestionClientes } from '../utils/useGestionClientes'

const estados = ['Recibido', 'En Diagnóstico', 'En Reparación', 'Listo', 'Entregado']
const valorOtro = '__otro__'
const marcasVehiculo = [
  'Audi',
  'BMW',
  'BYD',
  'Chevrolet',
  'Chery',
  'Citroën',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Peugeot',
  'Renault',
  'Subaru',
  'Suzuki',
  'Toyota',
  'Volkswagen',
  'Volvo',
]
const modelosPorMarca = {
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5'],
  BYD: ['Dolphin', 'Yuan Plus', 'Song Plus', 'Seagull', 'Tang'],
  Chevrolet: ['Aveo', 'Captiva', 'Cruze', 'Joy', 'Onix', 'Sail', 'Spark', 'Tracker'],
  Chery: ['Arrizo 5', 'Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8'],
  Citroën: ['C3', 'C4', 'C-Elysée', 'Berlingo'],
  Fiat: ['500', 'Argo', 'Cronos', 'Mobi', 'Pulse', 'Strada'],
  Ford: ['Bronco', 'Escape', 'EcoSport', 'Fiesta', 'Focus', 'Ranger', 'Territory'],
  Honda: ['Accord', 'City', 'Civic', 'CR-V', 'Fit', 'HR-V'],
  Hyundai: ['Accent', 'Elantra', 'Grand i10', 'Kona', 'Santa Fe', 'Tucson'],
  Jeep: ['Cherokee', 'Compass', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  Kia: ['Cerato', 'Picanto', 'Rio', 'Seltos', 'Sorento', 'Sportage'],
  Mazda: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-9'],
  'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLB', 'GLC', 'GLE'],
  Mitsubishi: ['ASX', 'L200', 'Montero', 'Outlander'],
  Nissan: ['Frontier', 'Kicks', 'March', 'Sentra', 'Versa', 'X-Trail'],
  Peugeot: ['208', '2008', '3008', '5008', 'Partner'],
  Renault: ['Captur', 'Duster', 'Kwid', 'Logan', 'Sandero', 'Stepway'],
  Subaru: ['Forester', 'Impreza', 'Outback', 'XV'],
  Suzuki: ['Alto', 'Baleno', 'Jimny', 'Swift', 'Vitara'],
  Toyota: ['Corolla', 'Corolla Cross', 'Fortuner', 'Hilux', 'Prado', 'RAV4', 'Yaris'],
  Volkswagen: ['Amarok', 'Gol', 'Jetta', 'Nivus', 'Polo', 'Taos', 'T-Cross', 'Tiguan'],
  Volvo: ['S60', 'XC40', 'XC60', 'XC90'],
}
const mecanicosDisponibles = [
  'Carlos Ramírez',
  'Andrés Gómez',
  'Juan Pérez',
  'Miguel Torres',
  'David Rodríguez',
]
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
const authStore = useAuthStore()
const workshop = useWorkshopStore()
const {
  searchMode: tipoBusqueda,
  clienteEncontrado,
  vehiculosCliente,
  vehiculo,
  historial,
  ordenes,
  historialGeneral,
  clientes,
  vehiculos,
} = storeToRefs(workshop)
const termino = ref('')
const cargando = ref(false)
const guardando = ref(false)
const cargandoSeguimiento = ref(false)
const error = ref('')
const aviso = ref('')

function cerrarSesion() {
  authStore.logout()
  router.replace({ name: 'login' })
}
const noEncontrado = ref(false)
const propietarioExistente = ref(false)
const filtroSeguimiento = ref('')
const filtroHistorialTexto = ref('')
const edicionesOrden = reactive({})
const abonosOrden = reactive({})
const guardandoOrdenId = ref('')
const etapaRegistro = ref(1)

const propietarioForm = reactive({
  nombre: '',
  cedula: '',
  telefono: '',
  email: '',
})
const vehiculoForm = reactive({
  placa: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  kilometraje: '',
})
const marcaSeleccionada = ref('')
const marcaManual = ref('')
const modeloSeleccionado = ref('')
const modeloManual = ref('')
const modelosDisponibles = computed(() => modelosPorMarca[marcaSeleccionada.value] || [])
const ordenForm = reactive({
  tiposReparacion: [],
  otroTipo: '',
  costoRepuestos: 0,
  manoObra: 0,
  mecanico: '',
  mecanicoPersonalizado: '',
  fechaIngreso: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
})
const costosTexto = reactive({
  costoRepuestos: '0',
  manoObra: '0',
})

watch(marcaSeleccionada, (marca) => {
  vehiculoForm.marca = marca === valorOtro ? marcaManual.value : marca
  vehiculoForm.modelo = ''
  modeloSeleccionado.value = ''
  modeloManual.value = ''
})

watch(marcaManual, (marca) => {
  if (marcaSeleccionada.value === valorOtro) vehiculoForm.marca = marca
})

watch(modeloSeleccionado, (modelo) => {
  vehiculoForm.modelo = modelo === valorOtro ? modeloManual.value : modelo
})

watch(modeloManual, (modelo) => {
  if (modeloSeleccionado.value === valorOtro) vehiculoForm.modelo = modelo
})

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

const ordenesEntregadas = computed(() =>
  [...(historialGeneral.value || [])]
    .filter((orden) => orden.estado === 'Entregado')
    .sort((a, b) => new Date(b.fechaEntrega || b.fechaIngreso) - new Date(a.fechaEntrega || a.fechaIngreso)),
)

const estadoResumenSeleccionado = ref('')
const cargandoResumen = ref(false)

const metadatosEstadoResumen = {
  recibidos: {
    titulo: 'Vehículos recibidos',
    descripcion: 'Vehículos que acaban de ingresar al taller y esperan evaluación inicial.',
    mensajeVacio: 'No hay vehículos en estado Recibido en este momento.',
  },
  diagnostico: {
    titulo: 'Vehículos en diagnóstico',
    descripcion: 'Vehículos que están siendo evaluados para identificar sus fallas.',
    mensajeVacio: 'No hay vehículos en diagnóstico actualmente.',
  },
  reparacion: {
    titulo: 'Vehículos en reparación',
    descripcion: 'Vehículos con trabajos de reparación actualmente en ejecución.',
    mensajeVacio: 'No hay vehículos en reparación en este momento.',
  },
  proceso: {
    titulo: 'Vehículos en proceso',
    descripcion: 'Vehículos con trabajos pendientes o actividades en curso dentro del taller.',
    mensajeVacio: 'No hay vehículos con órdenes en proceso actualmente.',
  },
  listos: {
    titulo: 'Vehículos listos',
    descripcion: 'Vehículos cuya reparación ha terminado y están listos para su entrega.',
    mensajeVacio: 'No hay vehículos listos para entrega en este momento.',
  },
}

const ordenesActivasUnicas = computed(() => {
  const vistos = new Set()
  return (ordenes.value || []).filter((orden) => {
    if (!orden || !orden._id || !orden.vehiculo || orden.estado === 'Entregado') return false
    const id = String(orden._id)
    if (vistos.has(id)) return false
    vistos.add(id)
    return true
  })
})

const ordenesPorEstadoResumen = computed(() => ({
  recibidos: ordenesActivasUnicas.value.filter((orden) => orden.estado === 'Recibido'),
  diagnostico: ordenesActivasUnicas.value.filter((orden) => orden.estado === 'En Diagnóstico'),
  reparacion: ordenesActivasUnicas.value.filter((orden) => orden.estado === 'En Reparación'),
  proceso: ordenesActivasUnicas.value.filter((orden) =>
    ['Recibido', 'En Diagnóstico', 'En Reparación'].includes(orden.estado),
  ),
  listos: ordenesActivasUnicas.value.filter((orden) => orden.estado === 'Listo'),
}))

const resumenOrdenes = computed(() => ({
  enProceso: ordenesPorEstadoResumen.value.proceso.length,
  listos: ordenesPorEstadoResumen.value.listos.length,
  diagnostico: ordenesPorEstadoResumen.value.diagnostico.length,
  recibidos: ordenesPorEstadoResumen.value.recibidos.length,
  reparacion: ordenesPorEstadoResumen.value.reparacion.length,
}))

const infoEstadoSeleccionado = computed(
  () => metadatosEstadoResumen[estadoResumenSeleccionado.value] || null,
)

const ordenesEstadoSeleccionado = computed(() => {
  const lista = ordenesPorEstadoResumen.value[estadoResumenSeleccionado.value] || []
  return [...lista].sort(
    (a, b) => new Date(b.fechaIngreso || b.createdAt) - new Date(a.fechaIngreso || a.createdAt),
  )
})

const historialEntregados = computed(() =>
  (historial.value || []).filter((orden) => orden.estado === 'Entregado'),
)

const historialGeneralOrdenado = computed(() => {
  const filtro = filtroHistorialTexto.value.trim().toLocaleLowerCase()

  return [...(historialGeneral.value || [])]
    .filter((orden) => {
      const vehiculo = orden.vehiculo || {}
      const cliente = vehiculo.cliente || {}
      const coincideTexto = !filtro || [
        vehiculo.placa,
        vehiculo.marca,
        vehiculo.modelo,
        cliente.nombre,
        cliente.apellido,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(filtro)

      return coincideTexto
    })
    .sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso))
})

function limpiarFiltrosHistorial() {
  filtroHistorialTexto.value = ''
}

function limpiarMensajes() {
  error.value = ''
  aviso.value = ''
}

function limpiarMarcaYModelo() {
  marcaSeleccionada.value = ''
  marcaManual.value = ''
  vehiculoForm.marca = ''
  modeloSeleccionado.value = ''
  modeloManual.value = ''
  vehiculoForm.modelo = ''
}

function abrirBusqueda() {
  cerrarGestion()
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
  propietarioForm.nombre = ''
  propietarioForm.email = ''
  vehiculoForm.kilometraje = ''
  limpiarMarcaYModelo()
  if (tipoBusqueda.value === 'placa') {
    vehiculoForm.placa = termino.value.trim().toUpperCase()
    propietarioForm.cedula = ''
    propietarioForm.telefono = ''
  } else {
    propietarioForm.cedula = termino.value.trim()
    propietarioForm.telefono = ''
    vehiculoForm.placa = ''
  }
}

function cambiarMarca() {
  modeloSeleccionado.value = ''
  modeloPersonalizado.value = ''
}

async function buscar() {
  const valor = termino.value.trim()
  if (!valor) { error.value = tipoBusqueda.value === 'placa' ? 'Escribe la placa del vehículo.' : 'Escribe la cédula del propietario.'; return }
  if (tipoBusqueda.value === 'placa' && !/^[A-Za-z0-9]{5,8}$/.test(valor.replace(/[\s-]/g, ''))) { error.value = 'La placa debe tener entre 5 y 8 letras o números.'; return }
  if (tipoBusqueda.value === 'cedula' && !/^[A-Za-z0-9 .-]{5,20}$/.test(valor)) { error.value = 'La cédula debe tener entre 5 y 20 caracteres válidos.'; return }
  cargando.value = true
  limpiarMensajes()
  noEncontrado.value = false
  etapaRegistro.value = 1
  propietarioExistente.value = false
  limpiarMarcaYModelo()
  workshop.limpiarBusqueda()
  try {
    if (tipoBusqueda.value === 'placa') { abrirFicha(await workshop.buscarPorPlaca(valor)); return }
    const resultado = await workshop.buscarPorCedula(valor)
    if (resultado.vehiculos.length === 1) await seleccionarVehiculo(resultado.vehiculos[0])
    else if (!resultado.vehiculos.length) {
      noEncontrado.value = true
      propietarioForm.nombre = [resultado.cliente.nombre, resultado.cliente.apellido].filter(Boolean).join(' ')
      propietarioForm.cedula = resultado.cliente.cedula
      propietarioForm.telefono = resultado.cliente.telefono || ''
      propietarioForm.email = resultado.cliente.email || ''
      etapaRegistro.value = 2
      propietarioExistente.value = true
    }
  } catch (err) {
    if (err.status === 404) {
      noEncontrado.value = true
      if (tipoBusqueda.value === 'cedula') { propietarioForm.cedula = valor; propietarioForm.nombre = ''; propietarioForm.telefono = ''; propietarioForm.email = ''; vehiculoForm.placa = '' }
      else { vehiculoForm.placa = valor.toUpperCase(); propietarioForm.nombre = ''; propietarioForm.cedula = ''; propietarioForm.telefono = ''; propietarioForm.email = '' }
    } else error.value = err.message || 'No fue posible completar la búsqueda.'
  } finally { cargando.value = false }
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
  limpiarMensajes()
  const nombreCompleto = propietarioForm.nombre.trim().replace(/\s+/g, ' ')
  const cedula = propietarioForm.cedula.trim()
  const telefono = propietarioForm.telefono.trim()
  const email = propietarioForm.email.trim()
  if (nombreCompleto.length < 2 || nombreCompleto.length > 80) { error.value = 'Escribe un nombre de al menos 2 caracteres y máximo 80.'; return }
  if (!/^[\p{L} .'-]+$/u.test(nombreCompleto)) { error.value = 'El nombre solo puede contener letras, espacios, puntos, apóstrofes o guiones.'; return }
  if (!/^[\p{L}\p{N} .-]{5,20}$/u.test(cedula)) { error.value = 'La cédula debe tener entre 5 y 20 caracteres válidos.'; return }
  const digitosTelefono = telefono.replace(/\D/g, '')
  if (!/^[+()\d .-]+$/.test(telefono) || digitosTelefono.length < 7 || digitosTelefono.length > 15) { error.value = 'El teléfono debe tener entre 7 y 15 dígitos.'; return }
  if (email && !esCorreoValido(email)) { error.value = 'Ingresa un correo electrónico válido.'; return }
  guardando.value = true
  const partesNombre = nombreCompleto.split(' ')
  try {
    await workshop.registrarCliente({ nombre: partesNombre.shift() || '', apellido: partesNombre.join(' '), cedula, telefono, email })
    etapaRegistro.value = 2
  } catch (err) { error.value = err.message || 'No fue posible registrar al propietario.' }
  finally { guardando.value = false }
}

async function registrarVehiculo() {
  limpiarMensajes()
  const placa = vehiculoForm.placa.trim()
  const marca = vehiculoForm.marca.trim()
  const modelo = vehiculoForm.modelo.trim()
  const kilometrajeIngresado = vehiculoForm.kilometraje
  if (kilometrajeIngresado === '' || kilometrajeIngresado === null || kilometrajeIngresado === undefined) { error.value = 'Ingresa el kilometraje actual del vehículo.'; return }
  const kilometraje = Number(kilometrajeIngresado)
  if (!/^[A-Za-z0-9]{5,8}$/.test(placa.replace(/[\s-]/g, ''))) { error.value = 'La placa debe tener entre 5 y 8 letras o números.'; return }
  if (marca.length < 2 || marca.length > 80) { error.value = 'La marca debe tener entre 2 y 80 caracteres.'; return }
  if (!modelo || modelo.length > 80) { error.value = 'El modelo debe tener entre 1 y 80 caracteres.'; return }
  if (!Number.isInteger(Number(vehiculoForm.anio)) || Number(vehiculoForm.anio) < 1900 || Number(vehiculoForm.anio) > new Date().getFullYear() + 1) { error.value = 'El año del vehículo no es válido.'; return }
  if (!Number.isSafeInteger(kilometraje) || kilometraje < 0 || kilometraje > 2000000) { error.value = 'Ingresa el kilometraje actual como un entero entre 0 y 2.000.000.'; return }
  guardando.value = true
  try {
    const nuevo = await workshop.registrarVehiculo({ ...vehiculoForm, placa: placa.toUpperCase(), marca, modelo, anio: Number(vehiculoForm.anio), kilometraje })
    pantalla.value = 'ficha'; noEncontrado.value = false; aviso.value = 'Vehículo registrado. Ya puedes crear su primera orden.'
    router.push({ name: 'ficha-vehiculo', params: { placa: nuevo.placa } })
  } catch (err) { error.value = err.message || 'No fue posible registrar el vehículo.' }
  finally { guardando.value = false }
}

function abrirNuevaOrden() {
  ordenForm.tiposReparacion = []
  ordenForm.otroTipo = ''
  ordenForm.costoRepuestos = 0
  ordenForm.manoObra = 0
  costosTexto.costoRepuestos = '0'
  costosTexto.manoObra = '0'
  ordenForm.mecanico = ''
  ordenForm.mecanicoPersonalizado = ''
  const ahora = new Date()
  ordenForm.fechaIngreso = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  pantalla.value = 'orden'
  limpiarMensajes()
  router.push({ name: 'nueva-orden', params: { placa: vehiculo.value.placa } })
}

function actualizarCosto(event, campo) {
  const input = event.target
  const digitosAntesDelCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length
  const digitos = input.value.replace(/\D/g, '').slice(0, 13)
  const valorFormateado = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  ordenForm[campo] = digitos ? Number(digitos) : ''
  costosTexto[campo] = valorFormateado
  input.value = valorFormateado

  let cursor = 0
  let digitosContados = 0
  while (cursor < valorFormateado.length && digitosContados < digitosAntesDelCursor) {
    if (/\d/.test(valorFormateado[cursor])) digitosContados += 1
    cursor += 1
  }
  input.setSelectionRange(cursor, cursor)
}

async function guardarOrden() {
  limpiarMensajes()
  const tipos = [...new Set(ordenForm.tiposReparacion.filter(Boolean))]
  if (!tipos.length) { error.value = 'Selecciona al menos un tipo de reparación.'; return }
  if (tipos.includes('Otro') && ordenForm.otroTipo.trim().length < 3) { error.value = 'Describe la reparación seleccionada como "Otro" (mínimo 3 caracteres).'; return }
  const repuestos = ordenForm.costoRepuestos === '' ? 0 : Number(ordenForm.costoRepuestos)
  const manoObra = ordenForm.manoObra === '' ? 0 : Number(ordenForm.manoObra)
  if (!Number.isSafeInteger(repuestos) || repuestos < 0 || !Number.isSafeInteger(manoObra) || manoObra < 0 || repuestos + manoObra > 1000000000000) { error.value = 'Los costos de repuestos y mano de obra deben ser enteros no negativos y el total no puede superar 1.000.000.000.000 COP.'; return }
  const mecanicoAsignado = ordenForm.mecanico === 'Otro'
    ? ordenForm.mecanicoPersonalizado.trim()
    : ordenForm.mecanico.trim()
  if (ordenForm.mecanico === 'Otro' && mecanicoAsignado.length < 2) { error.value = 'El nombre del mecánico debe tener al menos 2 caracteres.'; return }
  if (mecanicoAsignado.length > 100) { error.value = 'El nombre del mecánico no puede superar los 100 caracteres.'; return }
  guardando.value = true
  try {
    await workshop.crearOrdenReparacion({
      descripcionProblema: tipos.map((tipo) => tipo === 'Otro' ? ordenForm.otroTipo.trim() : tipo).join(', '),
      costoRepuestos: repuestos,
      manoObra,
      mecanico: mecanicoAsignado,
    })
    pantalla.value = 'ficha'
    aviso.value = 'La orden se creó en estado Recibido.'
    router.push({ name: 'ficha-vehiculo', params: { placa: vehiculo.value.placa } })
  } catch (err) { error.value = err.message || 'No fue posible crear la orden.' }
  finally { guardando.value = false }
}

async function abrirHistorial() {
  cerrarGestion()
  pantalla.value = 'historial'
  limpiarMensajes()
  if (route.name !== 'historial') {
    await router.push({ name: 'historial', query: {} })
    return
  }
  if (route.query.estado) await router.replace({ name: 'historial', query: {} })
  await cargarHistorialGeneral()
}

async function abrirEntregados() {
  cerrarGestion()
  pantalla.value = 'entregados'
  limpiarMensajes()
  if (route.name !== 'historial' || route.query.estado !== 'entregado') {
    await router.push({ name: 'historial', query: { estado: 'entregado' } })
    return
  }
  await cargarHistorialGeneral()
}

async function cargarSeguimiento() {
  cerrarGestion()
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

async function cargarResumenOrdenes() {
  cargandoResumen.value = true
  try {
    await workshop.cargarOrdenesActivas()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar el estado de las órdenes.'
  } finally {
    cargandoResumen.value = false
  }
}

async function seleccionarEstadoResumen(clave) {
  if (estadoResumenSeleccionado.value === clave) {
    estadoResumenSeleccionado.value = ''
    return
  }
  estadoResumenSeleccionado.value = clave
  await cargarResumenOrdenes()
}

function cerrarEstadoResumen() {
  estadoResumenSeleccionado.value = ''
}

async function cargarHistorialGeneral() {
  try {
    await workshop.cargarHistorialGeneral()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar el historial general.'
  }
}

async function actualizarEstado(orden, evento) {
  const control = evento?.target
  const estado = typeof evento === 'string' ? evento : control?.value
  limpiarMensajes()
  if (estado === 'Entregado') {
    if (control) control.value = orden.estado
    abrirConfirmacion({
      titulo: 'Confirmar entrega',
      mensaje: 'Confirma que el cliente pagó la cuenta completa y retiró el vehículo.',
      nota: 'La orden pasará al estado Entregado y dejará de aparecer en el tablero de reparaciones activas.',
      textoConfirmar: 'Sí, entregar',
      peligro: false,
      accion: () => workshop.actualizarEstadoOrden(orden, estado).then(() => { aviso.value = 'Orden entregada correctamente.' }),
    })
    return
  }
  try {
    if (!obtenerEstadosDisponibles(orden.estado).includes(estado)) throw new Error('No puedes saltarte etapas del proceso. Avanza en orden.')
    await workshop.actualizarEstadoOrden(orden, estado)
  } catch (err) {
    if (control) control.value = orden.estado
    error.value = err.message || 'No fue posible actualizar el estado.'
  }
}

async function registrarAbonoEnOrden(orden) {
  const abono = Number(abonosOrden[orden._id])
  try {
    limpiarMensajes()
    const actualizada = await workshop.registrarAbonoOrden(orden, abono)
    orden.montoPagado = actualizada.montoPagado
    orden.pagado = actualizada.pagado
    abonosOrden[orden._id] = ''
    aviso.value = `Abono registrado. Saldo pendiente: ${formatoDinero(Math.max(0, Number(orden.monto) - Number(orden.montoPagado || 0)))}.`
  } catch (err) { error.value = err.message || 'No fue posible registrar el abono.' }
}

function obtenerEdicionOrden(orden) {
  if (!edicionesOrden[orden._id]) {
    const mecanico = orden.mecanico || ''
    const mecanicoEspecificado = mecanicosDisponibles.includes(mecanico)
    edicionesOrden[orden._id] = {
      diagnostico: orden.diagnostico || '',
      trabajosRealizados: orden.trabajosRealizados || '',
      mecanico: mecanicoEspecificado ? mecanico : (mecanico ? 'Otro' : ''),
      mecanicoPersonalizado: mecanicoEspecificado ? '' : mecanico,
      costoRepuestos: orden.costoRepuestos ?? 0,
      manoObra: orden.manoObra ?? (orden.costoRepuestos == null ? Number(orden.monto) || 0 : 0),
    }
  }
  return edicionesOrden[orden._id]
}

function formatearCostoOrden(valor) {
  if (valor === '' || valor === null || valor === undefined) return ''
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(valor) || 0)
}

function actualizarCostoOrden(evento, orden, campo) {
  const input = evento.target
  const digitosAntesDelCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length
  const digitos = input.value.replace(/\D/g, '').slice(0, 13)
  const valor = digitos ? Number(digitos) : ''
  const texto = formatearCostoOrden(valor)
  obtenerEdicionOrden(orden)[campo] = valor
  input.value = texto

  let cursor = 0
  let digitosContados = 0
  while (cursor < texto.length && digitosContados < digitosAntesDelCursor) {
    if (/\d/.test(texto[cursor])) digitosContados += 1
    cursor += 1
  }
  input.setSelectionRange(cursor, cursor)
}

async function guardarDetallesOrden(orden) {
  const datos = obtenerEdicionOrden(orden)
  const diagnostico = datos.diagnostico.trim()
  const trabajosRealizados = datos.trabajosRealizados.trim()
  const mecanico = datos.mecanico === 'Otro'
    ? datos.mecanicoPersonalizado.trim()
    : datos.mecanico.trim()
  const repuestos = Number(datos.costoRepuestos || 0)
  const manoObra = Number(datos.manoObra || 0)
  if ((diagnostico && diagnostico.length < 3) || diagnostico.length > 5000) { error.value = 'El diagnóstico debe tener al menos 3 caracteres o quedar vacío (máximo 5.000).'; return }
  if ((trabajosRealizados && trabajosRealizados.length < 3) || trabajosRealizados.length > 5000) { error.value = 'Los trabajos realizados deben tener al menos 3 caracteres o quedar vacíos (máximo 5.000).'; return }
  if ((datos.mecanico === 'Otro' && mecanico.length < 2) || (datos.mecanico !== 'Otro' && mecanico && mecanico.length < 2) || mecanico.length > 100) { error.value = 'El mecánico debe tener al menos 2 caracteres o quedar vacío (máximo 100).'; return }
  if (!Number.isSafeInteger(repuestos) || repuestos < 0 || !Number.isSafeInteger(manoObra) || manoObra < 0 || repuestos + manoObra > 1000000000000) { error.value = 'Los costos deben ser enteros no negativos y el total no puede superar 1.000.000.000.000 COP.'; return }
  error.value = ''
  guardandoOrdenId.value = orden._id
  try {
    await workshop.guardarDetallesOrden(orden, { diagnostico, trabajosRealizados, mecanico, costoRepuestos: repuestos, manoObra })
    aviso.value = 'Se guardaron los detalles de la orden.'
  } catch (err) { error.value = err.message || 'No fue posible guardar los detalles de la orden.' }
  finally { guardandoOrdenId.value = '' }
}

/* ------------------------------------------------------------------
 * Diálogos propios (sin alert / confirm del navegador)
 * ------------------------------------------------------------------ */
const dialogo = reactive({
  abierto: false,
  titulo: '',
  mensaje: '',
  nota: '',
  textoConfirmar: 'Aceptar',
  textoCancelar: 'Cancelar',
  peligro: false,
  ocupado: false,
  accion: null,
})

function abrirDialogo(opciones) {
  Object.assign(dialogo, {
    abierto: true,
    titulo: opciones.titulo || 'Confirmar acción',
    mensaje: opciones.mensaje || '',
    nota: opciones.nota || '',
    textoConfirmar: opciones.textoConfirmar || 'Aceptar',
    textoCancelar: opciones.textoCancelar || 'Cancelar',
    peligro: Boolean(opciones.peligro),
    ocupado: false,
    accion: opciones.accion || null,
  })
}

function abrirConfirmacion(opciones) {
  abrirDialogo({
    ...opciones,
    ocupado: true,
    accion: async () => {
      try {
        await opciones.accion()
      } catch (err) {
        error.value = err.message || 'No fue posible completar la acción.'
      } finally {
        dialogo.abierto = false
      }
    },
  })
}

async function ejecutarDialogo() {
  if (!dialogo.accion || dialogo.ocupado) return
  dialogo.ocupado = true
  try {
    await dialogo.accion()
    dialogo.abierto = false
  } finally {
    dialogo.ocupado = false
  }
}

/* ------------------------------------------------------------------
 * Clientes registrados + edición de propietario y vehículo
 * La lógica vive en utils/useGestionClientes.js
 * ------------------------------------------------------------------ */
const {
  modoGestion,
  gestionAbierta,
  cargandoGestion,
  filtroGestion,
  errorGestion,
  editorAbierto,
  guardandoEditor,
  errorEditor,
  editorForm,
  clientesFiltrados,
  vehiculosFiltrados,
  abrirGestionClientes,
  cargarGestion,
  cerrarGestion,
  abrirEditor,
  cerrarEditor,
  guardarEditor,
  borrarClienteGestion,
  borrarVehiculoGestion,
} = useGestionClientes({ aviso, abrirConfirmacion })

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
  () => [route.name, route.params.placa, route.query.estado],
  async ([name, placa, estado]) => {
    if (name === 'buscar') {
      pantalla.value = 'buscar'
      await cargarResumenOrdenes()
      return
    }
    if (name === 'seguimiento') {
      pantalla.value = 'seguimiento'
      await cargarOrdenes()
      return
    }
    if (name === 'historial') {
      pantalla.value = estado === 'entregado' ? 'entregados' : 'historial'
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
    <!-- Sidebar fijo y persistente a la izquierda -->
    <aside
      id="sidebar-drawer"
      class="sidebar-drawer"
      aria-label="Menú de navegación"
    >
      <div class="drawer-header">
        <a class="brand" href="#" @click.prevent="abrirBusqueda">
          <span class="brand-mark"><span class="material-icons">build</span></span>
          <span class="brand-copy"><strong>Torque</strong><small>TALLER MECÁNICO</small></span>
        </a>
      </div>

      <div class="drawer-section-label">NAVEGACIÓN PRINCIPAL</div>

      <nav class="drawer-nav" aria-label="Navegación principal">
        <button
          class="drawer-link"
          type="button"
          :class="{ active: !gestionAbierta && (pantalla === 'buscar' || pantalla === 'ficha' || pantalla === 'orden') }"
          @click="abrirBusqueda"
        >
          <span class="drawer-link-icon"><span class="material-icons">search</span></span>
          <span class="drawer-link-text">Buscar vehículo</span>
        </button>

        <button
          class="drawer-link"
          type="button"
          :class="{ active: gestionAbierta }"
          @click="abrirGestionClientes"
        >
          <span class="drawer-link-icon"><span class="material-icons">groups</span></span>
          <span class="drawer-link-text">Clientes registrados</span>
        </button>

        <button
          class="drawer-link"
          type="button"
          :class="{ active: !gestionAbierta && pantalla === 'seguimiento' }"
          @click="cargarSeguimiento"
        >
          <span class="drawer-link-icon"><span class="material-icons">view_kanban</span></span>
          <span class="drawer-link-text">Seguimiento</span>
        </button>

        <button
          class="drawer-link"
          type="button"
          :class="{ active: !gestionAbierta && pantalla === 'historial' }"
          @click="abrirHistorial"
        >
          <span class="drawer-link-icon"><span class="material-icons">history</span></span>
          <span class="drawer-link-text">Historial</span>
        </button>

        <button
          class="drawer-link"
          type="button"
          :class="{ active: !gestionAbierta && pantalla === 'entregados' }"
          @click="abrirEntregados"
        >
          <span class="drawer-link-icon"><span class="material-icons">task_alt</span></span>
          <span class="drawer-link-text">Entregados</span>
        </button>
      </nav>

      <div class="drawer-footer">
        <button class="drawer-link drawer-logout" type="button" @click="cerrarSesion">
          <span class="drawer-link-icon"><span class="material-icons">logout</span></span>
          <span class="drawer-link-text">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <div class="main-column">

      <main class="page-content">
        <div v-if="error && !noEncontrado" class="feedback error-feedback" role="alert">
          <span class="material-icons">error_outline</span>{{ error }}
          <button aria-label="Cerrar mensaje" @click="error = ''"><span class="material-icons">close</span></button>
        </div>
        <div v-if="aviso" class="feedback success-feedback">
          <span class="material-icons">check_circle</span>{{ aviso }}
          <button aria-label="Cerrar mensaje" @click="aviso = ''"><span class="material-icons">close</span></button>
        </div>

        <template v-if="gestionAbierta">
          <section class="page-heading">
            <div>
              <h1>Clientes registrados</h1>
              <p>Consulta los propietarios, su contacto y los vehículos vinculados.</p>
            </div>
          </section>

          <GestorClientesModal
            v-model:filtro="filtroGestion"
            :modo-gestion="modoGestion"
            :clientes="clientes"
            :vehiculos="vehiculos"
            :clientes-filtrados="clientesFiltrados"
            :vehiculos-filtrados="vehiculosFiltrados"
            :cargando-gestion="cargandoGestion"
            :error-gestion="errorGestion"
            :cerrable="!guardandoEditor"
            @cerrar="cerrarGestion"
            @cambiar-modo="modoGestion = $event"
            @actualizar="cargarGestion"
            @limpiar-error="errorGestion = ''"
            @editar-cliente="abrirEditor($event._id)"
            @eliminar-cliente="borrarClienteGestion($event)"
            @editar-vehiculo="abrirEditor($event.cliente?._id, $event)"
            @eliminar-vehiculo="borrarVehiculoGestion($event)"
          />
        </template>

        <template v-else-if="pantalla === 'buscar'">
          <section class="page-heading">
            <div>
              <h1>Todo en <span class="heading-accent">marcha</span><span class="heading-period">.</span></h1>
              <p>Encuentra un vehículo, revisa su historial o inicia una nueva reparación.</p>
            </div>
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
                    required
                    maxlength="20"
                    autocomplete="off"
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

          <section class="order-summary" aria-label="Estado de las órdenes">
            <div class="summary-label">ESTADO DE LAS ÓRDENES</div>
            <div class="summary-grid">
              <article
                class="summary-card summary-proceso"
                :class="{ 'is-selected': estadoResumenSeleccionado === 'proceso' }"
                role="button"
                tabindex="0"
                :aria-pressed="estadoResumenSeleccionado === 'proceso'"
                @click="seleccionarEstadoResumen('proceso')"
                @keydown.enter.prevent="seleccionarEstadoResumen('proceso')"
                @keydown.space.prevent="seleccionarEstadoResumen('proceso')"
              >
                <span class="summary-dot dot-progress"></span>
                <div><span>En proceso</span><strong>{{ resumenOrdenes.enProceso }}</strong></div>
              </article>
              <article
                class="summary-card summary-recibido"
                :class="{ 'is-selected': estadoResumenSeleccionado === 'recibidos' }"
                role="button"
                tabindex="0"
                :aria-pressed="estadoResumenSeleccionado === 'recibidos'"
                @click="seleccionarEstadoResumen('recibidos')"
                @keydown.enter.prevent="seleccionarEstadoResumen('recibidos')"
                @keydown.space.prevent="seleccionarEstadoResumen('recibidos')"
              >
                <span class="summary-dot dot-received"></span>
                <div><span>Recibidos</span><strong>{{ resumenOrdenes.recibidos }}</strong></div>
              </article>
              <article
                class="summary-card summary-diagnostico"
                :class="{ 'is-selected': estadoResumenSeleccionado === 'diagnostico' }"
                role="button"
                tabindex="0"
                :aria-pressed="estadoResumenSeleccionado === 'diagnostico'"
                @click="seleccionarEstadoResumen('diagnostico')"
                @keydown.enter.prevent="seleccionarEstadoResumen('diagnostico')"
                @keydown.space.prevent="seleccionarEstadoResumen('diagnostico')"
              >
                <span class="summary-dot dot-diagnosis"></span>
                <div><span>En diagnóstico</span><strong>{{ resumenOrdenes.diagnostico }}</strong></div>
              </article>
              <article
                class="summary-card summary-reparacion"
                :class="{ 'is-selected': estadoResumenSeleccionado === 'reparacion' }"
                role="button"
                tabindex="0"
                :aria-pressed="estadoResumenSeleccionado === 'reparacion'"
                @click="seleccionarEstadoResumen('reparacion')"
                @keydown.enter.prevent="seleccionarEstadoResumen('reparacion')"
                @keydown.space.prevent="seleccionarEstadoResumen('reparacion')"
              >
                <span class="summary-dot dot-repair"></span>
                <div><span>En reparación</span><strong>{{ resumenOrdenes.reparacion }}</strong></div>
              </article>
              <article
                class="summary-card summary-listo"
                :class="{ 'is-selected': estadoResumenSeleccionado === 'listos' }"
                role="button"
                tabindex="0"
                :aria-pressed="estadoResumenSeleccionado === 'listos'"
                @click="seleccionarEstadoResumen('listos')"
                @keydown.enter.prevent="seleccionarEstadoResumen('listos')"
                @keydown.space.prevent="seleccionarEstadoResumen('listos')"
              >
                <span class="summary-dot dot-ready"></span>
                <div><span>Listos</span><strong>{{ resumenOrdenes.listos }}</strong></div>
              </article>
            </div>

            <div
              v-if="estadoResumenSeleccionado && infoEstadoSeleccionado"
              class="history-section summary-detail-panel"
              role="region"
              :aria-label="infoEstadoSeleccionado.titulo"
            >
              <div class="section-heading summary-detail-heading">
                <div class="summary-detail-title-group">
                  <div class="summary-detail-title-row">
                    <h2>{{ infoEstadoSeleccionado.titulo }}</h2>
                    <span class="summary-count-badge">{{ ordenesEstadoSeleccionado.length }}</span>
                  </div>
                  <p>{{ infoEstadoSeleccionado.descripcion }}</p>
                </div>
                <div class="summary-detail-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    @click="cerrarEstadoResumen"
                  >
                    <span class="material-icons">arrow_back</span> Regresar al resumen
                  </button>
                </div>
              </div>

              <div v-if="cargandoResumen && !ordenesEstadoSeleccionado.length" class="loading-board">
                <span class="material-icons">autorenew</span> Cargando vehículos del estado seleccionado…
              </div>

              <div v-else-if="ordenesEstadoSeleccionado.length" class="summary-table-wrap">
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
                    <tr v-for="orden in ordenesEstadoSeleccionado" :key="orden._id">
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
                          <button
                            v-if="orden.vehiculo?.placa"
                            type="button"
                            class="summary-action-btn is-primary-soft"
                            title="Ver ficha del vehículo"
                            @click="seleccionarVehiculo(orden.vehiculo)"
                          >
                            <span class="material-icons">visibility</span> Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="empty-state summary-empty-state">
                <div class="empty-icon"><span class="material-icons">directions_car</span></div>
                <strong>{{ infoEstadoSeleccionado.mensajeVacio }}</strong>
                <p>Cuando una orden de servicio se encuentre en este estado, aparecerá listada aquí automáticamente.</p>
                <button type="button" class="secondary-button" @click="cerrarEstadoResumen">
                  <span class="material-icons">arrow_back</span> Regresar al resumen
                </button>
              </div>
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
            <form v-if="etapaRegistro === 1" class="form-grid" @submit.prevent="registrarPropietario" novalidate>
              <label class="field field-wide"><span>Nombre completo <b>*</b></span><input v-model="propietarioForm.nombre" required minlength="2" maxlength="80" autocomplete="name" placeholder="Nombre y apellido" /></label>
              <label class="field"><span>Cédula <b>*</b></span><input v-model="propietarioForm.cedula" required minlength="5" maxlength="20" autocomplete="off" placeholder="Número de identificación" /></label>
              <label class="field"><span>Teléfono <b>*</b></span><input v-model="propietarioForm.telefono" required maxlength="24" type="tel" autocomplete="tel" placeholder="Número de contacto" /></label>
              <label class="field field-wide"><span>Correo electrónico (opcional)</span><input v-model="propietarioForm.email" type="email" maxlength="254" autocomplete="email" placeholder="cliente@ejemplo.com" /></label>
              <div v-if="error" class="feedback error-feedback field-wide" role="alert">{{ error }}</div>
              <div class="form-actions field-wide"><button class="primary-button" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Continuar' }}<span class="material-icons">arrow_forward</span></button></div>
            </form>
            <form v-else class="form-grid" @submit.prevent="registrarVehiculo" novalidate>
              <label class="field"><span>Placa <b>*</b></span><input v-model="vehiculoForm.placa" required minlength="5" maxlength="9" autocomplete="off" placeholder="Ej. ABC-123" /></label>
              <label class="field">
                <span>Marca <b>*</b></span>
                <select v-model="marcaSeleccionada" required>
                  <option value="" disabled>Selecciona una marca</option>
                  <option v-for="marca in marcasVehiculo" :key="marca" :value="marca">{{ marca }}</option>
                  <option :value="valorOtro">Otra marca (escribir)</option>
                </select>
                <input
                  v-if="marcaSeleccionada === valorOtro"
                  v-model="marcaManual"
                  required
                  minlength="2"
                  maxlength="80"
                  placeholder="Escribe la marca"
                />
              </label>
              <label class="field">
                <span>Modelo <b>*</b></span>
                <select v-model="modeloSeleccionado" required :disabled="!marcaSeleccionada">
                  <option value="" disabled>Selecciona un modelo</option>
                  <option v-for="modelo in modelosDisponibles" :key="modelo" :value="modelo">{{ modelo }}</option>
                  <option :value="valorOtro">Otro modelo (escribir)</option>
                </select>
                <input
                  v-if="modeloSeleccionado === valorOtro"
                  v-model="modeloManual"
                  required
                  minlength="1"
                  maxlength="80"
                  placeholder="Escribe el modelo"
                />
              </label>
              <label class="field"><span>Año <b>*</b></span><input v-model.number="vehiculoForm.anio" type="number" min="1900" :max="new Date().getFullYear() + 1" step="1" required /></label>
              <label class="field field-wide"><span>Kilometraje actual <b>*</b></span><input v-model.number="vehiculoForm.kilometraje" type="number" min="0" max="2000000" step="1" inputmode="numeric" required placeholder="Ej. 62500" /></label>
              <div v-if="error" class="feedback error-feedback field-wide" role="alert">{{ error }}</div>
              <div class="form-actions field-wide"><button type="button" class="secondary-button" @click="volverPasoRegistro">{{ propietarioExistente ? 'Volver a búsqueda' : 'Atrás' }}</button><button class="primary-button" :disabled="guardando" :aria-busy="guardando">{{ guardando ? 'Guardando vehículo…' : 'Guardar vehículo' }}<span class="material-icons">{{ guardando ? 'hourglass_top' : 'check' }}</span></button></div>
            </form>
</section>

        </template>

        <template v-else-if="pantalla === 'ficha'">
          <div class="back-link" @click="abrirBusqueda"><span class="material-icons">arrow_back</span> Volver a la búsqueda</div>
          <section class="page-heading vehicle-heading">
            <div><h1>{{ vehiculo?.marca }} {{ vehiculo?.modelo }}</h1><p>Consulta la información del vehículo y sus reparaciones anteriores.</p></div>
            <button class="primary-button" @click="abrirNuevaOrden"><span class="material-icons">add</span> Crear nueva orden</button>
          </section>

          <section class="vehicle-summary">
            <div class="car-emblem"><span class="material-icons">directions_car</span></div>
            <div class="car-primary"><span>PLACA</span><strong>{{ vehiculo?.placa }}</strong><small>{{ vehiculo?.color || 'Vehículo registrado' }}</small></div>
            <div class="summary-divider"></div>
            <div class="car-spec"><span>MARCA Y MODELO</span><strong>{{ vehiculo?.marca }} {{ vehiculo?.modelo }}</strong></div>
            <div class="car-spec"><span>AÑO</span><strong>{{ vehiculo?.anio || '—' }}</strong></div>
            <div class="car-spec"><span>KILOMETRAJE</span><strong>{{ vehiculo?.kilometraje ?? '—' }} km</strong></div>
            <div class="car-owner"><div class="avatar">{{ normalizarTexto(nombrePropietario).slice(0, 2).toUpperCase() }}</div><div><span>PROPIETARIO</span><strong>{{ nombrePropietario }}</strong><small>{{ vehiculo?.cliente?.telefono || vehiculo?.cliente?.cedula || 'Sin contacto registrado' }}</small></div></div>
          </section>

          <section class="history-section">
            <div class="section-heading">
              <div><h2>Historial de reparaciones</h2><p>Todos los trabajos realizados a este vehículo.</p></div>
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
              <div><h2>Historial de entregas</h2><p>Reparaciones ya finalizadas y entregadas al cliente.</p></div>
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
          <section class="page-heading"><div><h1>Nueva orden de reparación</h1><p>Registra el trabajo para {{ vehiculo?.placa }} · {{ vehiculo?.marca }} {{ vehiculo?.modelo }}.</p></div></section>
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
              <label v-if="ordenForm.tiposReparacion.includes('Otro')" class="field field-wide"><span>¿Cuál? <b>*</b></span><input v-model="ordenForm.otroTipo" required maxlength="2000" placeholder="Escribe el tipo de reparación…" /></label>
              <label class="field"><span>Repuestos (COP)</span><div class="money-input"><span>$</span><input :value="costosTexto.costoRepuestos" type="text" inputmode="numeric" autocomplete="off" @input="actualizarCosto($event, 'costoRepuestos')" placeholder="0" /></div></label>
              <label class="field"><span>Mano de obra (COP)</span><div class="money-input"><span>$</span><input :value="costosTexto.manoObra" type="text" inputmode="numeric" autocomplete="off" @input="actualizarCosto($event, 'manoObra')" placeholder="0" /></div></label>
              <div class="field"><span>Total estimado</span><strong>{{ formatoDinero((Number(ordenForm.costoRepuestos) || 0) + (Number(ordenForm.manoObra) || 0)) }}</strong></div>
              <label class="field field-wide">
                <span>Mecánico asignado (opcional)</span>
                <select v-model="ordenForm.mecanico">
                  <option value="">Sin asignar</option>
                  <option v-for="mecanico in mecanicosDisponibles" :key="mecanico" :value="mecanico">{{ mecanico }}</option>
                </select>
              </label>
              <label class="field"><span>Fecha de ingreso <b>*</b></span><div class="money-input"><span class="material-icons">today</span><input :value="ordenForm.fechaIngreso" type="date" readonly disabled /></div></label>
              <div class="field field-wide"><span>Estado inicial</span><strong>Recibido</strong></div>
              <div class="form-actions field-wide"><button type="button" class="secondary-button" @click="pantalla = 'ficha'">Cancelar</button><button class="primary-button" :disabled="guardando">{{ guardando ? 'Creando orden…' : 'Crear orden' }}<span class="material-icons">arrow_forward</span></button></div>
            </form>
          </section>
        </template>

        <template v-else-if="pantalla === 'historial'">
          <section class="page-heading">
            <div><h1>Historial del taller</h1><p>Consulta todas las órdenes registradas, ordenadas por fecha más reciente.</p></div>
          </section>
          <section class="history-section">
            <div class="section-heading">
              <div><h2>Órdenes del taller</h2><p>Todo el historial del servicio organizado por fecha.</p></div>
              <span class="result-count">{{ historialGeneralOrdenado.length }} {{ historialGeneralOrdenado.length === 1 ? 'orden' : 'órdenes' }}</span>
            </div>
            <div class="history-filters" role="search" aria-label="Filtrar historial del taller">
              <label class="history-search-field">
                <span class="material-icons" aria-hidden="true">search</span>
                <input
                  v-model="filtroHistorialTexto"
                  type="search"
                  placeholder="Buscar vehículo, placa o cliente"
                  aria-label="Buscar por vehículo, placa o cliente"
                />
              </label>
              <button
                class="secondary-button history-clear-button"
                type="button"
                :disabled="!filtroHistorialTexto"
                @click="limpiarFiltrosHistorial"
              >
                Limpiar filtros
              </button>
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
            <div v-else class="empty-state">
              <div class="empty-icon"><span class="material-icons">{{ historialGeneral.length ? 'search_off' : 'history' }}</span></div>
              <strong>{{ historialGeneral.length ? 'No hay resultados para estos filtros' : 'No hay historial registrado' }}</strong>
              <p>{{ historialGeneral.length ? 'Prueba con otras fechas, otro vehículo o el nombre del cliente.' : 'Aún no se han creado órdenes en el taller.' }}</p>
              <button v-if="historialGeneral.length" class="secondary-button" type="button" @click="limpiarFiltrosHistorial">Limpiar filtros</button>
            </div>
          </section>
        </template>

        <template v-else-if="pantalla === 'entregados'">
          <section class="page-heading">
            <div><h1>Vehículos entregados</h1><p>Consulta las órdenes que ya fueron entregadas a sus propietarios.</p></div>
          </section>
          <section class="history-section">
            <div class="section-heading">
              <div><h2>Órdenes entregadas</h2><p>Vehículos cuyo proceso de reparación ha finalizado.</p></div>
              <span class="result-count">{{ ordenesEntregadas.length }} {{ ordenesEntregadas.length === 1 ? 'orden' : 'órdenes' }}</span>
            </div>
            <div v-if="ordenesEntregadas.length" class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>FECHA DE ENTREGA</th>
                    <th>VEHÍCULO</th>
                    <th>CLIENTE</th>
                    <th>REPARACIÓN</th>
                    <th>COSTO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="orden in ordenesEntregadas" :key="orden._id">
                    <td>{{ formatoFecha(orden.fechaEntrega) }}</td>
                    <td><strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong><br /><small>{{ orden.vehiculo?.placa }}</small></td>
                    <td>{{ normalizarTexto(orden.vehiculo?.cliente?.nombre || '—') }} {{ normalizarTexto(orden.vehiculo?.cliente?.apellido || '') }}</td>
                    <td>{{ normalizarTexto(orden.descripcionProblema) }}</td>
                    <td class="cost-cell">{{ formatoDinero(orden.monto) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon"><span class="material-icons">task_alt</span></div>
              <strong>No hay vehículos entregados</strong>
              <p>Cuando una orden pase al estado Entregado, aparecerá en esta lista.</p>
            </div>
          </section>
        </template>

        <template v-else-if="pantalla === 'seguimiento'">
          <section class="page-heading">
            <div><h1>Seguimiento de órdenes</h1><p>Visualiza el avance de cada reparación activa.</p></div>
          </section>
          <section class="tracker-toolbar">
            <div class="tracker-title"><div class="panel-icon"><span class="material-icons">view_kanban</span></div><div><h2>Tablero de reparaciones</h2><p>{{ ordenes.length }} órdenes activas en el taller</p></div></div>
            <label class="filter-input"><span class="material-icons">search</span><input v-model="filtroSeguimiento" placeholder="Filtrar por cliente o vehículo" /><span class="filter-shortcut">⌘ K</span></label>
          </section>
          <div v-if="cargandoSeguimiento" class="loading-board"><span class="material-icons">autorenew</span> Cargando órdenes…</div>
          <section v-else class="kanban-board">
            <div v-for="(grupo, index) in gruposOrdenes.slice(0, 4)" :key="grupo.estado" class="kanban-column">
              <div class="kanban-header"><span class="kanban-dot" :class="`dot-${index}`"></span><strong>{{ grupo.estado }}</strong><span class="column-count">{{ grupo.ordenes.length }}</span></div>
              <article v-for="orden in grupo.ordenes" :key="orden._id" :class="['order-card', `card-${orden.estado.toLowerCase().replaceAll(' ', '-')}`]">
                <div class="order-card-top"><span class="order-ref">ORD-{{ String(orden._id).slice(-5).toUpperCase() }}</span><span class="material-icons">more_horiz</span></div>
                <h3>{{ normalizarTexto(orden.descripcionProblema) }}</h3>
                <div class="order-car"><span class="material-icons">directions_car</span><strong>{{ normalizarTexto(orden.vehiculo?.marca) }} {{ normalizarTexto(orden.vehiculo?.modelo) }}</strong></div>
                <div class="order-plate">{{ orden.vehiculo?.placa }}</div>
                <div class="order-client"><div class="avatar small-avatar">{{ normalizarTexto(orden.vehiculo?.cliente?.nombre || 'CL').slice(0, 2).toUpperCase() }}</div><span>{{ normalizarTexto(orden.vehiculo?.cliente?.nombre) }} {{ normalizarTexto(orden.vehiculo?.cliente?.apellido) }}</span><span class="order-date">{{ formatoFecha(orden.fechaIngreso) }}</span></div>
                <div class="order-card-footer"><strong>{{ formatoDinero(orden.monto) }}</strong><select :value="orden.estado" aria-label="Actualizar estado" @change="actualizarEstado(orden, $event)"><option v-for="estado in obtenerEstadosOrden(orden)" :key="estado" :value="estado">{{ estado }}</option></select></div>
                <div class="order-payment">
                  <small>Pagado: {{ formatoDinero(orden.montoPagado || (orden.pagado ? orden.monto : 0)) }} · Saldo: {{ formatoDinero(Math.max(0, Number(orden.monto) - Number(orden.montoPagado || (orden.pagado ? orden.monto : 0)))) }}</small>
                  <div v-if="orden.estado !== 'Entregado' && Number(orden.monto) > Number(orden.montoPagado || (orden.pagado ? orden.monto : 0))" class="order-payment-entry">
                    <input v-model="abonosOrden[orden._id]" type="number" min="1" :max="Number(orden.monto) - Number(orden.montoPagado || 0)" step="1" placeholder="Valor del abono (COP)" aria-label="Valor del abono en pesos" />
                    <button type="button" class="secondary-button" :disabled="!Number(abonosOrden[orden._id])" @click="registrarAbonoEnOrden(orden)">Registrar abono</button>
                  </div>
                  <small v-else-if="orden.pagado" class="payment-complete">Cuenta pagada en su totalidad</small>
                </div>

                <details class="order-edit">
                  <summary>Diagnóstico, trabajo y costos</summary>
                  <div class="order-edit-fields">
                    <label>Diagnóstico<textarea v-model="obtenerEdicionOrden(orden).diagnostico" maxlength="5000" rows="2" placeholder="Qué se encontró"></textarea></label>
                    <label>Trabajo realizado<textarea v-model="obtenerEdicionOrden(orden).trabajosRealizados" maxlength="5000" rows="2" placeholder="Qué se reparó"></textarea></label>
                    <label>Mecánico
                      <select v-model="obtenerEdicionOrden(orden).mecanico">
                        <option v-if="obtenerEdicionOrden(orden).mecanico && !mecanicosDisponibles.includes(obtenerEdicionOrden(orden).mecanico)" :value="obtenerEdicionOrden(orden).mecanico">{{ obtenerEdicionOrden(orden).mecanico }}</option>
                        <option value="">Sin asignar</option>
                        <option v-for="mecanico in mecanicosDisponibles" :key="mecanico" :value="mecanico">{{ mecanico }}</option>
                      </select>
                    </label>
                    <label>Repuestos (COP)<input :value="formatearCostoOrden(obtenerEdicionOrden(orden).costoRepuestos)" type="text" inputmode="numeric" autocomplete="off" placeholder="0" @input="actualizarCostoOrden($event, orden, 'costoRepuestos')"></label>
                    <label>Mano de obra (COP)<input :value="formatearCostoOrden(obtenerEdicionOrden(orden).manoObra)" type="text" inputmode="numeric" autocomplete="off" placeholder="0" @input="actualizarCostoOrden($event, orden, 'manoObra')"></label>
                    <strong>Total: {{ formatoDinero((Number(obtenerEdicionOrden(orden).costoRepuestos) || 0) + (Number(obtenerEdicionOrden(orden).manoObra) || 0)) }}</strong>
                    <button type="button" class="primary-button" :disabled="guardandoOrdenId === orden._id" @click="guardarDetallesOrden(orden)">{{ guardandoOrdenId === orden._id ? 'Guardando…' : 'Guardar cambios' }}</button>
                  </div>
                </details>
</article>
              <div v-if="!grupo.ordenes.length" class="column-empty">No hay órdenes en esta etapa.</div>
            </div>
          </section>
          <div v-if="!cargandoSeguimiento && !ordenesFiltradas.length && !error" class="empty-state board-empty"><div class="empty-icon"><span class="material-icons">task_alt</span></div><strong>{{ filtroSeguimiento ? 'No hay resultados' : 'Todo al día' }}</strong><p>{{ filtroSeguimiento ? 'Prueba con otro nombre o placa.' : 'No hay órdenes activas en el taller por ahora.' }}</p><button class="secondary-button" @click="abrirBusqueda"><span class="material-icons">search</span> Buscar vehículo</button></div>
        </template>

      </main>
    </div>

    <!-- Edición conjunta: propietario + vehículo -->
    <EditorClienteVehiculo
      v-if="editorAbierto"
      v-model:form="editorForm"
      :guardando="guardandoEditor"
      :error="errorEditor"
      @cerrar="cerrarEditor"
      @guardar="guardarEditor"
    />

    <!-- Confirmaciones (reemplazan confirm() del navegador) -->
    <ModalDialogo
      v-if="dialogo.abierto"
      :titulo="dialogo.titulo"
      ancho="460px"
      :cerrable="!dialogo.ocupado"
      @cerrar="dialogo.abierto = false"
    >
      <q-item-label class="confirm-copy">{{ dialogo.mensaje }}</q-item-label>
      <q-item-label v-if="dialogo.nota" class="confirm-note">{{ dialogo.nota }}</q-item-label>
      <template #pie>
        <q-btn
          flat
          no-caps
          class="secondary-button"
          :label="dialogo.textoCancelar"
          :disable="dialogo.ocupado"
          @click="dialogo.abierto = false"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="primary-button"
          :class="{ 'danger-button': dialogo.peligro }"
          :label="dialogo.ocupado ? 'Procesando…' : dialogo.textoConfirmar"
          :loading="dialogo.ocupado"
          :disable="dialogo.ocupado"
          @click="ejecutarDialogo"
        />
      </template>
    </ModalDialogo>
  </div>
</template>
