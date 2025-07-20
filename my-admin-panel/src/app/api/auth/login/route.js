// my-admin-panel/src/app/api/auth/login/route.js
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: "Email and password are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const client = await clientPromise;
        const db = client.db(); // uses the database from connection string

        const user = await db.collection("users").findOne({ email: email.toLowerCase() });
        if (!user) {
            return new Response(
                JSON.stringify({ error: "Invalid email or password" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Compare hashed password
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return new Response(
                JSON.stringify({ error: "Invalid email or password" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create JWT payload
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            // add other claims as needed
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET not set in environment variables");

        // Sign JWT token (expires in 1 hour)
        const token = jwt.sign(payload, secret, { expiresIn: "1h" });

        // Return user info and token (do NOT return password)
        const userResponse = {
            id: user._id,
            email: user.email,
            name: user.name || null,
            // add other public user fields here as needed
        };

        return new Response(
            JSON.stringify({ token, user: userResponse }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Login error:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
