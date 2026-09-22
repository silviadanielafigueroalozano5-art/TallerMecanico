const mongoose = require("mongoose");

// Esquema de Cliente: la persona dueña de los vehículos.
const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    direccion: { type: String, trim: true },
  },
  { timestamps: true }, // crea automáticamente createdAt y updatedAt
);

module.exports = mongoose.model("Cliente", clienteSchema);
