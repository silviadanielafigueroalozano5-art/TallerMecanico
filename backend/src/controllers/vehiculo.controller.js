const Vehiculo = require("../models/Vehiculo");
const OrdenReparacion = require("../models/OrdenReparacion");
const Historial = require("../models/Historial");
const Cliente = require("../models/Cliente");
const { normalizarPlaca } = require("../validations/vehiculoValidation");

function expresionPlaca(placa) {
  const compacta = normalizarPlaca(placa);
  return new RegExp("^" + compacta.split("").join("[\\s-]*") + "$", "i");
}
async function existePlacaEquivalente(placa, excluirId) {
  const filtro = { placa: expresionPlaca(placa) };
  if (excluirId) filtro._id = { $ne: excluirId };
  return Boolean(await Vehiculo.exists(filtro));
}

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
    const vehiculo = await Vehiculo.findOne({ placa: expresionPlaca(req.params.placa) }).select("placa marca modelo anio").lean();
    if (!vehiculo) return res.status(404).json({ mensaje: "Vehículo no registrado" });
    const ordenActual = await OrdenReparacion.findOne({ vehiculo: vehiculo._id, estado: { $ne: "Entregado" } })
      .sort({ fechaIngreso: -1 }).select("estado fechaIngreso").lean();
    res.json({ vehiculo, ordenActual: ordenActual ? { estado: ordenActual.estado, fechaIngreso: ordenActual.fechaIngreso } : null });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al consultar el estado del vehículo", error: error.message });
  }
};

exports.buscarPorPlaca = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findOne({
      placa: normalizarPlaca(req.params.placa),
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

// POST /api/vehiculos - crear (requiere un propietario registrado)
exports.crearVehiculo = async (req, res) => {
  try {
    const propietario = await Cliente.findById(req.body.cliente).select("_id");
    if (!propietario) return res.status(404).json({ mensaje: "El propietario seleccionado no está registrado." });
    if (await existePlacaEquivalente(req.body.placa)) return res.status(409).json({ mensaje: "Ya existe un vehículo con esa placa." });
    const vehiculo = await Vehiculo.create(req.body);
    res.status(201).json(vehiculo);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: "Ya existe un vehículo con esa placa." });
    res.status(400).json({ mensaje: "No fue posible crear el vehículo.", error: error.message });
  }
};

// PUT /api/vehiculos/:id - actualizar campos validados
exports.actualizarVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);
    if (!vehiculo) return res.status(404).json({ mensaje: "Vehículo no encontrado." });
    if (req.body.placa && await existePlacaEquivalente(req.body.placa, vehiculo._id)) return res.status(409).json({ mensaje: "Ya existe un vehículo con esa placa." });
    if (req.body.cliente && String(req.body.cliente) !== String(vehiculo.cliente)) {
      const propietario = await Cliente.findById(req.body.cliente).select("_id");
      if (!propietario) return res.status(404).json({ mensaje: "El propietario seleccionado no está registrado." });
      const tieneOrdenes = await OrdenReparacion.exists({ vehiculo: vehiculo._id });
      if (tieneOrdenes) return res.status(409).json({ mensaje: "No se puede cambiar el propietario de un vehículo con historial de órdenes." });
    }
    const actualizado = await Vehiculo.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: "Vehículo no encontrado." });
    res.json(actualizado);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: "Ya existe un vehículo con esa placa." });
    res.status(400).json({ mensaje: "No fue posible actualizar el vehículo.", error: error.message });
  }
};

// DELETE /api/vehiculos/:id - solo se permite si no tiene órdenes ni historial
exports.eliminarVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);
    if (!vehiculo) return res.status(404).json({ mensaje: "Vehículo no encontrado." });
    const tieneOrdenes = await OrdenReparacion.exists({ vehiculo: vehiculo._id });
    const tieneHistorial = await Historial.exists({ vehiculo: vehiculo._id });
    if (tieneOrdenes || tieneHistorial) return res.status(409).json({ mensaje: "No se puede eliminar un vehículo que tiene órdenes o historial. Conserva su registro para proteger la trazabilidad del taller." });
    await vehiculo.deleteOne();
    res.json({ mensaje: "Vehículo eliminado." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar vehículo.", error: error.message });
  }
};
