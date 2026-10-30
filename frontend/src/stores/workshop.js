import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  buscarClientePorCedula,
  consultarEstadoPublicoPorPlaca,
  buscarVehiculoPorPlaca,
  cambiarEstadoOrden,
  registrarAbono,
  actualizarOrden,
  crearCliente,
  crearOrden,
  crearVehiculo,
  consultarVehiculosPorCedula,
  obtenerOrdenes,
  obtenerOrdenesActivas,
  obtenerClientes,
  obtenerVehiculos,
  actualizarCliente,
  actualizarVehiculo,
  eliminarCliente,
  eliminarVehiculo,
} from '../services/api'

function nombreCliente(cliente) {
  if (!cliente) return ''
  return [cliente.nombre, cliente.apellido].filter(Boolean).join(' ')
}

function reemplazarEn(lista, item) {
  return lista.map((elemento) => (elemento._id === item._id ? { ...elemento, ...item } : elemento))
}

export const estadosSecuencia = [
  'Recibido',
  'En Diagnóstico',
  'En Reparación',
  'Listo',
  'Entregado',
]

export function obtenerEstadosDisponibles(estadoActual) {
  const indiceActual = estadosSecuencia.indexOf(estadoActual)
  if (indiceActual === -1) return [estadoActual]

  return estadosSecuencia.slice(indiceActual, indiceActual + 2)
}

export function validarTransicionEstado(estadoActual, estadoDestino) {
  const indiceActual = estadosSecuencia.indexOf(estadoActual)
  const indiceDestino = estadosSecuencia.indexOf(estadoDestino)

  if (indiceActual === -1 || indiceDestino === -1) return false
  if (estadoDestino === estadoActual) return false

  return indiceDestino === indiceActual + 1
}

export function obtenerEstadosOrden(orden) {
  const estados = obtenerEstadosDisponibles(orden.estado)
  const pagado = Number(orden.montoPagado || (orden.pagado ? orden.monto : 0)) >= Number(orden.monto || 0)
  return pagado ? estados : estados.filter((estado) => estado !== 'Entregado')
}

export const useWorkshopStore = defineStore(
  'workshop',
  () => {
    const role = ref('administrador')
    const searchMode = ref('placa')
    const clienteEncontrado = ref(null)
    const vehiculosCliente = ref([])
    const vehiculo = ref(null)
    const historial = ref([])
    const ordenes = ref([])
    const historialGeneral = ref([])
    const clientes = ref([])
    const vehiculos = ref([])

    function guardarFicha(resultado) {
      vehiculo.value = resultado.vehiculo
      historial.value = resultado.historial || []
      clienteEncontrado.value = resultado.vehiculo.cliente || clienteEncontrado.value
    }

    function limpiarBusqueda() {
      clienteEncontrado.value = null
      vehiculosCliente.value = []
      vehiculo.value = null
      historial.value = []
    }

    async function buscarPorPlaca(placa) {
      const resultado = await buscarVehiculoPorPlaca(placa)
      guardarFicha(resultado)
      return resultado
    }

    async function consultarEstadoPorPlaca(placa) {
      const resultado = await consultarEstadoPublicoPorPlaca(placa)
      guardarFicha(resultado)
      return resultado
    }

    async function consultarPorCedula(cedula) {
      const resultado = await consultarVehiculosPorCedula(cedula)
      clienteEncontrado.value = { _id: resultado.clienteId }
      vehiculosCliente.value = resultado.vehiculos
      return resultado
    }

    async function buscarPorCedula(cedula) {
      const resultado = await buscarClientePorCedula(cedula)
      clienteEncontrado.value = resultado.cliente
      vehiculosCliente.value = resultado.vehiculos
      return resultado
    }

    async function seleccionarVehiculo(auto) {
      if (role.value === 'usuario') {
        return consultarEstadoPorPlaca(auto.placa)
      }
      return buscarPorPlaca(auto.placa)
    }

    async function registrarCliente(cliente) {
      clienteEncontrado.value = await crearCliente(cliente)
      clientes.value.unshift(clienteEncontrado.value)
      return clienteEncontrado.value
    }

    async function cargarClientes() {
      clientes.value = await obtenerClientes()
      return clientes.value
    }

    async function cargarVehiculos() {
      const lista = await obtenerVehiculos()
      vehiculos.value = lista.map((auto) => ({
        ...auto,
        clienteNombre: nombreCliente(auto.cliente),
      }))
      return vehiculos.value
    }

    async function editarCliente(cliente, datos) {
      const actualizado = await actualizarCliente(cliente._id, datos)
      clientes.value = reemplazarEn(clientes.value, actualizado)
      vehiculos.value = vehiculos.value.map((auto) =>
        String(auto.cliente?._id) === String(actualizado._id)
          ? { ...auto, cliente: { ...auto.cliente, ...actualizado }, clienteNombre: nombreCliente(actualizado) }
          : auto,
      )
      ordenes.value = ordenes.value.map((orden) =>
        String(orden.vehiculo?.cliente?._id) === String(actualizado._id)
          ? { ...orden, vehiculo: { ...orden.vehiculo, cliente: { ...orden.vehiculo.cliente, ...actualizado } } }
          : orden,
      )
      if (String(clienteEncontrado.value?._id) === String(actualizado._id)) {
        clienteEncontrado.value = actualizado
      }
      if (String(vehiculo.value?.cliente?._id) === String(actualizado._id)) {
        vehiculo.value = { ...vehiculo.value, cliente: { ...vehiculo.value.cliente, ...actualizado } }
      }
      return actualizado
    }

    async function editarVehiculo(auto, datos) {
      const actualizado = await actualizarVehiculo(auto._id, datos)
      const anterior = vehiculos.value.find((item) => item._id === actualizado._id)?.cliente
      const cliente = anterior || auto.cliente
      vehiculos.value = reemplazarEn(vehiculos.value, {
        ...actualizado,
        cliente,
        clienteNombre: nombreCliente(cliente),
      })
      ordenes.value = ordenes.value.map((orden) =>
        String(orden.vehiculo?._id) === String(actualizado._id)
          ? { ...orden, vehiculo: { ...orden.vehiculo, ...actualizado, cliente: orden.vehiculo?.cliente || cliente } }
          : orden,
      )
      if (vehiculo.value?._id === actualizado._id) {
        vehiculo.value = { ...vehiculo.value, ...actualizado, cliente: vehiculo.value.cliente || cliente }
      }
      return actualizado
    }

    async function borrarCliente(cliente) {
      await eliminarCliente(cliente._id)
      clientes.value = clientes.value.filter((item) => item._id !== cliente._id)
      ordenes.value = ordenes.value.filter(
        (orden) => String(orden.vehiculo?.cliente?._id || orden.vehiculo?.cliente) !== String(cliente._id),
      )
    }

    async function borrarVehiculo(auto) {
      await eliminarVehiculo(auto._id)
      vehiculos.value = vehiculos.value.filter((item) => item._id !== auto._id)
      ordenes.value = ordenes.value.filter(
        (orden) => String(orden.vehiculo?._id || orden.vehiculo) !== String(auto._id),
      )
    }

    async function registrarVehiculo(datosVehiculo) {
      const nuevo = await crearVehiculo({
        ...datosVehiculo,
        cliente: clienteEncontrado.value._id,
      })
      vehiculo.value = { ...nuevo, cliente: clienteEncontrado.value }
      historial.value = []
      if (clientes.value.some((item) => item._id === nuevo.cliente?._id || item._id === String(nuevo.cliente))) {
        vehiculos.value.unshift({
          ...nuevo,
          cliente: clienteEncontrado.value,
          clienteNombre: nombreCliente(clienteEncontrado.value),
        })
      }
      return nuevo
    }

    async function crearOrdenReparacion(datosOrden) {
      const nueva = await crearOrden({
        ...datosOrden,
        vehiculo: vehiculo.value._id,
      })
      historial.value.unshift(nueva)
      const ordenConVehiculo = {
        ...nueva,
        vehiculo: vehiculo.value,
      }
      ordenes.value = [
        ordenConVehiculo,
        ...ordenes.value.filter((item) => String(item._id) !== String(nueva._id)),
      ]
      return nueva
    }

    async function cargarOrdenesActivas() {
      const lista = await obtenerOrdenesActivas()
      const vistos = new Set()
      ordenes.value = (Array.isArray(lista) ? lista : []).filter((orden) => {
        if (!orden || !orden._id || !orden.vehiculo) return false
        const id = String(orden._id)
        if (vistos.has(id)) return false
        vistos.add(id)
        return true
      })
      return ordenes.value
    }

    async function cargarHistorialGeneral() {
      historialGeneral.value = await obtenerOrdenes()
      return historialGeneral.value
    }

    async function guardarDetallesOrden(orden, datos) {
      const actualizada = await actualizarOrden(orden._id, datos)
      ordenes.value = ordenes.value.map((item) =>
        item._id === actualizada._id ? { ...item, ...actualizada, vehiculo: item.vehiculo } : item,
      )
      historial.value = historial.value.map((item) =>
        item._id === actualizada._id ? { ...item, ...actualizada } : item,
      )
      historialGeneral.value = historialGeneral.value.map((item) =>
        item._id === actualizada._id ? { ...item, ...actualizada, vehiculo: item.vehiculo } : item,
      )
      return actualizada
    }

    async function actualizarEstadoOrden(orden, estado) {
      if (!validarTransicionEstado(orden.estado, estado)) {
        throw new Error(
          `Solo puedes avanzar al siguiente paso del proceso: ${obtenerEstadosDisponibles(orden.estado).join(' → ')}`,
        )
      }

      const montoPagado = Number(orden.montoPagado || (orden.pagado ? orden.monto : 0))
      if (estado === 'Entregado' && montoPagado < Number(orden.monto || 0)) {
        throw new Error('No puedes entregar el vehículo mientras tenga saldo pendiente.')
      }
      const actualizada = await cambiarEstadoOrden(orden._id, estado)
      ordenes.value = ordenes.value
        .map((item) =>
          item._id === actualizada._id
            ? { ...item, estado: actualizada.estado, fechaEntrega: actualizada.fechaEntrega }
            : item,
        )
        .filter((item) => item.estado !== 'Entregado')
      return actualizada
    }

    async function registrarAbonoOrden(orden, abono) {
      const actualizada = await registrarAbono(orden._id, Number(abono))
      ordenes.value = ordenes.value.map((item) =>
        item._id === actualizada._id
          ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado }
          : item,
      )
      historialGeneral.value = historialGeneral.value.map((item) =>
        item._id === actualizada._id
          ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado }
          : item,
      )
      historial.value = historial.value.map((item) =>
        item._id === actualizada._id
          ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado }
          : item,
      )
      return actualizada
    }

    return {
      role,
      searchMode,
      clienteEncontrado,
      vehiculosCliente,
      vehiculo,
      historial,
      ordenes,
      historialGeneral,
      clientes,
      vehiculos,
      buscarPorPlaca,
      consultarEstadoPorPlaca,
      consultarPorCedula,
      buscarPorCedula,
      seleccionarVehiculo,
      registrarCliente,
      cargarClientes,
      cargarVehiculos,
      editarCliente,
      editarVehiculo,
      borrarCliente,
      borrarVehiculo,
      registrarVehiculo,
      crearOrdenReparacion,
      cargarOrdenesActivas,
      cargarHistorialGeneral,
      guardarDetallesOrden,
      actualizarEstadoOrden,
      registrarAbonoOrden,
      guardarFicha,
      limpiarBusqueda,
    }
  },
  {
    persist: {
      pick: ['role', 'searchMode'],
    },
  },
)
