const OrdenReparacion = require("../models/OrdenReparacion");
const Historial = require("../models/Historial");
const Vehiculo = require("../models/Vehiculo");
const { ESTADOS, puedeAvanzar } = require("../domain/ordenRules");

async function sincronizarHistorialDesdeOrden(orden, { finalizar = false } = {}) {
  if (!orden || !orden._id) return null;
  if (orden.estado === "Entregado" && !finalizar) {
    const existente = await Historial.findOne({ ordenId: orden._id });
    if (existente?.estado === "Entregado") return existente;
  }
  const vehiculo = await Vehiculo.findById(orden.vehiculo).populate("cliente", "_id nombre apellido");
  if (!vehiculo || !vehiculo.cliente) throw new Error("La orden debe pertenecer a un vehículo con propietario registrado.");
  const valores = {
    ordenId: orden._id, vehiculo: orden.vehiculo, cliente: vehiculo.cliente._id,
    placa: vehiculo.placa, marca: vehiculo.marca, modelo: vehiculo.modelo,
    descripcionProblema: orden.descripcionProblema, diagnostico: orden.diagnostico || "",
    trabajosRealizados: orden.trabajosRealizados || "", mecanico: orden.mecanico || "", estado: orden.estado,
    costoRepuestos: orden.costoRepuestos ?? 0, manoObra: orden.manoObra ?? orden.monto ?? 0,
    monto: orden.monto || 0, pagado: orden.pagado === true, fechaIngreso: orden.fechaIngreso, fechaEntrega: orden.fechaEntrega || null,
  };
  if (orden.estado === "Entregado" && !finalizar) {
    const existente = await Historial.findOne({ ordenId: orden._id });
    if (existente?.estado === "Entregado") return existente;
    if (existente) return Historial.findOneAndUpdate({ ordenId: orden._id }, valores, { new: true, runValidators: true });
    return Historial.findOneAndUpdate({ ordenId: orden._id }, { $setOnInsert: valores }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  return Historial.findOneAndUpdate({ ordenId: orden._id }, valores, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
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

// POST /api/ordenes - solo acepta vehículos existentes y órdenes nuevas
exports.crearOrden = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.body.vehiculo).populate("cliente", "_id");
    if (!vehiculo || !vehiculo.cliente) return res.status(404).json({ mensaje: "El vehículo no está registrado con un propietario válido." });
    const orden = await OrdenReparacion.create({ ...req.body, estado: "Recibido", fechaIngreso: new Date(), fechaEntrega: null });
    await sincronizarHistorialDesdeOrden(orden);
    res.status(201).json(orden);
  } catch (error) {
    res.status(400).json({ mensaje: "No fue posible crear la orden.", error: error.message });
  }
};

// PUT /api/ordenes/:id/estado - avanza exactamente una etapa
exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body || {};
    if (!ESTADOS.includes(estado)) return res.status(400).json({ mensaje: "El estado solicitado no es válido." });
    if (Object.keys(req.body || {}).some((campo) => !["estado", "pagado"].includes(campo))) return res.status(400).json({ mensaje: "La solicitud contiene campos que no se pueden actualizar." });
    if (estado === "Entregado" && req.body.pagado !== true) return res.status(400).json({ mensaje: "Confirma el pago de la cuenta antes de entregar el vehículo." });
    if (estado !== "Entregado" && Object.prototype.hasOwnProperty.call(req.body, "pagado")) return res.status(400).json({ mensaje: "El pago solo se confirma al cerrar la orden." });
    const actual = await OrdenReparacion.findById(req.params.id);
    if (!actual) return res.status(404).json({ mensaje: "Orden no encontrada." });
    if (actual.estado === "Entregado") return res.status(409).json({ mensaje: "La orden ya fue entregada y quedó bloqueada." });
    if (!puedeAvanzar(actual.estado, estado)) return res.status(409).json({ mensaje: "La orden solo puede avanzar a la siguiente etapa del proceso." });
    const datos = { estado };
    if (estado === "Entregado") { datos.fechaEntrega = new Date(); datos.pagado = true; }
    const orden = await OrdenReparacion.findOneAndUpdate({ _id: actual._id, estado: actual.estado }, datos, { new: true, runValidators: true });
    if (!orden) return res.status(409).json({ mensaje: "La orden cambió mientras se actualizaba. Recarga e intenta de nuevo." });
    await sincronizarHistorialDesdeOrden(orden, { finalizar: estado === "Entregado" });
    res.json(orden);
  } catch (error) {
    res.status(400).json({ mensaje: "No fue posible cambiar el estado.", error: error.message });
  }
};

// PUT /api/ordenes/:id - solo edita contenido mientras la orden siga activa
exports.actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.findById(req.params.id);
    if (!orden) return res.status(404).json({ mensaje: "Orden no encontrada." });
    if (orden.estado === "Entregado") return res.status(409).json({ mensaje: "La orden entregada está cerrada y no se puede modificar." });
    if (orden.costoRepuestos == null && orden.manoObra == null) { orden.costoRepuestos = 0; orden.manoObra = Number(orden.monto) || 0; }
    const repuestos = Object.prototype.hasOwnProperty.call(req.body, "costoRepuestos") ? req.body.costoRepuestos : orden.costoRepuestos;
    const manoObra = Object.prototype.hasOwnProperty.call(req.body, "manoObra") ? req.body.manoObra : orden.manoObra;
    if (Number(repuestos || 0) + Number(manoObra || 0) > 1000000000000) return res.status(400).json({ mensaje: "El total de la orden no puede superar 1.000.000.000.000 COP." });
    Object.assign(orden, req.body);
    orden.monto = Number(orden.costoRepuestos || 0) + Number(orden.manoObra || 0);
    await orden.save();
    await sincronizarHistorialDesdeOrden(orden);
    res.json(orden);
  } catch (error) {
    res.status(400).json({ mensaje: "No fue posible actualizar la orden.", error: error.message });
  }
};

// DELETE /api/ordenes/:id - conserva cerradas e historial
exports.eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenReparacion.findById(req.params.id);
    if (!orden) return res.status(404).json({ mensaje: "Orden no encontrada." });
    if (orden.estado === "Entregado") return res.status(409).json({ mensaje: "No se puede eliminar una orden entregada. El historial financiero debe conservarse." });
    await Historial.deleteOne({ ordenId: orden._id });
    await orden.deleteOne();
    res.json({ mensaje: "Orden eliminada." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar la orden.", error: error.message });
  }
};
