const Historial = require("../models/Historial");

exports.obtenerHistorial = async (req, res) => {
  try {
    const historial = await Historial.find()
      .populate({
        path: "vehiculo",
        populate: { path: "cliente", select: "nombre apellido telefono" },
      })
      .sort({ fechaIngreso: -1, createdAt: -1 });

    res.json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener el historial",
      error: error.message,
    });
  }
};
