import jwt from "jsonwebtoken";
import UserProfile from "../models/UserProfile.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("🔹 Received Authorization Header:", req.headers.authorization);

    if (!token) {
      console.log("❌ Auth Middleware: No token provided.");
      return res.status(401).json({ success: false, message: "Unauthorized: No token" });
    }

    // ✅ Verify JWT and Extract Data
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("❌ JWT Error:", error.message);
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }

    console.log("🔹 Decoded JWT:", decoded);

    // ✅ Ensure `id`, `phoneNumber`, and `username` exist in the decoded token
    if (!decoded.id || typeof decoded.id !== "string" || !decoded.phoneNumber || !decoded.username) {
      console.warn("⚠️ Token is missing 'id', 'phoneNumber', or 'username'. Decoded:", decoded);
      return res.status(400).json({ success: false, message: "Invalid token data (Missing user fields)" });
    }

    // ✅ Convert `id` to String (if needed) before querying MongoDB
    const userId = String(decoded.id).trim();

    console.log(`🔹 Fetching user from DB: ID = ${userId}`);

    // ✅ Fetch User from Database by `id`
    const user = await UserProfile.findById(userId);

    if (!user) {
      console.warn("⚠️ Auth Middleware: User not found in database.");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Attach user details to `req.user` for use in other middleware/routes
    req.user = {
      id: user._id.toString(),  // Ensure it remains a String
      phoneNumber: user.phoneNumber,
      username: user.username,  // ✅ Ensured username is included
      name: user.name,
      gender: user.gender,  // ✅ Ensure gender is included
      interests: user.interests || [], // ✅ Ensure interests are included
    };

    console.log("✅ Authenticated user:", req.user);
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Server error during authentication" });
  }
};

export default authMiddleware;
