const Vehiculo = require("../models/Vehiculo");
const OrdenReparacion = require("../models/OrdenReparacion");

// GET /api/vehiculos - listar todos
exports.obtenerVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find()
      .populate("cliente", "nombre apellido telefono")
      .sort({ createdAt: -1 });
    res.json(vehiculos);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener vehículos", error: error.message });
  }
};

// GET /api/vehiculos/placa/:placa - BUSCAR POR PLACA (núcleo del flujo del negocio)
exports.consultarEstadoPublico = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findOne({
      placa: req.params.placa.toUpperCase(),
    }).select("placa marca modelo anio");

    if (!vehiculo) {
      return res.status(404).json({ mensaje: "Vehículo no registrado" });
    }

    const historial = await OrdenReparacion.find({
      vehiculo: vehiculo._id,
    })
      .sort({ fechaIngreso: -1 })
      .select("descripcionProblema fechaIngreso estado fechaEntrega monto");

    const ordenActual = historial.find((orden) => orden.estado !== "Entregado") || historial[0] || null;

    res.json({
      vehiculo,
      historial,
      ordenActual: ordenActual
        ? {
            descripcionProblema: ordenActual.descripcionProblema,
            fechaIngreso: ordenActual.fechaIngreso,
            estado: ordenActual.estado,
            fechaEntrega: ordenActual.fechaEntrega,
            monto: ordenActual.monto,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar el estado del vehículo",
      error: error.message,
    });
  }
};

exports.buscarPorPlaca = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findOne({
      placa: req.params.placa.toUpperCase(),
    }).populate("cliente", "nombre apellido telefono email direccion");
    if (!vehiculo) {
      return res.status(404).json({ mensaje: "Vehículo no registrado" });
    }

    const historial = await OrdenReparacion.find({
      vehiculo: vehiculo._id,
    }).sort({ fechaIngreso: -1, createdAt: -1 });

    res.json({ vehiculo, historial });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al buscar vehículo", error: error.message });
  }
};

// GET /api/vehiculos/:id - obtener un vehículo por su id
exports.obtenerVehiculo = async (req, res) => {
    try {
        const vehiculo = await Vehiculo.findById(req.params.id).populate(
            "cliente",
            "nombre apellido telefono email direccion"
        );
        if (!vehiculo) {
            return res.status(404).json({ mensaje: "Vehículo no encontrado" });
        }
        res.json(vehiculo);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener vehículo", error: error.message });
    }
};

// POST /api/vehiculos - crear (requiere cliente: <id del dueño>)
exports.crearVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.create(req.body);
    res.status(201).json(vehiculo);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ mensaje: "Ya existe un vehículo con esa placa" });
    }
    res
      .status(400)
      .json({ mensaje: "Error al crear vehículo", error: error.message });
  }
};

// PUT /api/vehiculos/:id - actualizar
exports.actualizarVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehiculo) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }
    res.json(vehiculo);
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al actualizar vehículo", error: error.message });
  }
};

// DELETE /api/vehiculos/:id - eliminar (y sus órdenes)
exports.eliminarVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndDelete(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }
    await OrdenReparacion.deleteMany({ vehiculo: req.params.id });
    res.json({ mensaje: "Vehículo y sus órdenes eliminados" });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar vehículo", error: error.message });
  }
};
