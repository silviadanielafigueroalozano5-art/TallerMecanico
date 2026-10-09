const express = require("express");
const router = express.Router();
const c = require("../controllers/cliente.controller");
const { autenticar, soloAdmin } = require("../middleware/autenticar");
router.use(autenticar);
const { validarCliente } = require("../validations/validations/clienteValidation");
const { validarId } = require("../validations/validations/idValidation");

router.get("/", c.obtenerClientes);
router.get("/cedula/:cedula/estado", c.consultarVehiculosPorCedula);
router.get("/cedula/:cedula", c.buscarPorCedula);
router.get("/:id", validarId, c.obtenerCliente);
router.post("/", validarCliente, c.crearCliente);
router.put("/:id", validarId, validarCliente, c.actualizarCliente);
router.delete("/:id", validarId, soloAdmin, c.eliminarCliente);

module.exports = router;
