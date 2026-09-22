const mongoose = require("mongoose");

// Esquema de Vehículo: pertenece a UN cliente (relación 1:N).
const vehiculoSchema = new mongoose.Schema(
  {
    placa: {
      type: String,
      required: true,
      unique: true, // no pueden existir dos vehículos con la misma placa
      uppercase: true, // guarda "abc123" como "ABC123"
      trim: true,
    },
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    anio: { type: Number },
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
