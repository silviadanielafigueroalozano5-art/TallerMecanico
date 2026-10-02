const mongoose = require("mongoose");
const dns = require("dns");

const conectarDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI no está definida en el archivo .env");
    }
    const dnsServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);
    if (dnsServers.length) {
        dns.setServers(dnsServers);
    }
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB conectado correctamente");
};

module.exports = conectarDB;