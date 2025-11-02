import winston from "winston";
import morgan from "morgan";
import { logger, pino } from "@bogeychan/elysia-logger";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "warn";
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "blue",
    http: "magenta",
    debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:SS A" }),
    winston.format.colorize({ all: true }),
    winston.format.align(),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
);

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    ),
    winston.format.json()
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: "./logs/error.log",
        level: "error",
        format: jsonFormat,
    }),
    new winston.transports.File({ filename: "./logs/app.log" }),
];

const log = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

const { info, warn, debug, error } = log;

const stream = {
    write: (message: string) => log.http(message.trim()),
};

const skip = () => {
    const env = process.env.NODE_ENV || "development";
    return env !== "development";
};

const winston_logger = morgan(
    ":remote-addr :method :url :status - :response-time ms",
    { stream, skip }
);

export { info, warn, debug, error, log, winston_logger };
