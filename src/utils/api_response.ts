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

/**
 * Standardized API Response Helper
 */
export const api_response = {
    /**
     * Success response
     */
    success: <T>(message: string, data?: T, statusCode: number = 200) => ({
        success: true,
        message,
        data,
        statusCode,
    }),

    /**
     * Error response
     */
    error: (message: string, statusCode: number = 500, errors?: any) => ({
        success: false,
        message,
        errors,
        statusCode,
    }),
};
