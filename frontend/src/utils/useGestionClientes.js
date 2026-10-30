import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkshopStore } from '../stores/workshop'
import { esCorreoValido } from './validation'
import { normalizarTexto } from './texto'

/**
 * Estado y acciones del módulo "Clientes registrados".
 * Agrupa la lista de clientes/vehículos, el filtro, la edición y el borrado
 * para que la vista del taller solo se encargue de la presentación.
 */
export function useGestionClientes({ aviso, abrirConfirmacion }) {
  const workshop = useWorkshopStore()
  const { clientes, vehiculos } = storeToRefs(workshop)

  const modoGestion = ref('clientes')
  const gestionAbierta = ref(false)
  const cargandoGestion = ref(false)
  const filtroGestion = ref('')
  const errorGestion = ref('')

  const editorAbierto = ref(false)
  const guardandoEditor = ref(false)
  const errorEditor = ref('')
  const editorOriginal = ref(null)
  const editorForm = reactive({
    cliente: { nombre: '', apellido: '', cedula: '', telefono: '', email: '' },
    vehiculo: { vehiculoId: '', placa: '', marca: '', modelo: '', anio: '', kilometraje: '', color: '' },
  })

  function nombreCompletoCliente(cliente) {
    if (!cliente) return '—'
    return normalizarTexto([cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || '—')
  }

  function vehiculosDeCliente(cliente) {
    return vehiculos.value.filter((auto) => String(auto.cliente?._id || auto.cliente) === String(cliente._id))
  }

  function placasDeCliente(cliente) {
    return vehiculosDeCliente(cliente).map((auto) => auto.placa).filter(Boolean)
  }

  /** Clase CSS que colorea la etiqueta según la etapa de reparación. */
  function claseEstadoOrden(estado) {
    if (estado === 'Recibido') return 'is-recibido'
    if (estado === 'En Diagnóstico') return 'is-diagnostico'
    if (estado === 'En Reparación') return 'is-reparacion'
    if (estado === 'Listo') return 'is-listo'
    if (estado === 'Entregado') return 'is-entregado'
    return 'is-sin-orden'
  }

  /** Vehículos con la etapa de reparación que reporta el backend (última orden). */
  function vehiculosConEstado() {
    return vehiculos.value.map((auto) => {
      const estado = auto.estadoReparacion || 'Sin orden activa'
      return { ...auto, estadoReparacion: estado, estadoClase: claseEstadoOrden(auto.estadoReparacion) }
    })
  }

  const clientesFiltrados = computed(() => {
    const filtro = filtroGestion.value.trim().toLocaleLowerCase()
    if (!filtro) return clientes.value
    return clientes.value.filter((cliente) => {
      const placas = vehiculosDeCliente(cliente).map((auto) => auto.placa).join(' ')
      return [nombreCompletoCliente(cliente), cliente.cedula, cliente.telefono, cliente.email, placas]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(filtro)
    })
  })

  const vehiculosFiltrados = computed(() => {
    const filtro = filtroGestion.value.trim().toLocaleLowerCase()
    const lista = vehiculosConEstado()
    if (!filtro) return lista
    return lista.filter((auto) =>
      [auto.placa, auto.marca, auto.modelo, auto.clienteNombre]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(filtro),
    )
  })

  async function cargarGestion() {
    cargandoGestion.value = true
    errorGestion.value = ''
    try {
      await Promise.all([workshop.cargarClientes(), workshop.cargarVehiculos()])
    } catch (err) {
      errorGestion.value = err.message || 'No fue posible cargar los registros.'
    } finally {
      cargandoGestion.value = false
    }
  }

  async function abrirGestionClientes() {
    modoGestion.value = 'clientes'
    filtroGestion.value = ''
    gestionAbierta.value = true
    await cargarGestion()
  }

  async function abrirGestionVehiculos() {
    modoGestion.value = 'vehiculos'
    filtroGestion.value = ''
    gestionAbierta.value = true
    await cargarGestion()
  }

  function cerrarGestion() {
    gestionAbierta.value = false
  }

  function abrirEditor(clienteId, vehiculo = null) {
    const cliente = clientes.value.find((item) => String(item._id) === String(clienteId))
    if (!cliente) {
      errorGestion.value = 'Selecciona un cliente registrado.'
      return
    }
    editorOriginal.value = {
      cliente: { ...cliente },
      vehiculo: vehiculo ? { ...vehiculo } : null,
    }
    const nombreCompleto = normalizarTexto([cliente.nombre, cliente.apellido].filter(Boolean).join(' '))
    Object.assign(editorForm.cliente, {
      nombre: nombreCompleto,
      apellido: cliente.apellido || '',
      cedula: cliente.cedula || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
    })
    Object.assign(
      editorForm.vehiculo,
      vehiculo
        ? {
            vehiculoId: vehiculo._id,
            placa: vehiculo.placa || '',
            marca: normalizarTexto(vehiculo.marca || ''),
            modelo: normalizarTexto(vehiculo.modelo || ''),
            anio: vehiculo.anio ?? '',
            kilometraje: vehiculo.kilometraje ?? '',
            color: normalizarTexto(vehiculo.color || ''),
          }
        : {
            vehiculoId: '',
            placa: '',
            marca: '',
            modelo: '',
            anio: '',
            kilometraje: '',
            color: '',
          },
    )
    errorEditor.value = ''
    editorAbierto.value = true
  }

  function cerrarEditor() {
    if (guardandoEditor.value) return
    editorAbierto.value = false
    errorEditor.value = ''
  }

  function validarEditor() {
    const cliente = editorForm.cliente
    const vehiculo = editorForm.vehiculo
    const nombreCompleto = String(cliente.nombre || '').trim().replace(/\s+/g, ' ')
    if (nombreCompleto.length < 2 || nombreCompleto.length > 80) {
      return 'Escribe un nombre de al menos 2 caracteres y máximo 80.'
    }
    if (!/^[\p{L} .'-]+$/u.test(nombreCompleto)) {
      return 'El nombre solo puede contener letras, espacios, puntos, apóstrofes o guiones.'
    }
    const partes = nombreCompleto.split(' ')
    const primerNombre = partes[0] || ''
    const apellido = partes.slice(1).join(' ')
    if (primerNombre.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.'
    }
    if (apellido && apellido.length < 2) {
      return 'El apellido debe tener al menos 2 caracteres.'
    }
    const cedula = String(cliente.cedula || '').trim()
    if (!/^[\p{L}\p{N} .-]{5,20}$/u.test(cedula)) {
      return 'La cédula debe tener entre 5 y 20 caracteres válidos.'
    }
    const telefono = String(cliente.telefono || '').trim()
    const digitosTelefono = telefono.replace(/\D/g, '')
    if (!/^[+()\d .-]+$/.test(telefono) || digitosTelefono.length < 7 || digitosTelefono.length > 15) {
      return 'El teléfono debe tener entre 7 y 15 dígitos.'
    }
    const email = String(cliente.email || '').trim()
    if (email && !esCorreoValido(email)) {
      return 'Ingresa un correo electrónico válido.'
    }

    // Solo validar datos del vehículo cuando se abrió desde la pestaña de Vehículos
    if (editorOriginal.value?.vehiculo) {
      const placaLimpia = String(vehiculo.placa || '').trim().toUpperCase().replace(/[\s-]/g, '')
      if (!placaLimpia) return 'La placa del vehículo es obligatoria.'
      if (!/^[A-Z0-9]{5,8}$/.test(placaLimpia)) {
        return 'La placa debe tener entre 5 y 8 letras o números.'
      }
      const marca = String(vehiculo.marca || '').trim()
      if (marca.length < 2 || marca.length > 80) {
        return 'La marca debe tener entre 2 y 80 caracteres.'
      }
      const modelo = String(vehiculo.modelo || '').trim()
      if (!modelo || modelo.length > 80) {
        return 'El modelo es obligatorio y no puede superar 80 caracteres.'
      }
      const anio = Number(vehiculo.anio)
      if (!Number.isInteger(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) {
        return 'El año del vehículo no es válido.'
      }
      const kmRaw = vehiculo.kilometraje
      const km = kmRaw === '' || kmRaw === null || kmRaw === undefined ? NaN : Number(kmRaw)
      if (!Number.isSafeInteger(km) || km < 0 || km > 2000000) {
        return 'El kilometraje debe ser un entero entre 0 y 2.000.000.'
      }
      const color = String(vehiculo.color || '').trim()
      if (color && (color.length < 2 || color.length > 40)) {
        return 'El color debe tener al menos 2 caracteres o quedar vacío.'
      }
    }
    return ''
  }

  async function guardarEditor() {
    errorEditor.value = ''
    const problema = validarEditor()
    if (problema) {
      errorEditor.value = problema
      return
    }
    const original = editorOriginal.value
    if (!original) return

    const partesNombre = String(editorForm.cliente.nombre || '').trim().replace(/\s+/g, ' ').split(' ')
    const datosCliente = {
      nombre: partesNombre.shift() || '',
      apellido: partesNombre.join(' '),
      cedula: String(editorForm.cliente.cedula || '').trim(),
      telefono: String(editorForm.cliente.telefono || '').trim(),
      email: String(editorForm.cliente.email || '').trim().toLowerCase(),
    }

    guardandoEditor.value = true
    try {
      await workshop.editarCliente(original.cliente, datosCliente)

      if (original.vehiculo) {
        const datosVehiculo = {
          placa: String(editorForm.vehiculo.placa || '').trim().toUpperCase().replace(/[\s-]/g, ''),
          marca: String(editorForm.vehiculo.marca || '').trim(),
          modelo: String(editorForm.vehiculo.modelo || '').trim(),
          anio: Number(editorForm.vehiculo.anio),
          kilometraje: Number(editorForm.vehiculo.kilometraje),
          color: String(editorForm.vehiculo.color || '').trim(),
        }
        await workshop.editarVehiculo(original.vehiculo, datosVehiculo)
      }

      aviso.value = original.vehiculo
        ? 'Se guardaron los datos del propietario y del vehículo.'
        : 'Se guardaron los datos del propietario.'
      editorAbierto.value = false
    } catch (err) {
      errorEditor.value = err.message || 'No fue posible guardar los cambios.'
    } finally {
      guardandoEditor.value = false
    }
  }

  function borrarClienteGestion(cliente) {
    abrirConfirmacion({
      titulo: 'Eliminar cliente',
      mensaje: `Esta acción eliminará permanentemente a ${nombreCompletoCliente(cliente)}.`,
      nota: 'Solo se permite si el cliente no tiene vehículos registrados. Si los tiene, desactívalo para conservar el historial.',
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: () => workshop.borrarCliente(cliente).then(() => { aviso.value = 'Cliente eliminado.' }),
    })
  }

  function borrarVehiculoGestion(vehiculo) {
    abrirConfirmacion({
      titulo: 'Eliminar vehículo',
      mensaje: `Esta acción eliminará permanentemente el vehículo ${vehiculo.placa}.`,
      nota: 'Solo se permite si el vehículo no tiene órdenes ni historial. De lo contrario, desactívalo.',
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: () => workshop.borrarVehiculo(vehiculo).then(() => { aviso.value = 'Vehículo eliminado.' }),
    })
  }

  return {
    // estado
    modoGestion,
    gestionAbierta,
    cargandoGestion,
    filtroGestion,
    errorGestion,
    editorAbierto,
    guardandoEditor,
    errorEditor,
    editorForm,
    clientes,
    vehiculos,
    // derivados
    clientesFiltrados,
    vehiculosFiltrados,
    // acciones
    abrirGestionClientes,
    abrirGestionVehiculos,
    cargarGestion,
    cerrarGestion,
    abrirEditor,
    cerrarEditor,
    guardarEditor,
    borrarClienteGestion,
    borrarVehiculoGestion,
    // utilidades de presentación
    nombreCompletoCliente,
    vehiculosDeCliente,
    placasDeCliente,
  }
}
