// Helper to generate password
function generatePassword(prefix: string, firstName: string, timestamp: string): string {
	const timestampNum = Math.floor(new Date(timestamp).getTime() / 1000)
		.toString()
		.slice(5);
	return `${prefix}${firstName}@${timestampNum}`;
}

function hashPassword(password: string): string {}

function compareHashedPassword(password: string, hashed: string): boolean {}

export { generatePassword };
