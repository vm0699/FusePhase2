import UserProfile from "../models/UserProfile.js"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendOTP, verifyOTP } from "../middleware/otpService.js";

dotenv.config(); // Load environment variables

/**
 * Send OTP to the phone number using Twilio Verify API.
 */
export const verifyPhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number is required." });
  }

  try {
    const user = await UserProfile.findOne({ phoneNumber });

    let accessToken = null;
    let refreshToken = null;
    let profileComplete = false;

    if (user) {
      profileComplete = !!(
        user.name &&
        user.dateOfBirth &&
        user.username &&
        user.gender &&
        user.height &&
        user.interests?.length &&
        user.values?.length &&
        user.prompts?.length
      );

      // ✅ Generate JWT tokens for existing user
      accessToken = jwt.sign(
        { 
          id: user._id.toString(), 
          phoneNumber: user.phoneNumber, 
          username: user.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      refreshToken = jwt.sign(
        { 
          id: user._id.toString(), 
          phoneNumber: user.phoneNumber, 
          username: user.username 
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      console.log("✅ User exists. Logging in...");
      console.log("🔹 JWT Created:", { accessToken, refreshToken });

      return res.status(200).json({
        success: true,
        message: "User found. Logging in...",
        data: {
          accessToken,
          refreshToken,
          exists: true,
          profileComplete,
          user: {
            id: user._id.toString(),
            username: user.username,
          }
        }
      });
    }

    // ✅ If new user, create dummy fields for required values
    console.log("🚀 New user. Creating entry and sending OTP...");

    const defaultUser = await UserProfile.create({
      phoneNumber,
      name: "New User",
      username: `user${Math.floor(100000 + Math.random() * 900000)}`,
      gender: "Not specified",
      height: "Not specified",
      dateOfBirth: new Date("2000-01-01"), // fallback default DOB
      photos: [],
      interests: [],
      values: [],
      prompts: [],
    });

    // 🔑 Generate JWT tokens for new user
    accessToken = jwt.sign(
      {
        id: defaultUser._id.toString(),
        phoneNumber: defaultUser.phoneNumber,
        username: defaultUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    refreshToken = jwt.sign(
      {
        id: defaultUser._id.toString(),
        phoneNumber: defaultUser.phoneNumber,
        username: defaultUser.username,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await sendOTP(phoneNumber); // 📨 still send OTP

    return res.status(200).json({
      success: true,
      message: "New user created. OTP sent and token issued.",
      data: {
        accessToken,
        refreshToken,
        exists: false,
        profileComplete: false,
        user: {
          id: defaultUser._id.toString(),
          username: defaultUser.username,
        }
      }
    });

  } catch (error) {
    console.error("❌ Phone number verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};




/**
 * Verify OTP entered by the user.
 */
export const verifyCode = async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    console.error('❌ Missing phoneNumber or code:', { phoneNumber, code });
    return res.status(400).json({ success: false, message: "Phone number and OTP code are required." });
  }

  try {
    // Ensure phone number has exactly one '+' at the beginning
    let formattedPhoneNumber = phoneNumber.trim();
    if (!formattedPhoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${formattedPhoneNumber}`;
    }

    console.log('✅ Verifying OTP for:', formattedPhoneNumber, 'with code:', code);

    const verified = await verifyOTP(formattedPhoneNumber, code);
    if (verified) {
      console.log('✅ OTP verified successfully.');
      return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } else {
      console.error('❌ Invalid OTP entered:', formattedPhoneNumber);
      return res.status(401).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error.message);
    return res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
};



/**
 * Refresh JWT Token for user.
 */
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token is required." });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, phoneNumber: decoded.phoneNumber, username: decoded.username }, // ✅ Added `username`
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Refresh token is invalid or expired.",
    });
  }
};