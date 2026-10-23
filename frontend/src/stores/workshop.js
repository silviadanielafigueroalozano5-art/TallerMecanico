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
} from '../services/api'

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

export const useWorkshopStore = defineStore('workshop', {
  state: () => ({
    role: 'administrador',
    searchMode: 'placa',
    clienteEncontrado: null,
    vehiculosCliente: [],
    vehiculo: null,
    historial: [],
    ordenes: [],
    historialGeneral: [],
  }),

  actions: {
    async buscarPorPlaca(placa) {
      const resultado = await buscarVehiculoPorPlaca(placa)
      this.guardarFicha(resultado)
      return resultado
    },

    async consultarEstadoPorPlaca(placa) {
      const resultado = await consultarEstadoPublicoPorPlaca(placa)
      this.guardarFicha(resultado)
      return resultado
    },

    async consultarPorCedula(cedula) {
      const resultado = await consultarVehiculosPorCedula(cedula)
      this.clienteEncontrado = { _id: resultado.clienteId }
      this.vehiculosCliente = resultado.vehiculos
      return resultado
    },

    async buscarPorCedula(cedula) {
      const resultado = await buscarClientePorCedula(cedula)
      this.clienteEncontrado = resultado.cliente
      this.vehiculosCliente = resultado.vehiculos
      return resultado
    },

    async seleccionarVehiculo(vehiculo) {
      if (this.role === 'usuario') {
        return this.consultarEstadoPorPlaca(vehiculo.placa)
      }
      return this.buscarPorPlaca(vehiculo.placa)
    },

    async registrarCliente(cliente) {
      this.clienteEncontrado = await crearCliente(cliente)
      return this.clienteEncontrado
    },

    async registrarVehiculo(datosVehiculo) {
      const nuevo = await crearVehiculo({
        ...datosVehiculo,
        cliente: this.clienteEncontrado._id,
      })
      this.vehiculo = { ...nuevo, cliente: this.clienteEncontrado }
      this.historial = []
      return nuevo
    },

    async crearOrdenReparacion(datosOrden) {
      const nueva = await crearOrden({
        ...datosOrden,
        vehiculo: this.vehiculo._id,
      })
      this.historial.unshift(nueva)
      return nueva
    },

    async cargarOrdenesActivas() {
      this.ordenes = await obtenerOrdenesActivas()
      return this.ordenes
    },

    async cargarHistorialGeneral() {
      this.historialGeneral = await obtenerOrdenes()
      return this.historialGeneral
    },

    async guardarDetallesOrden(orden, datos) {
      const actualizada = await actualizarOrden(orden._id, datos)
      this.ordenes = this.ordenes.map((item) => item._id === actualizada._id ? { ...item, ...actualizada, vehiculo: item.vehiculo } : item)
      this.historial = this.historial.map((item) => item._id === actualizada._id ? { ...item, ...actualizada } : item)
      this.historialGeneral = this.historialGeneral.map((item) => item._id === actualizada._id ? { ...item, ...actualizada, vehiculo: item.vehiculo } : item)
      return actualizada
    },

    async actualizarEstadoOrden(orden, estado) {
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
      this.ordenes = this.ordenes
        .map((item) =>
          item._id === actualizada._id
            ? { ...item, estado: actualizada.estado, fechaEntrega: actualizada.fechaEntrega }
            : item,
        )
        .filter((item) => item.estado !== 'Entregado')
      return actualizada
    },

    async registrarAbonoOrden(orden, abono) {
      const actualizada = await registrarAbono(orden._id, Number(abono))
      this.ordenes = this.ordenes.map((item) => item._id === actualizada._id ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado } : item)
      this.historialGeneral = this.historialGeneral.map((item) => item._id === actualizada._id ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado } : item)
      this.historial = this.historial.map((item) => item._id === actualizada._id ? { ...item, montoPagado: actualizada.montoPagado, pagado: actualizada.pagado } : item)
      return actualizada
    },

    guardarFicha(resultado) {
      this.vehiculo = resultado.vehiculo
      this.historial = resultado.historial || []
      this.clienteEncontrado = resultado.vehiculo.cliente || this.clienteEncontrado
    },

    limpiarBusqueda() {
      this.clienteEncontrado = null
      this.vehiculosCliente = []
      this.vehiculo = null
      this.historial = []
    },
  },

  persist: {
    pick: ['role', 'searchMode'],
  },
})
