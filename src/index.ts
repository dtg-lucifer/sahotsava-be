import { Server, ServerCfg } from "./server";
import { log } from "./middlewares";
import { shutdown_handler } from "./utils/shutdown_handler";
import { Cache } from "./utils/cache";
import dotenv from "dotenv";

dotenv.config();

// Parse CORS origins from environment variable
const allowedOrigins = Bun.env.ALLOWED_ORIGINS
    ? Bun.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000"];

const server_cfg: Partial<ServerCfg> = {
    port: parseInt(Bun.env.PORT || "8989"),
    api_prefix: "/api/v1",
    cache: new Cache(),
    origins: allowedOrigins,
};

const server = new Server(server_cfg);

// Graceful shutdown handling
process.on("SIGTERM", () => shutdown_handler("SIGTERM", server));
process.on("SIGINT", () => shutdown_handler("SIGINT", server));

// Initialize and start the server
server
    .setup()
    .then(() => {
        server.start();
    })
    .catch((err) => {
        log.error("Failed to start server", err);
        process.exit(1);
    });
