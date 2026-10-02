const express = require("express");
const router = express.Router();
const c = require("../controllers/historial.controller");

router.get("/", c.obtenerHistorial);

module.exports = router;
