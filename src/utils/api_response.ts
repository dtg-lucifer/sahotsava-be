import { response } from "express";
import { log } from "../middlewares";

export class AuthError extends Error {
    statusCode: number;
    message: string;
    name: string;
    requestId: string | null;

    constructor(
        message: string,
        statusCode: number,
        requestId: string | null = null,
    ) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.requestId = requestId;
        this.name = "AuthError";
    }
}

export class APIError extends AuthError {
    constructor(
        message: string,
        statusCode: number,
        requestId: string | null = null,
    ) {
        super(message, statusCode, requestId);
        this.name = "APIError";
    }

    logError() {
        log.error(
            `APIError: ${this.message}, StatusCode: ${this.statusCode}, RequestId: ${this.requestId}`,
        );
    }
}
