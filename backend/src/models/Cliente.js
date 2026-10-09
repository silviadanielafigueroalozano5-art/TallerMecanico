const mongoose = require("mongoose");
const { esCorreoValido } = require("../validations/email");

// Esquema de Cliente: la persona dueña de los vehículos.
const clienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    apellido: { type: String, trim: true, default: "", maxlength: 80, validate: (valor) => !valor || valor.length >= 2 },
    cedula: { type: String, required: true, trim: true, minlength: 5, maxlength: 20 },
    telefono: { type: String, required: true, trim: true, minlength: 7, maxlength: 24, match: /^[+()\d .-]+$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, validate: (valor) => !valor || esCorreoValido(valor) },
    direccion: { type: String, trim: true, maxlength: 200, validate: (valor) => !valor || valor.length >= 5 },
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
