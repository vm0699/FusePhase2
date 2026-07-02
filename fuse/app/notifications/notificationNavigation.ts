import { NOTIFICATION_TYPES, NotificationPayloadData } from "./types";

type NotificationRoute =
  | { name: string; params?: Record<string, any> }
  | null;

export function resolveNotificationRoute(
  data: NotificationPayloadData | null | undefined
): NotificationRoute {
  if (!data?.type) return null;

  const extra = data.extra || {};
  const counterpartId = data.counterpartId || data.senderId || null;
  const counterpartName =
    extra.counterpartName || extra.senderName || "Fuse connection";
  const twilioChannelSid = extra.twilioChannelSid || null;

  switch (data.type) {
    case NOTIFICATION_TYPES.CHAT_MESSAGE:
    case NOTIFICATION_TYPES.COMPLIMENT_RECEIVED:
    case NOTIFICATION_TYPES.COMPLIMENT_ACCEPTED:
      if (!data.chatId) return { name: "ChatListScreen" };
      return {
        name: "ChatScreen",
        params: {
          receiverId: counterpartId,
          receiverUsername: counterpartName,
          chatId: data.chatId,
          channelSid: twilioChannelSid,
          twilioChatChannelSid: twilioChannelSid,
          chatStatus: data.chatStatus || "accepted",
          actualReceiverId: data.recipientId || null,
          complimentPreview: extra.complimentPreview || null,
          showMatchedBanner: data.type === NOTIFICATION_TYPES.COMPLIMENT_ACCEPTED,
        },
      };

    case NOTIFICATION_TYPES.COMPLIMENT_REJECTED:
      return { name: "Liked You" };

    case NOTIFICATION_TYPES.GIFT_INTENT_RECEIVED:
    case NOTIFICATION_TYPES.GIFT_INTENT_ACCEPTED:
    case NOTIFICATION_TYPES.GIFT_INTENT_REJECTED:
    case NOTIFICATION_TYPES.GIFT_PAYMENT_FAILED:
      if (!data.intentId) return { name: "ChatListScreen" };
      return {
        name: "GiftIntentDetailsScreen",
        params: {
          intentId: data.intentId,
          chatId: data.chatId || null,
        },
      };

    case NOTIFICATION_TYPES.GIFT_PAYMENT_SUCCESS:
    case NOTIFICATION_TYPES.GIFT_ORDER_DISPATCHED:
    case NOTIFICATION_TYPES.GIFT_ORDER_DELIVERED:
    case NOTIFICATION_TYPES.GIFT_ORDER_STATUS:
    case NOTIFICATION_TYPES.GIFT_ORDER_DECLINED:
    case NOTIFICATION_TYPES.GIFT_REFUND_UPDATE:
    case NOTIFICATION_TYPES.GIFT_ADMIN_NEW_ORDER:
      if (!data.orderId && data.intentId) {
        return {
          name: "GiftIntentDetailsScreen",
          params: {
            intentId: data.intentId,
            chatId: data.chatId || null,
          },
        };
      }
      if (!data.orderId) return { name: "ChatListScreen" };
      return {
        name: "GiftOrderTrackingScreen",
        params: {
          orderId: data.orderId,
          chatId: data.chatId || null,
        },
      };

    case NOTIFICATION_TYPES.VIDEO_CALL_INVITE:
    case NOTIFICATION_TYPES.VIDEO_CALL_MISSED:
      return {
        name: "VideoInitiateScreen",
        params: {
          sourceNotification: data.type,
          callerUserId: data.callerUserId || data.senderId || null,
          room: data.room || null,
          channelName: data.channelName || null,
        },
      };

    case NOTIFICATION_TYPES.ACCOUNT_ALERT:
      return {
        name: "NotificationSettings",
        params: {
          sourceNotification: data.type,
        },
      };

    // ─── Explore — bookings ──────────────────────────────────────────────
    case NOTIFICATION_TYPES.BOOKING_CONFIRMED:
    case NOTIFICATION_TYPES.BOOKING_INVITE_RECEIVED:
    case NOTIFICATION_TYPES.BOOKING_INVITE_ACCEPTED:
    case NOTIFICATION_TYPES.BOOKING_INVITE_DECLINED:
    case NOTIFICATION_TYPES.BOOKING_INVITE_EXPIRED:
    case NOTIFICATION_TYPES.BOOKING_CANCELLED:
      return { name: "MyBookings" };

    // ─── Explore — tickets ───────────────────────────────────────────────
    case NOTIFICATION_TYPES.TICKET_CONFIRMED:
    case NOTIFICATION_TYPES.TICKET_FULFILLED:
      return { name: "MyTicketOrders" };

    // ─── Explore — premium ───────────────────────────────────────────────
    case NOTIFICATION_TYPES.PREMIUM_QUOTE_READY:
    case NOTIFICATION_TYPES.PREMIUM_CONFIRMED:
      return { name: "ExploreHome" };

    default:
      return { name: "MainTabs" };
  }
}
