import crypto from "crypto";

// Helper to generate UID
function generateUID(prefix: string): string {
    return `${prefix}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export { generateUID };
