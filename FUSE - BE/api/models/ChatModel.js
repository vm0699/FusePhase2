import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true },
  twilioChatChannelSid: { type: String, unique: true }, // Existing SID reference
  twilioChannelSid: { type: String }, // Optional alias for channel SID
  pairKey: { type: String }, // normalized "userA|userB"
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "closed"],
    default: "pending",
  },
});

// Enforce one active chat per pair (pending/accepted). For rejected/closed, controllers will upsert.
ChatSchema.index(
  { pairKey: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "accepted"] } } }
);

export default mongoose.model("Chat", ChatSchema);
