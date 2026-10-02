const express = require("express");
const router = express.Router();
const c = require("../controllers/cliente.controller");

router.get("/", c.obtenerClientes);
router.get("/cedula/:cedula/estado", c.consultarVehiculosPorCedula);
router.get("/cedula/:cedula", c.buscarPorCedula);
router.get("/:id", c.obtenerCliente);
router.post("/", c.crearCliente);
router.put("/:id", c.actualizarCliente);
router.delete("/:id", c.eliminarCliente);

module.exports = router;
