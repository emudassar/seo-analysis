import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";

const PORT = process.env.PORT || 5000;

async function start() {
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
