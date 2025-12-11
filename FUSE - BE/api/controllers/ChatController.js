import Chat from "../models/ChatModel.js";
import UserProfile from "../models/UserProfile.js";
import client from "../config/twilio.js";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const normalizePairKey = (a, b) => {
  return [a.toString(), b.toString()].sort().join("|");
};

const ensureTwilioChannel = async (chat, userA, userB) => {
  const channelSid = chat.twilioChannelSid || chat.twilioChatChannelSid;

  const service = client.chat.v2.services(process.env.TWILIO_CHAT_SERVICE_SID);
  let channel = null;

  if (channelSid) {
    try {
      channel = await service.channels(channelSid).fetch();
    } catch (err) {
      // If fetch fails, we'll recreate below
      channel = null;
    }
  }

  if (!channel) {
    const friendlyName = `${userA}-${userB}`;
    const uniqueName = `chat-${normalizePairKey(userA, userB)}`;
    const created = await service.channels.create({ friendlyName, uniqueName });
    channel = await service.channels(created.sid).fetch();

    chat.twilioChannelSid = created.sid;
    chat.twilioChatChannelSid = chat.twilioChatChannelSid || created.sid;
    await chat.save();
  }

  // Ensure both participants are members
  const members = await service.channels(chat.twilioChannelSid || chat.twilioChatChannelSid).members.list();
  const memberIds = members.map((m) => m.identity);
  const idsToAdd = [];
  if (!memberIds.includes(userA.toString())) idsToAdd.push(userA);
  if (!memberIds.includes(userB.toString())) idsToAdd.push(userB);

  for (const id of idsToAdd) {
    await service.channels(chat.twilioChannelSid || chat.twilioChatChannelSid).members.create({ identity: id.toString() });
  }

  return chat.twilioChannelSid || chat.twilioChatChannelSid;
};

const appendComplimentMessage = async ({ chat, senderId, compliment, senderUsername }) => {
  const trimmed = (compliment || "").trim();
  if (!trimmed) return null;

  const now = Date.now();
  const recentDuplicate = (chat.messages || [])
    .slice(-5)
    .find(
      (m) =>
        m.sender?.toString() === senderId.toString() &&
        m.message === trimmed &&
        Math.abs(now - new Date(m.timestamp).getTime()) < 5 * 60 * 1000
    );

  if (!recentDuplicate) {
    chat.messages.push({ sender: senderId, message: trimmed, timestamp: new Date() });
    if (chat.twilioChannelSid || chat.twilioChatChannelSid) {
      await client.chat
        .services(process.env.TWILIO_CHAT_SERVICE_SID)
        .channels(chat.twilioChannelSid || chat.twilioChatChannelSid)
        .messages.create({ from: senderUsername || senderId.toString(), body: trimmed });
    }
    return trimmed;
  }

  return recentDuplicate.message;
};

/** Send Compliment & Initiate/Reuse Chat (idempotent, pair-based) */
export const sendCompliment = async (req, res) => {
  try {
    const { swipedUserId, compliment } = req.body;
    const senderId = req.user.id;
    const senderUsername = req.user.username;
    const trimmedCompliment = (compliment || "").trim();

    if (!swipedUserId) {
      return res.status(400).json({ success: false, message: "Missing recipient ID" });
    }

    if (!trimmedCompliment) {
      return res.status(400).json({ success: false, message: "Compliment cannot be empty" });
    }

    const pairKey = normalizePairKey(senderId, swipedUserId);

    let chat =
      (await Chat.findOne({ pairKey, status: { $in: ["pending", "accepted"] } })) ||
      (await Chat.findOne({
        $or: [
          { senderId, receiverId: swipedUserId },
          { senderId: swipedUserId, receiverId: senderId },
        ],
        status: { $in: ["pending", "accepted"] },
      })) ||
      (await Chat.findOne({ pairKey })) ||
      null;

    if (!chat) {
      chat = new Chat({
        senderId,
        receiverId: swipedUserId,
        pairKey,
        status: "pending",
        messages: [],
      });
    } else if (["rejected", "closed"].includes(chat.status)) {
      chat.status = "pending";
      chat.senderId = chat.senderId || senderId;
      chat.receiverId = chat.receiverId || swipedUserId;
    }
    chat.pairKey = pairKey;

    const channelSid = await ensureTwilioChannel(chat, senderId, swipedUserId);
    const complimentPreview = await appendComplimentMessage({
      chat,
      senderId,
      compliment: trimmedCompliment,
      senderUsername,
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      chatId: chat._id,
      status: chat.status,
      twilioChannelSid: channelSid,
      complimentPreview,
      senderId,
      recipientId: swipedUserId,
      showMatchedBanner: false,
    });
  } catch (error) {
    console.error("Error sending compliment:", error);
    return res.status(500).json({ success: false, message: "Failed to send compliment" });
  }
};

/** Fetch User Chats (pending + accepted) */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: { $in: ["accepted", "pending"] },
    }).populate("receiverId senderId");

    const formatted = (chats || [])
      .map((chat) => {
        const isCurrentUserSender = chat.senderId?._id?.toString() === userId;
        const otherUser = isCurrentUserSender ? chat.receiverId : chat.senderId;
        if (!otherUser) return null;

        const lastMsg = chat.messages?.length ? chat.messages[chat.messages.length - 1] : null;

        return {
          _id: chat._id,
          twilioChatChannelSid: chat.twilioChannelSid || chat.twilioChatChannelSid,
          twilioChannelSid: chat.twilioChannelSid || chat.twilioChatChannelSid,
          user: {
            id: otherUser._id,
            name: otherUser.name || "Unknown User",
            username: otherUser.username || "",
          },
          lastMessage: lastMsg,
          complimentPreview: lastMsg ? lastMsg.message : null,
          status: chat.status,
          isPending: chat.status === "pending",
          actualReceiverId: chat.receiverId?._id?.toString(),
          showMatchedBanner: false,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, chats: formatted });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve chats" });
  }
};

/** Handle Chat Request Accept/Reject (idempotent) */
export const handleChatRequest = async (req, res) => {
  try {
    const { chatId, action } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId).populate("senderId receiverId");
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const senderIdStr = chat.senderId?._id?.toString() || chat.senderId?.toString();
    const receiverIdStr = chat.receiverId?._id?.toString() || chat.receiverId?.toString();
    const otherUser = senderIdStr === userId?.toString() ? chat.receiverId : chat.senderId;
    const complimentPreview =
      chat.messages && chat.messages.length ? chat.messages[chat.messages.length - 1].message : null;
    chat.pairKey = chat.pairKey || normalizePairKey(senderIdStr, receiverIdStr);

    const participantIds = [senderIdStr, receiverIdStr].filter(Boolean);
    if (!participantIds.includes(userId.toString())) {
      return res.status(403).json({ success: false, message: "Unauthorized to modify this chat request" });
    }

    if (action === "accept") {
      const alreadyAccepted = chat.status === "accepted";
      if (!alreadyAccepted) {
        chat.status = "accepted";
        await ensureTwilioChannel(
          chat,
          chat.senderId?._id || chat.senderId,
          chat.receiverId?._id || chat.receiverId
        );
        await chat.save();
      }
      return res.status(200).json({
        success: true,
        chatId: chat._id,
        status: "accepted",
        twilioChannelSid: chat.twilioChannelSid || chat.twilioChatChannelSid,
        showMatchedBanner: !alreadyAccepted,
        complimentPreview: complimentPreview || null,
        otherUser: otherUser
          ? { _id: otherUser._id, name: otherUser.name, photos: otherUser.photos }
          : null,
      });
    }

    if (action === "reject") {
      const alreadyRejected = ["rejected", "closed"].includes(chat.status);
      if (!alreadyRejected) {
        chat.status = "rejected";
        await chat.save();
      }
      return res.status(200).json({
        success: true,
        chatId: chat._id,
        status: "rejected",
        complimentPreview: null,
        otherUser: null,
      });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("Error handling chat request:", error);
    return res.status(500).json({ success: false, message: "Failed to process chat request" });
  }
};

export const getTwilioToken = async (req, res) => {
  try {
    const { id: userId, username } = req.user;

    if (!userId || !username) {
      return res.status(401).json({ success: false, message: "Unauthorized - Missing user info" });
    }

    const AccessToken = twilio.jwt.AccessToken;
    const ChatGrant = AccessToken.ChatGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { identity: username }
    );

    token.addGrant(
      new ChatGrant({
        serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
      })
    );

    res.status(200).json({ token: token.toJwt() });
  } catch (error) {
    console.error("Error generating Twilio token:", error);
    res.status(500).json({ success: false, message: "Failed to generate token" });
  }
};
