import { log } from "../middlewares";
import { Server } from "../server";

export const shutdown_handler = async (signal: string, server: Server) => {
    log.info(`Received ${signal}, starting graceful shutdown...`);
    try {
        await server.shutdown();
        process.exit(0);
    } catch (err) {
        log.error("Error during graceful shutdown", err);
        process.exit(1);
    }
};
