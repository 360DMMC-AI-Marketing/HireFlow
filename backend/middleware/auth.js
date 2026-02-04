import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({ error: "Not authorized to access this route" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ error: "User not found" });
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: "Not authorized, token failed" });
    }
};