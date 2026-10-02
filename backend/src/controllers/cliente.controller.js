const Cliente = require("../models/Cliente");
const Vehiculo = require("../models/Vehiculo");
const OrdenReparacion = require("../models/OrdenReparacion");

// GET /api/clientes - listar todos
exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });
    res.json(clientes);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener clientes", error: error.message });
  }
};

// GET /api/clientes/:id - obtener uno con sus vehículos
exports.obtenerCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener cliente", error: error.message });
  }
};

// GET /api/clientes/cedula/:cedula - buscar propietario y sus vehículos
exports.buscarPorCedula = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ cedula: req.params.cedula.trim() });
    if (!cliente) {
      return res.status(404).json({ mensaje: "Propietario no registrado" });
    }
    const vehiculos = await Vehiculo.find({ cliente: cliente._id }).sort({
      createdAt: -1,
    });
    res.json({ cliente, vehiculos });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al buscar propietario",
      error: error.message,
    });
  }
};

// GET /api/clientes/cedula/:cedula/estado - consulta pública sin datos del propietario
exports.consultarVehiculosPorCedula = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      cedula: req.params.cedula.trim(),
    }).select("_id");

    if (!cliente) {
      return res.status(404).json({ mensaje: "Propietario no registrado" });
    }

    const vehiculos = await Vehiculo.find({ cliente: cliente._id })
      .select("placa marca modelo anio")
      .sort({ createdAt: -1 })
      .lean();

    const resultados = await Promise.all(
      vehiculos.map(async (vehiculo) => {
        const historial = await OrdenReparacion.find({
          vehiculo: vehiculo._id,
        })
          .sort({ fechaIngreso: -1, createdAt: -1 })
          .select("descripcionProblema fechaIngreso estado fechaEntrega monto")
          .lean();

        const ordenActual = historial.find((orden) => orden.estado !== "Entregado") || historial[0] || null;

        return {
          ...vehiculo,
          historial,
          estadoActual: ordenActual?.estado || "Sin reparaciones pendientes",
          descripcionProblema: ordenActual?.descripcionProblema || "",
          fechaIngreso: ordenActual?.fechaIngreso || null,
        };
      }),
    );

    res.json({ clienteId: cliente._id, vehiculos: resultados });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar vehículos por cédula",
      error: error.message,
    });
  }
};

// POST /api/clientes - crear
exports.crearCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ mensaje: "Ya existe un propietario con esa cédula" });
    }
    res
      .status(400)
      .json({ mensaje: "Error al crear cliente", error: error.message });
  }
};

// PUT /api/clientes/:id - actualizar
exports.actualizarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // devuelve el documento ya actualizado
      runValidators: true, // aplica las validaciones del esquema
    });
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al actualizar cliente", error: error.message });
  }
};

// DELETE /api/clientes/:id - eliminar
exports.eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar cliente", error: error.message });
  }
};
