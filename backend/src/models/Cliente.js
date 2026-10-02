const mongoose = require("mongoose");

// Esquema de Cliente: la persona dueña de los vehículos.
const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, trim: true, default: "" },
    cedula: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    direccion: { type: String, trim: true },
  },
  { timestamps: true }, // crea automáticamente createdAt y updatedAt
);

clienteSchema.index(
  { cedula: 1 },
  {
    unique: true,
    partialFilterExpression: { cedula: { $type: "string" } },
  },
);

module.exports = mongoose.model("Cliente", clienteSchema);
