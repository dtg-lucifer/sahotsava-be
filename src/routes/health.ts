import { Router } from "express";

const healthcheck_router = Router();

healthcheck_router.get("/health", (req, res) => {
    res
        .status(200)
        .json({
            msg: "success"
        })
})
