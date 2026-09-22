const Cliente = require("../models/Cliente");

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

// POST /api/clientes - crear
exports.crearCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
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
