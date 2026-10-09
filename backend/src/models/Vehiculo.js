const mongoose = require("mongoose");

// Esquema de Vehículo: pertenece a UN cliente (relación 1:N).
const vehiculoSchema = new mongoose.Schema(
  {
    placa: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 8,
      match: /^[A-Z0-9]{5,8}$/
    },
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    anio: { type: Number, min: 1900, validate: (valor) => valor <= new Date().getFullYear() + 1 },
    kilometraje: { type: Number, required: true, min: 0, max: 2000000, validate: Number.isSafeInteger },
    color: { type: String, trim: true },
    // Referencia al dueño: conecta Vehículo con Cliente
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehiculo", vehiculoSchema);
