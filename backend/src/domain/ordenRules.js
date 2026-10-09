const { ESTADOS } = require("../models/OrdenReparacion");
const TRANSICIONES = new Map([["Recibido", "En Diagnóstico"], ["En Diagnóstico", "En Reparación"], ["En Reparación", "Listo"], ["Listo", "Entregado"]]);
function puedeAvanzar(estadoActual, estadoNuevo) { return TRANSICIONES.get(estadoActual) === estadoNuevo; }
module.exports = { ESTADOS, TRANSICIONES, puedeAvanzar };
