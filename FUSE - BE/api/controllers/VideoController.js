import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

export const generateVideoToken = async (req, res) => {
  try {
    const { room } = req.body;
    const userId = req.user?.id;

    if (!userId || !room) {
      return res
        .status(400)
        .json({ success: false, message: "Missing identity or room" });
    }

    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_API_KEY_SID ||
      !process.env.TWILIO_API_KEY_SECRET
    ) {
      return res
        .status(500)
        .json({ success: false, message: "Twilio credentials missing" });
    }

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      {
        ttl: 3600,
        identity: userId.toString(),
      }
    );

    token.addGrant(new VideoGrant({ room: String(room).trim() }));

    return res.status(200).json({
      success: true,
      token: token.toJwt(),
      room: String(room).trim(),
      identity: userId.toString(),
    });
  } catch (error) {
    console.error("Error generating Twilio video token:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Twilio token",
    });
  }
};
