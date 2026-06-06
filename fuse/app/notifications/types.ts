export const NOTIFICATION_TYPES = {
  COMPLIMENT_RECEIVED: "COMPLIMENT_RECEIVED",
  COMPLIMENT_ACCEPTED: "COMPLIMENT_ACCEPTED",
  COMPLIMENT_REJECTED: "COMPLIMENT_REJECTED",
  CHAT_MESSAGE: "CHAT_MESSAGE",
  GIFT_INTENT_RECEIVED: "GIFT_INTENT_RECEIVED",
  GIFT_INTENT_ACCEPTED: "GIFT_INTENT_ACCEPTED",
  GIFT_INTENT_REJECTED: "GIFT_INTENT_REJECTED",
  GIFT_PAYMENT_SUCCESS: "GIFT_PAYMENT_SUCCESS",
  GIFT_PAYMENT_FAILED: "GIFT_PAYMENT_FAILED",
  GIFT_ORDER_DISPATCHED: "GIFT_ORDER_DISPATCHED",
  GIFT_ORDER_DELIVERED: "GIFT_ORDER_DELIVERED",
  VIDEO_CALL_INVITE: "VIDEO_CALL_INVITE",
  VIDEO_CALL_MISSED: "VIDEO_CALL_MISSED",
  ACCOUNT_ALERT: "ACCOUNT_ALERT",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type NotificationPayloadData = {
  type: NotificationType | string;
  screen?: string;
  chatId?: string | null;
  intentId?: string | null;
  orderId?: string | null;
  senderId?: string | null;
  recipientId?: string | null;
  counterpartId?: string | null;
  messageId?: string | null;
  chatStatus?: string | null;
  paymentId?: string | null;
  room?: string | null;
  channelName?: string | null;
  callerUserId?: string | null;
  extra?: Record<string, any>;
};
