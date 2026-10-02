const mongoose = require("mongoose");

const historialSchema = new mongoose.Schema(
  {
    ordenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrdenReparacion",
      required: true,
      unique: true,
    },
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehiculo",
      required: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
    },
    placa: { type: String, required: true, trim: true, uppercase: true },
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    descripcionProblema: { type: String, required: true, trim: true },
    estado: {
      type: String,
      enum: ["Recibido", "En Diagnóstico", "En Reparación", "Listo", "Entregado"],
      default: "Recibido",
    },
    monto: { type: Number, default: 0, min: 0 },
    fechaIngreso: { type: Date, default: Date.now },
    fechaEntrega: { type: Date, default: null },
  },
  { timestamps: true, collection: "historial" },
);

module.exports = mongoose.model("Historial", historialSchema);
