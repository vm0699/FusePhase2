/**
 * Razorpay checkout via WebView.
 *
 * In PLACEHOLDER mode the backend returns a fake providerOrderId — we skip
 * the WebView entirely and auto-confirm. In RAZORPAY mode we open a minimal
 * HTML page that loads the Razorpay checkout.js SDK and resolves with payment
 * details once the user completes or dismisses.
 *
 * Usage:
 *   const result = await openRazorpayCheckout({ amount, keyId, orderId, description, userName, userEmail });
 *   if (result.success) { confirmPayment(result.paymentId, result.signature) }
 *   else { handleFailure(result.error) }
 */

export type RazorpayCheckoutParams = {
  /** INR amount in paise (Razorpay native) OR rupees — we convert to paise below */
  amount: number;
  /** Key ID from backend (rzp_test_xxx) */
  keyId: string;
  /** Razorpay order ID (order_xxx) */
  orderId: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  brandColor?: string;
};

export type RazorpayCheckoutResult =
  | { success: true; paymentId: string; orderId: string; signature: string }
  | { success: false; error: string; code?: string };

/**
 * Build the HTML payload loaded in the WebView.
 * Returns a data URI so no server round-trip is needed.
 */
export function buildRazorpayHtml(params: RazorpayCheckoutParams): string {
  const {
    amount,
    keyId,
    orderId,
    description = "Fuse Experience",
    userName = "",
    userEmail = "",
    userPhone = "",
    brandColor = "#ff5864",
  } = params;

  // Backend paymentProvider returns amount in INR rupees; Razorpay expects paise.
  const amountPaise = Math.round(amount * 100);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background: #FAF8F3; display: flex; align-items: center;
           justify-content: center; height: 100vh; font-family: sans-serif; }
    .loading { text-align: center; color: #888; font-size: 14px; }
    .dot { display: inline-block; animation: blink 1.2s infinite; }
    .dot:nth-child(2) { animation-delay: 0.4s; }
    .dot:nth-child(3) { animation-delay: 0.8s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0 } 40% { opacity: 1 } }
  </style>
</head>
<body>
  <div class="loading">Opening payment<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function postMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    window.onload = function () {
      var options = {
        key: "${keyId}",
        amount: ${amountPaise},
        currency: "INR",
        name: "Fuse",
        description: "${description.replace(/"/g, '\\"')}",
        order_id: "${orderId}",
        prefill: {
          name: "${userName.replace(/"/g, '\\"')}",
          email: "${userEmail.replace(/"/g, '\\"')}",
          contact: "${userPhone.replace(/"/g, '\\"')}"
        },
        theme: { color: "${brandColor}" },
        modal: {
          ondismiss: function () {
            postMessage({ type: "DISMISS" });
          }
        },
        handler: function (response) {
          postMessage({
            type: "SUCCESS",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        }
      };

      try {
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function (response) {
          postMessage({
            type: "FAILED",
            code: response.error.code,
            description: response.error.description
          });
        });
        rzp.open();
      } catch (e) {
        postMessage({ type: "ERROR", error: e.toString() });
      }
    };
  </script>
</body>
</html>`;

  return html;
}

/**
 * Parse a WebView message and return a typed result.
 * Returns null if the message should be ignored (navigation events etc.)
 */
export function parseRazorpayMessage(
  raw: string
): RazorpayCheckoutResult | "dismiss" | null {
  try {
    const msg = JSON.parse(raw);
    if (msg.type === "SUCCESS") {
      return {
        success: true,
        paymentId: msg.razorpay_payment_id,
        orderId: msg.razorpay_order_id,
        signature: msg.razorpay_signature,
      };
    }
    if (msg.type === "DISMISS") {
      return "dismiss";
    }
    if (msg.type === "FAILED" || msg.type === "ERROR") {
      return {
        success: false,
        error: msg.description || msg.error || "Payment failed",
        code: msg.code,
      };
    }
    return null;
  } catch {
    return null;
  }
}
