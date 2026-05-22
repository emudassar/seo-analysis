import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";

const PORT = process.env.PORT || 5000;

function warnMissingEnv() {
    const missing = [];
    if (!process.env.JWT_SECRET?.trim()) missing.push("JWT_SECRET");
    if (!process.env.GEMINI_API_KEY?.trim()) missing.push("GEMINI_API_KEY");
    if (missing.length) {
        console.warn(`[ENV] Missing on server: ${missing.join(", ")} — auth/AI features will fail until set in Render Environment.`);
    }
}

async function start() {
    warnMissingEnv();
    try {
        await connectDB();
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get("/", (req, res) => res.send("Server is running"));
    app.use("/api/auth", authRouter);
    app.use("/api/analysis", analysisRouter);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
