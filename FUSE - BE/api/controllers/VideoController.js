import twilio from "twilio";
import jwt from "jsonwebtoken"; // Ensure JWT is imported

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ✅ Generate Twilio Video Call Token (Fixed Identity Issue)
export const generateVideoToken = async (req, res) => {
  try {
    console.log("📥 Incoming API Request:", req.body);

    let { identity, room } = req.body;

    // ✅ Decode JWT token (identity contains the JWT)
    const decoded = jwt.decode(identity);
    if (!decoded || !decoded.username) {
      console.error("❌ Invalid identity provided in token (Missing username)");
      return res.status(400).json({ success: false, message: "Invalid identity in token" });
    }

    // ✅ Extract username from decoded JWT
    const username = String(decoded.username).trim();

    // ✅ Ensure room is a valid string
    room = String(room).trim();

    console.log(`🔹 Identity (Username) Received: ${username} | Type: ${typeof username}`);
    console.log(`🔹 Room Received: ${room} | Type: ${typeof room}`);

    if (!username || !room) {
      console.warn("⚠️ Missing identity or room:", { username, room });
      return res.status(400).json({ success: false, message: "Missing identity or room" });
    }

    // ✅ Ensure Twilio environment variables are set
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_API_KEY_SID || !process.env.TWILIO_API_KEY_SECRET) {
      console.error("❌ Twilio Credentials Missing in .env");
      return res.status(500).json({ success: false, message: "Twilio credentials missing" });
    }

    console.log(`🔹 Creating Twilio AccessToken for: { identity: '${username}', room: '${room}' }`);

    // ✅ Generate Twilio AccessToken (Fixed Identity Issue)
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { ttl: 3600, identity: username } // ✅ Set identity in options
    );

    token.addGrant(new VideoGrant({ room }));

    console.log(`✅ Twilio Token Created Successfully for ${username} in Room ${room}`);

    res.status(200).json({ success: true, token: token.toJwt(), room });

  } catch (error) {
    console.error("❌ Error generating Twilio token:", error);
    res.status(500).json({ success: false, message: "Failed to generate Twilio token", error: error.message });
  }
};
