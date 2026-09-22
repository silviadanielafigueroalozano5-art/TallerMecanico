const mongoose = require("mongoose");

// Ciclo de vida permitido de una orden
const ESTADOS = [
  "Recibido",
  "En Diagnóstico",
  "En Reparación",
  "Listo",
  "Entregado",
];

// Esquema de Orden de Reparación: pertenece a UN vehículo (relación 1:N).
const ordenReparacionSchema = new mongoose.Schema(
  {
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehiculo",
      required: true,
    },
    fechaIngreso: { type: Date, default: Date.now },
    fechaEntrega: { type: Date, default: null },
    descripcionProblema: { type: String, required: true, trim: true },
    diagnostico: { type: String, trim: true },
    trabajosRealizados: { type: String, trim: true },
    monto: { type: Number, default: 0, min: 0 },
    estado: {
      type: String,
      enum: ESTADOS, // solo acepta esos 5 valores
      default: "Recibido",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OrdenReparacion", ordenReparacionSchema);
module.exports.ESTADOS = ESTADOS;
