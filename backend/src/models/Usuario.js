const mongoose = require("mongoose");
const { esCorreoValido } = require("../validations/email");
const usuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, validate: { validator: esCorreoValido, message: "Correo de usuario inválido." } },
  passwordHash: { type: String, required: true, select: false },
  rol: { type: String, enum: ["admin", "operario"], default: "operario", required: true },
  activo: { type: Boolean, default: true, required: true },
  tokenVersion: { type: Number, default: 0, min: 0, required: true },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });
module.exports = mongoose.model("Usuario", usuarioSchema);
