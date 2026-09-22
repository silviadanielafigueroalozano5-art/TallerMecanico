const OrdenReparacion = require("../models/OrdenReparacion");
const { ESTADOS } = require("../models/OrdenReparacion");

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
    const orden = await OrdenReparacion.create(req.body); // estado por defecto: Recibido
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
      datos.fechaEntrega = new Date(); // marca la fecha al entregar el vehículo
    }
    const orden = await OrdenReparacion.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true },
    );
    if (!orden) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }
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
    res.json({ mensaje: "Orden eliminada" });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al eliminar orden", error: error.message });
  }
};
