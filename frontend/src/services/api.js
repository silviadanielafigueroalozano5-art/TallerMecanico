import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

async function request(promise, mensajePredeterminado) {
  try {
    const respuesta = await promise
    return respuesta.data
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error

    const errorApi = new Error(
      error.response?.data?.mensaje ||
        (error.code === 'ECONNABORTED'
          ? 'La solicitud tardó demasiado. Intenta de nuevo.'
          : error.response
            ? mensajePredeterminado
            : 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'),
    )
    errorApi.status = error.response?.status
    throw errorApi
  }
}

export function buscarVehiculoPorPlaca(placa) {
  return request(
    apiClient.get(`/vehiculos/placa/${encodeURIComponent(placa.trim().toUpperCase())}`),
    'No fue posible buscar el vehículo',
  )
}

export function consultarEstadoPublicoPorPlaca(placa) {
  return request(
    apiClient.get(
      `/vehiculos/placa/${encodeURIComponent(placa.trim().toUpperCase())}/estado`,
    ),
    'No fue posible consultar el estado del vehículo',
  )
}

export function buscarClientePorCedula(cedula) {
  return request(
    apiClient.get(`/clientes/cedula/${encodeURIComponent(cedula.trim())}`),
    'No fue posible buscar el propietario',
  )
}

export function consultarVehiculosPorCedula(cedula) {
  return request(
    apiClient.get(`/clientes/cedula/${encodeURIComponent(cedula.trim())}/estado`),
    'No fue posible consultar vehículos con esa cédula',
  )
}

export function crearCliente(cliente) {
  return request(apiClient.post('/clientes', cliente), 'No fue posible registrar el cliente')
}

export function crearVehiculo(vehiculo) {
  return request(apiClient.post('/vehiculos', vehiculo), 'No fue posible registrar el vehículo')
}

export function crearOrden(orden) {
  return request(
    apiClient.post('/ordenes', orden),
    'No fue posible registrar la orden de reparación',
  )
}

export function cambiarEstadoOrden(id, estado) {
  return request(
    apiClient.put(`/ordenes/${id}/estado`, { estado }),
    'No fue posible actualizar el estado de la orden',
  )
}

export function obtenerOrdenes() {
  return request(apiClient.get('/ordenes'), 'No fue posible obtener el historial de órdenes')
}

export function obtenerOrdenesActivas() {
  return request(apiClient.get('/ordenes/activas'), 'No fue posible obtener las órdenes activas')
}
