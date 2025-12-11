import { Router } from "express";
import Like from "../models/Like.js";
import UserProfile from "../models/UserProfile.js";
import Chat from "../models/ChatModel.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ƒo. Correct way

const router = Router(); // ƒo. Using Router()

// dY"æ Route: Like a user
router.post("/like", authMiddleware, async (req, res) => {
  try {
    const { likedUserId } = req.body;
    const likerId = req.user.id;

    if (!likedUserId) {
      return res.status(400).json({ success: false, message: "Liked user ID missing" });
    }

    const like = await Like.findOneAndUpdate(
      { likerId, likedUserId },
      { $setOnInsert: { likerId, likedUserId, status: "pending" } },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, message: "User liked successfully", like });
  } catch (error) {
    console.error("Error liking user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// dY"æ Route: Get users who liked you (pending plain likes + pending compliment chats)
router.get("/likedyou", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pending plain likes
    const likes = await Like.find({
      likedUserId: userId,
      $or: [{ status: "pending" }, { status: { $exists: false } }],
    }).populate("likerId");
    const likeEntries = (likes || [])
      .map((like) => {
        const liker = like.likerId;
        if (!liker) return null;
        return {
          _id: liker._id,
          name: liker.name,
          photos: liker.photos || [],
          status: "pending",
          complimentPreview: null,
          chatId: null,
          twilioChannelSid: null,
          dateOfBirth: liker.dateOfBirth,
          gender: liker.gender,
          height: liker.height,
          interests: liker.interests || [],
          values: liker.values || [],
          prompts: liker.prompts || [],
        };
      })
      .filter(Boolean);

    // Pending compliment-based chats (receiver side)
    const pendingChats = await Chat.find({ receiverId: userId, status: "pending" }).populate("senderId");
    const chatEntries = (pendingChats || [])
      .map((chat) => {
        const sender = chat.senderId;
        if (!sender) return null;
        const lastMsg = chat.messages?.length ? chat.messages[chat.messages.length - 1] : null;
        return {
          _id: sender._id,
          name: sender.name,
          photos: sender.photos || [],
          status: "pending",
          complimentPreview: lastMsg ? lastMsg.message : null,
          chatId: chat._id,
          twilioChannelSid: chat.twilioChannelSid || chat.twilioChatChannelSid || null,
          dateOfBirth: sender.dateOfBirth,
          gender: sender.gender,
          height: sender.height,
          interests: sender.interests || [],
          values: sender.values || [],
          prompts: sender.prompts || [],
        };
      })
      .filter(Boolean);

    const users = [...likeEntries, ...chatEntries];

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
