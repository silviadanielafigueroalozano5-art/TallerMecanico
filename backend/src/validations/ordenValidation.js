const mongoose = require("mongoose");
const { ESTADOS } = require("../models/OrdenReparacion");
const ALLOWED_CREATE = new Set(["vehiculo", "descripcionProblema", "estado", "costoRepuestos", "manoObra", "mecanico"]);
const ALLOWED_UPDATE = new Set(["descripcionProblema", "diagnostico", "trabajosRealizados", "costoRepuestos", "manoObra", "mecanico"]);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function rechazar(res, errores) { return res.status(400).json({ mensaje: "Revisa los datos de la orden.", errores }); }
function validarOrden(req, res, next) {
  const datos = req.body; const crear = req.method === "POST";
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return rechazar(res, ["Envía los datos de la orden en formato válido."]);
  const permitidos = crear ? ALLOWED_CREATE : ALLOWED_UPDATE; const errores = [];
  for (const campo of Object.keys(datos)) if (!permitidos.has(campo)) errores.push("El campo '" + campo + "' no se puede modificar por esta ruta.");
  if (!crear && !Object.keys(datos).length) errores.push("Envía al menos un dato para actualizar.");
  const salida = {};
  if (crear) {
    if (typeof datos.vehiculo !== "string" || !mongoose.isValidObjectId(datos.vehiculo)) errores.push("Selecciona un vehículo registrado."); else salida.vehiculo = datos.vehiculo;
    if (own(datos, "estado") && (!ESTADOS.includes(datos.estado) || datos.estado !== "Recibido")) errores.push("Toda orden nueva debe iniciar en estado Recibido.");
    salida.estado = "Recibido";
  }
  if (own(datos, "descripcionProblema") || crear) {
    if (typeof datos.descripcionProblema !== "string" || datos.descripcionProblema.trim().length < 5 || datos.descripcionProblema.trim().length > 2000) errores.push("Describe el problema con al menos 5 caracteres (máximo 2.000).");
    else salida.descripcionProblema = datos.descripcionProblema.trim();
  }
  for (const campo of ["diagnostico", "trabajosRealizados"]) if (own(datos, campo)) {
    if (typeof datos[campo] !== "string" || (datos[campo].trim() && datos[campo].trim().length < 3) || datos[campo].trim().length > 5000) errores.push(campo + " debe estar vacío o tener entre 3 y 5.000 caracteres.");
    else salida[campo] = datos[campo].trim();
  }
  if (own(datos, "mecanico")) {
    if (typeof datos.mecanico !== "string" || (datos.mecanico.trim() && datos.mecanico.trim().length < 2) || datos.mecanico.trim().length > 100) errores.push("El mecánico debe estar vacío o tener entre 2 y 100 caracteres.");
    else salida.mecanico = datos.mecanico.trim();
  }
  for (const campo of ["costoRepuestos", "manoObra"]) {
    if (!own(datos, campo) && !crear) continue;
    const raw = own(datos, campo) ? datos[campo] : 0;
    const valor = raw === "" || raw === null || typeof raw === "boolean" ? NaN : Number(raw);
    if (!Number.isSafeInteger(valor) || valor < 0 || valor > 1000000000000) errores.push(campo + " debe ser un valor válido entre 0 y 1.000.000.000.000 COP.");
    else salida[campo] = valor;
  }
  if (crear && Number(salida.costoRepuestos || 0) + Number(salida.manoObra || 0) > 1000000000000) errores.push("El total de la orden no puede superar 1.000.000.000.000 COP.");
  if (errores.length) return rechazar(res, errores); req.body = salida; next();
}
module.exports = { validarOrden };
