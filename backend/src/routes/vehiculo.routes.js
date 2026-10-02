const express = require("express");
const router = express.Router();
const c = require("../controllers/vehiculo.controller");

router.get("/", c.obtenerVehiculos);
router.get("/placa/:placa/estado", c.consultarEstadoPublico);
router.get("/placa/:placa", c.buscarPorPlaca); // ¡importante declarar ANTES de /:id para que Express no confunda "placa" con un id!
router.get("/:id", c.obtenerVehiculo);
router.post("/", c.crearVehiculo);
router.put("/:id", c.actualizarVehiculo);
router.delete("/:id", c.eliminarVehiculo);

module.exports = router;
