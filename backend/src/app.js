const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const conectarDB = require("./config/database");
const { sincronizarHistorialBase } = require("./controllers/orden.controller");

const app = express();

const origenFrontend = process.env.FRONTEND_URL;
app.use(cors(origenFrontend ? { origin: origenFrontend } : undefined));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "API del taller mecánico funcionando"
    });
});

// Rutas de la API
app.use("/api/clientes", require("./routes/cliente.routes"));
app.use("/api/vehiculos", require("./routes/vehiculo.routes"));
app.use("/api/ordenes", require("./routes/orden.routes"));
app.use("/api/historial", require("./routes/historial.routes"));

const PORT = process.env.PORT || 4000;

async function iniciarServidor() {
    try {
        await conectarDB();
        await sincronizarHistorialBase();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No fue posible iniciar el servidor:", error.message);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    iniciarServidor();
}

module.exports = app;