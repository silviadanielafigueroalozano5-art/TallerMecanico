const mongoose = require("mongoose");
const ALLOWED = new Set(["placa", "marca", "modelo", "anio", "color", "cliente", "kilometraje"]);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function rechazar(res, errores) { return res.status(400).json({ mensaje: "Revisa los datos del vehículo.", errores }); }
function normalizarPlaca(valor) { return typeof valor === "string" ? valor.toUpperCase().replace(/[\s-]/g, "") : valor; }
function validarVehiculo(req, res, next) {
  const datos = req.body; const crear = req.method === "POST";
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return rechazar(res, ["Envía los datos del vehículo en formato válido."]);
  const errores = []; for (const campo of Object.keys(datos)) if (!ALLOWED.has(campo)) errores.push("El campo '" + campo + "' no está permitido.");
  if (!crear && !Object.keys(datos).length) errores.push("Envía al menos un dato para actualizar.");
  const salida = {}; const required = crear ? ["placa", "marca", "modelo", "cliente", "anio", "kilometraje"] : [];
  for (const campo of ["placa", "marca", "modelo", "color", "cliente"]) {
    if (!own(datos, campo)) { if (required.includes(campo)) errores.push(campo + " es obligatorio."); continue; }
    if (typeof datos[campo] !== "string") { errores.push(campo + " debe ser texto."); continue; }
    let valor = datos[campo].trim(); if (["placa", "marca", "modelo", "cliente"].includes(campo) && !valor) errores.push(campo + " es obligatorio.");
    if (campo === "placa") { valor = normalizarPlaca(valor); if (!/^[A-Z0-9]{5,8}$/.test(valor)) errores.push("La placa debe tener entre 5 y 8 letras o números."); }
    if (campo === "marca" && valor && valor.length < 2) errores.push("La marca debe tener al menos 2 caracteres.");
    if (campo === "modelo" && !valor) errores.push("El modelo es obligatorio.");
    if (campo === "color" && valor && valor.length < 2) errores.push("El color debe tener al menos 2 caracteres.");
    if (campo === "cliente" && valor && !mongoose.isValidObjectId(valor)) errores.push("El propietario seleccionado no es válido."); salida[campo] = valor;
  }
  if (own(datos, "anio") || crear) { const raw = datos.anio; const anio = raw === "" || raw === null ? NaN : Number(raw); if (!Number.isInteger(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) errores.push("El año del vehículo no es válido."); else salida.anio = anio; }
  if (own(datos, "kilometraje") || crear) { const raw = datos.kilometraje; const km = raw === "" || raw === null ? NaN : Number(raw); if (!Number.isSafeInteger(km) || km < 0 || km > 2000000) errores.push("El kilometraje debe ser un número entero entre 0 y 2.000.000."); else salida.kilometraje = km; }
  if (errores.length) return rechazar(res, errores); req.body = salida; next();
}
function validarPlacaParam(req, res, next) {
  const placa = normalizarPlaca(req.params.placa);
  if (typeof placa !== "string" || !/^[A-Z0-9]{5,8}$/.test(placa)) return res.status(400).json({ mensaje: "La placa debe tener entre 5 y 8 letras o números." });
  req.params.placa = placa;
  next();
}
module.exports = { validarVehiculo, validarPlacaParam, normalizarPlaca };
