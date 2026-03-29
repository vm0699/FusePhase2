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
import { createGiftOrder,createGiftIntent,acceptGiftIntent,rejectGiftIntent } from "../controllers/ChatController.js";
import {
  initiateGiftPayment,
  confirmGiftPayment,
} from "../controllers/GiftPaymentController.js";
import {
  getSentGifts,
  getReceivedGifts,
  updateGiftOrderStatus,
} from "../controllers/GiftTrackingController.js";



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

// 🎁 Create gift order from chat
router.post("/:chatId/gift", authMiddleware, createGiftOrder);

router.post("/:chatId/gift-intent",authMiddleware,createGiftIntent);

router.post("/gift-intent/:intentId/accept", authMiddleware, acceptGiftIntent);
router.post("/gift-intent/:intentId/reject", authMiddleware, rejectGiftIntent);
router.post(
  "/gift-intent/:intentId/pay", 
  authMiddleware,
  initiateGiftPayment
);

router.post(
  "/gift-intent/:intentId/pay/confirm",
  authMiddleware,
  confirmGiftPayment
);

// All gifts I have sent (across all chats)
router.get("/gifts/sent", authMiddleware, getSentGifts);

// All gifts I have received
router.get("/gifts/received", authMiddleware, getReceivedGifts);

// Update order lifecycle status (for now: sender/recipient; later: admin/ops)
router.patch(
  "/gifts/order/:orderId/status",
  authMiddleware,
  updateGiftOrderStatus
);

export default router;
