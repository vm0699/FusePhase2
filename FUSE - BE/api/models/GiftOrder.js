import mongoose from "mongoose";

const GiftOrderSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    // Link back to the original intent (optional for older orders)
    intentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftIntent",
      default: null,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },

    tier: {
      type: String,
      enum: ["LOW", "MID", "HIGH"],
      default: "LOW",
    },

    items: [
      {
        itemId: String, // internal Fuse ID
        name: String,
        quantity: Number,
        price: Number,
        source: {
          type: String,
          default: "FUSE_MANUAL", // e.g. BLINKIT, ZEPTO later
        },
      },
    ],

    source: {
      type: String,
      default: "FUSE_MANUAL",
    },

    // 💰 Total amount paid by both sides together
    totalAmount: {
      type: Number,
      required: true,
    },

    // 💰 Split of who actually paid how much
    senderPaidAmount: {
      type: Number,
      default: 0,
    },
    recipientPaidAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // 📈 Revenue knobs (we can tune later)
    platformFee: {
      // what Fuse keeps as margin (included inside totalAmount)
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    vendorCost: {
      // actual bill from Blinkit/local partner when you order manually
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "CREATED",          // payments done, ready for manual fulfilment
        "PAYMENT_PENDING",  // should not happen for new flow, but safe
        "READY_TO_FULFILL", // confirmed + validated by ops
        "FULFILLED",        // delivered
        "CANCELLED",
        "REFUNDED",
      ],
      default: "CREATED",
    },

    // Delivery snapshot (copied from recipient profile at order time)
    deliverySnapshot: {
      name: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      pincode: String,
      notes: String,
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("GiftOrder", GiftOrderSchema);
