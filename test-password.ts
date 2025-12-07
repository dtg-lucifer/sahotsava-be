import { PrismaClient } from "./src/generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function testPassword() {
    const email = "dev.bosepiush@gmail.com";
    const testPassword = "SA_Piush@15437";

    const user = await prisma.user.findUnique({
        where: { email: email },
        select: {
            email: true,
            password: true,
            is_verified: true,
        },
    });

    if (!user) {
        console.log("❌ User not found!");
        return;
    }

    console.log("✓ User found:", email);
    console.log("✓ Is verified:", user.is_verified);
    console.log("✓ Password hash:", user.password.substring(0, 20) + "...");

    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log("\nTesting password:", testPassword);
    console.log("Password match:", isMatch ? "✅ YES" : "❌ NO");

    // Also test what the hash would be for the test password
    const testHash = await bcrypt.hash(testPassword, 10);
    console.log(
        "\nNew hash of test password:",
        testHash.substring(0, 20) + "...",
    );

    await prisma.$disconnect();
}

testPassword().catch(console.error);
