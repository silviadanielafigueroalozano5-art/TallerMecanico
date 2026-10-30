import axios from 'axios'

const apiBaseUrl = import.meta.env.PROD
  ? 'https://tallermecanico-1.onrender.com/api'
  : import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let obtenerTokenSesion = () => ''
let manejarSesionExpirada = () => {}

export function configurarClienteApi({ obtenerToken, alExpirarSesion }) {
  if (typeof obtenerToken === 'function') obtenerTokenSesion = obtenerToken
  if (typeof alExpirarSesion === 'function') manejarSesionExpirada = alExpirarSesion
}

apiClient.interceptors.request.use((config) => {
  const token = obtenerTokenSesion()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      manejarSesionExpirada()
    }
    return Promise.reject(error)
  },
)

export async function iniciarSesionApi(credenciales) {
  return request(apiClient.post('/auth/login', credenciales), 'No fue posible iniciar sesión')
}

async function request(promise, mensajePredeterminado) {
  try {
    const respuesta = await promise
    return respuesta.data
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error

    const datos = error.response?.data
    const errores = Array.isArray(datos?.errores) ? datos.errores.filter(Boolean) : []
    const mensajeServidor = [datos?.mensaje, ...errores].filter(Boolean).join(' ')
    const errorApi = new Error(
      mensajeServidor ||
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
    apiClient.get(`/vehiculos/placa/${encodeURIComponent(placa.trim().toUpperCase().replace(/[\s-]/g, ''))}`),
    'No fue posible buscar el vehículo',
  )
}

export function consultarEstadoPublicoPorPlaca(placa) {
  return request(
    apiClient.get(
      `/vehiculos/placa/${encodeURIComponent(placa.trim().toUpperCase().replace(/[\s-]/g, ''))}/estado`,
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

export function obtenerClientes() {
  return request(apiClient.get('/clientes'), 'No fue posible obtener los clientes')
}

export function actualizarCliente(id, datos) {
  return request(apiClient.put(`/clientes/${id}`, datos), 'No fue posible actualizar el cliente')
}


export function eliminarCliente(id) {
  return request(apiClient.delete(`/clientes/${id}`), 'No fue posible eliminar el cliente')
}

export function crearVehiculo(vehiculo) {
  return request(apiClient.post('/vehiculos', vehiculo), 'No fue posible registrar el vehículo')
}

export function obtenerVehiculos() {
  return request(apiClient.get('/vehiculos'), 'No fue posible obtener los vehículos')
}

export function actualizarVehiculo(id, datos) {
  return request(apiClient.put(`/vehiculos/${id}`, datos), 'No fue posible actualizar el vehículo')
}


export function eliminarVehiculo(id) {
  return request(apiClient.delete(`/vehiculos/${id}`), 'No fue posible eliminar el vehículo')
}

export function crearOrden(orden) {
  return request(
    apiClient.post('/ordenes', orden),
    'No fue posible registrar la orden de reparación',
  )
}

export function actualizarOrden(id, datos) {
  return request(apiClient.put(`/ordenes/${id}`, datos), 'No fue posible guardar los detalles de la orden')
}

export function registrarAbono(id, abono) {
  return request(apiClient.put(`/ordenes/${id}/pago`, { abono }), 'No fue posible registrar el abono')
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

export function solicitarRestablecimiento(email) {
  return request(apiClient.post('/auth/forgot-password', { email }), 'No fue posible solicitar la recuperación')
}

export function restablecerContrasena(token, password) {
  return request(apiClient.post('/auth/reset-password', { token, password }), 'No fue posible cambiar la contraseña')
}
