import type { Express } from "express";
import express from "express"
import cors from "cors"

import { log, requestid_middleware, winston_logger } from "./middlewares";

export interface ServerCfg {
    port: number;
    api_prefix: string;
    cache: Record<string, Object>;
    origins: Array<string>;
}

export class Server {
    app: Express;
    config: ServerCfg;

    constructor() {
        this.app = express();
        this.config = {
            port: 8998,
            api_prefix: "/api/v1",
            cache: {},
            origins: ["localhost:3000"]
        }
    }

    //#region Server setup
    setup() {
        this.#setupMiddlewares()
        log.info("Successfully registered middlewares")

        this.#setupRoutes()
        log.info("Successfully registered routes")
    }
    //#endregion Server setup

    //#region Server private methods
    #setupRoutes() {

    }
    #setupMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({
            extended: true,
        }));
        this.app.use(
            cors({
                origin: this.config.origins,
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"],
                preflightContinue: false,
                optionsSuccessStatus: 204,
                methods: [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "OPTIONS",
                ]
            })
        );
        this.app.use(winston_logger)
        this.app.use(requestid_middleware)
    }
    //#endregion Server private methods

    start() {
        this.app.listen(Bun.env.PORT || 8989, () => {
            log.info(`Server is listening on port: ${Bun.env.PORT || 8989}`);
        })
    }
}
