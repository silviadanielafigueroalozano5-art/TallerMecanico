import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('taller-token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

apiClient.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
    sessionStorage.removeItem('taller-token')
    sessionStorage.removeItem('taller-usuario')
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})

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
      mensajeServidor || (error.code === 'ECONNABORTED'
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

export function crearVehiculo(vehiculo) {
  return request(apiClient.post('/vehiculos', vehiculo), 'No fue posible registrar el vehículo')
}

export function crearOrden(orden) {
  return request(
    apiClient.post('/ordenes', orden),
    'No fue posible registrar la orden de reparación',
  )
}

export function actualizarOrden(id, datos) {
  return request(apiClient.put('/ordenes/' + id, datos), 'No fue posible guardar los detalles de la orden')
}

export function cambiarEstadoOrden(id, estado, pagado = false) {
  return request(
    apiClient.put(`/ordenes/${id}/estado`, { estado, ...(pagado ? { pagado: true } : {}) }),
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
