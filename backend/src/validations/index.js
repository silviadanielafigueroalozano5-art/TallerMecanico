const { validarCliente } = require("./clienteValidation");
const { validarVehiculo } = require("./vehiculoValidation");
const { validarOrden } = require("./ordenValidation");

module.exports = {
  validarCliente,
  validarVehiculo,
  validarOrden,
};
