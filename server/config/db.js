import mongoose from "mongoose";

function getMongoUri() {
    return (
        process.env.MONGODB_URI?.trim() ||
        process.env.DATABASE_URL?.trim() ||
        process.env.MONGO_URI?.trim() ||
        ""
    );
}

const connectDB = async () => {
    const uri = getMongoUri();
    if (!uri) {
        console.error(
            "Missing MongoDB connection string. Set MONGODB_URI in your host's environment variables (Render → Environment)."
        );
        process.exit(1);
    }

    mongoose.connection.on("connected", () => console.log("MongoDB connected"));
    mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));

    await mongoose.connect(uri);
};

export default connectDB;
