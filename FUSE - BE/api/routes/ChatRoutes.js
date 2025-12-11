import express from "express";
import { 
  sendCompliment, 
  getUserChats, 
  handleChatRequest,
  getTwilioToken
} from "../controllers/ChatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Send a compliment & initiate chat
router.post("/send-compliment", authMiddleware, sendCompliment);

// ✅ Handle chat request (accept or decline)
router.post("/handle-chat-request", authMiddleware, handleChatRequest);

// ✅ Get all user chats
router.get("/list", authMiddleware, getUserChats);

// ✅ Get Twilio token (FIX: Added authMiddleware)
router.get("/twilio-token", authMiddleware, getTwilioToken);

export default router;
