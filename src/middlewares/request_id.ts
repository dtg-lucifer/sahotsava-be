import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from "express";

export function requestid_middleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const requestId = uuidv4();

    (req as any).request_id = requestId;
    (res as any).request_id = requestId;

    res.setHeader("X-Request-ID", requestId);

    next();
}
