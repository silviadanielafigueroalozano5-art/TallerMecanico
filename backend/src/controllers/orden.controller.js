const OrdenReparacion = require("../models/OrdenReparacion");
const Historial = require("../models/Historial");
const Vehiculo = require("../models/Vehiculo");
const { ESTADOS } = require("../models/OrdenReparacion");

async function sincronizarHistorialDesdeOrden(orden) {
  if (!orden || !orden._id) return null;

  const vehiculo = await Vehiculo.findById(orden.vehiculo).populate("cliente", "_id nombre apellido");

  return Historial.findOneAndUpdate(
    { ordenId: orden._id },
    {
      ordenId: orden._id,
      vehiculo: orden.vehiculo,
      cliente: vehiculo?.cliente?._id || null,
      placa: vehiculo?.placa || "",
      marca: vehiculo?.marca || "",
      modelo: vehiculo?.modelo || "",
      descripcionProblema: orden.descripcionProblema,
      estado: orden.estado,
      monto: orden.monto || 0,
      fechaIngreso: orden.fechaIngreso,
      fechaEntrega: orden.fechaEntrega || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

exports.sincronizarHistorialBase = async () => {
  try {
    const ordenes = await OrdenReparacion.find().sort({ fechaIngreso: -1, createdAt: -1 }).lean();
    await Promise.all(ordenes.map((orden) => sincronizarHistorialDesdeOrden(orden)));
    return true;
  } catch (error) {
    console.error("Error al sincronizar historial base:", error.message);
    return false;
  }
};

// GET /api/ordenes - listar todas (con vehículo y cliente poblados)
exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenReparacion.find()
      .populate({
        path: "vehiculo",
        populate: { path: "cliente", select: "nombre apellido telefono" },
      })
      .sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener órdenes", error: error.message });
  }
};

// GET /api/ordenes/activas - órdenes que aún no están Entregadas
exports.obtenerOrdenesActivas = async (req, res) => {
  try {
    const ordenes = await OrdenReparacion.find({ estado: { $ne: "Entregado" } })
      .populate({
        path: "vehiculo",
        populate: { path: "cliente", select: "nombre apellido telefono" },
      })
      .sort({ createdAt: -1 });
    res.json(ordenes);
  } catch (error) {
    res
      .status(500)
      .json({
        mensaje: "Error al obtener órdenes activas",
        error: error.message,
      });
  }
};

// GET /api/ordenes/:id
exports.obtenerOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.findById(req.params.id).populate({
      path: "vehiculo",
      populate: { path: "cliente" },
    });
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
    res.json(orden);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener orden", error: error.message });
  }
};

// POST /api/ordenes - crear (requiere vehiculo: <id>)
exports.crearOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.create(req.body);
    await sincronizarHistorialDesdeOrden(orden);
    res.status(201).json(orden);
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al crear orden", error: error.message });
  }
};

// PUT /api/ordenes/:id/estado - avanzar estado en el ciclo de vida
exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) {
      return res
        .status(400)
        .json({ mensaje: `Estado inválido. Valores: ${ESTADOS.join(", ")}` });
    }
    const datos = { estado };
    if (estado === "Entregado") {
      datos.fechaEntrega = new Date();
    }
    const orden = await OrdenReparacion.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true },
    );
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }

    await sincronizarHistorialDesdeOrden(orden);
    res.json(orden);
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al cambiar estado", error: error.message });
  }
};

// PUT /api/ordenes/:id - editar contenido (diagnóstico, trabajos, monto)
exports.actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
    res.json(orden);
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al actualizar orden", error: error.message });
  }
};

// DELETE /api/ordenes/:id
exports.eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.findByIdAndDelete(req.params.id);
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
    await Historial.deleteOne({ ordenId: req.params.id });
    res.json({ mensaje: "Orden eliminada" });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar orden", error: error.message });
  }
};
