const mongoose = require("mongoose");

const conectarDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI no está definida en el archivo .env");
        }
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB conectado correctamente");
    } catch (error) {
        console.error("Error al conectar MongoDB:", error.message);
        // Si no hay base de datos la API no sirve: termina el proceso para enterarse de inmediato.
        process.exit(1);
    }
};

module.exports = conectarDB;