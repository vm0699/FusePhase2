import express from "express";
import { 
  sendCompliment, 
  getUserChats, 
  handleChatRequest,
  getTwilioToken,
  closeChat,
  getChatMessages,
  saveChatMessage,// 🔹 ADDITION (Phase 2)
} from "../controllers/ChatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Send a compliment & initiate chat
router.post("/send-compliment", authMiddleware, sendCompliment);

// ✅ Handle chat request (accept or decline)
router.post("/handle-chat-request", authMiddleware, handleChatRequest);

// ✅ Get all user chats
router.get("/list", authMiddleware, getUserChats);

// ✅ Get Twilio token
router.get("/twilio-token", authMiddleware, getTwilioToken);

// 🔹 Phase 1
// ✅ Close / unmatch an accepted chat
router.post("/close", authMiddleware, closeChat);

// 🔹 Phase 2
// ✅ Get chat message history from DB
router.get("/:chatId/messages", authMiddleware, getChatMessages);
// ✅ Save realtime message to DB (Phase 3)
router.post("/:chatId/messages", authMiddleware, saveChatMessage);

export default router;
