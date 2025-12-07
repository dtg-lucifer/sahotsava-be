import * as bcrypt from "bcrypt";

// Helper to generate password
function generatePassword(
	prefix: string,
	firstName: string,
	timestamp: string,
): string {
	const timestampNum = Math.floor(new Date(timestamp).getTime() / 1000)
		.toString()
		.slice(5);
	return `${prefix}${firstName}@${timestampNum}`;
}

async function hashPassword(password: string): Promise<string> {
	const hashed = await bcrypt.hash(password, 10);
	return hashed;
}

function compareHashedPassword(password: string, hashed: string): boolean {
	return bcrypt.compareSync(password, hashed);
}

export { compareHashedPassword, generatePassword, hashPassword };
