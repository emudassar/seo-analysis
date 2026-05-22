import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
        throw new Error("JWT_SECRET is not configured on the server");
    }
    return secret;
}

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), { expiresIn: "30d" });
};

const publicUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
};

// Register user
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

        // Create user
        const user = await User.create({ name, email, password: hashedPassword });

        const token = generateToken(user._id);

        res.status(201).json({ success: true, token, user: publicUser(user) });
    } catch (error) {
        console.error("Register error:", error.message);
        const msg = error.message?.includes("JWT_SECRET") ? error.message : "Server error";
        res.status(500).json({ success: false, message: msg });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(user._id);

        res.status(201).json({ success: true, token, user: publicUser(user) });
    } catch (error) {
        console.error("Login error:", error.message);
        const msg = error.message?.includes("JWT_SECRET") ? error.message : "Server error";
        res.status(500).json({ success: false, message: msg });
    }
};

// Get current user
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Get user error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
