// server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './api/config/db.js';
import profileRoutes from './api/routes/ProfileRoutes.js';
import authRoutes from './api/routes/auth.js';
import userRoutes from './api/routes/User.js';
import chatRoutes from './api/routes/ChatRoutes.js';
import videoRoutes from './api/routes/VideoRoutes.js';
import likeRoutes from './api/routes/likeRoutes.js';
import twilio from 'twilio';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import AgoraTokenPkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = AgoraTokenPkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
  console.error("\u274C Twilio credentials are missing! Check your .env file.");
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/likes', likeRoutes); 

app.post('/api/video/token', async (req, res) => {
  try {
    const { identity, room } = req.body;
    if (!identity || !room) return res.status(400).json({ success: false, message: "Missing identity or room" });

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { ttl: 3600 });
    token.identity = identity;
    token.addGrant(new VideoGrant({ room }));

    res.json({ success: true, token: token.toJwt(), room });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate Twilio token" });
  }
});

app.get('/room/:roomId', (req, res) => {
  const videoPath = path.join(__dirname, 'public', 'video.html');
  if (!fs.existsSync(videoPath)) return res.status(404).send("Video Call Page Not Found");
  res.sendFile(videoPath);
});

app.get('/api/agora/token', (req, res) => {
  const { channelName, uid } = req.query;
  const AGORA_APP_ID = process.env.AGORA_APP_ID;
  const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) return res.status(500).json({ error: 'Agora credentials are missing in .env' });
  if (!channelName || !uid) return res.status(400).json({ error: 'channelName and uid are required' });

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    parseInt(uid),
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + 3600
  );
  return res.json({ token });
});

app.get('/', (req, res) => res.send('Server running \u2705'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const interestQueues = new Map();
const userToInterest = new Map();

io.on("connection", (socket) => {
  socket.on("join_video_queue", ({ userId, interests }) => {
    const normInterests = interests.map(i => i.toLowerCase());
    const joinedAt = Date.now();

    for (let interest of normInterests) {
      const queue = interestQueues.get(interest);
      if (queue && queue.length > 0) {
        const matchUser = queue.shift();
        userToInterest.delete(matchUser.userId);
        const room = `room_${Date.now()}`;
        io.to(matchUser.socketId).emit("match_found", { matchedUserId: userId, room, matchedInterest: interest });
        io.to(socket.id).emit("match_found", { matchedUserId: matchUser.userId, room, matchedInterest: interest });
        return;
      }
    }

    for (let [interest, queue] of interestQueues.entries()) {
      for (let i = 0; i < queue.length; i++) {
        const other = queue[i];
        for (let iWord of normInterests) {
          for (let oWord of other.interests) {
            const loose = iWord.split('').some(c => oWord.includes(c));
            if (loose) {
              queue.splice(i, 1);
              userToInterest.delete(other.userId);
              const room = `room_${Date.now()}`;
              io.to(other.socketId).emit("match_found", { matchedUserId: userId, room, matchedInterest: oWord });
              io.to(socket.id).emit("match_found", { matchedUserId: other.userId, room, matchedInterest: oWord });
              return;
            }
          }
        }
      }
    }

    for (let [_, queue] of interestQueues.entries()) {
      if (queue.length > 0) {
        const fallback = queue.shift();
        userToInterest.delete(fallback.userId);
        const room = `room_${Date.now()}`;
        io.to(fallback.socketId).emit("match_found", { matchedUserId: userId, room, matchedInterest: null });
        io.to(socket.id).emit("match_found", { matchedUserId: fallback.userId, room, matchedInterest: null });
        return;
      }
    }

    const topInterest = normInterests[0] || "any";
    if (!interestQueues.has(topInterest)) interestQueues.set(topInterest, []);
    interestQueues.get(topInterest).push({ userId, socketId: socket.id, interests: normInterests, joinedAt });
    userToInterest.set(userId, topInterest);
  });

  socket.on("disconnect", () => {
    for (let [interest, queue] of interestQueues.entries()) {
      interestQueues.set(interest, queue.filter(u => u.socketId !== socket.id));
    }
    for (let [userId, interest] of userToInterest.entries()) {
      userToInterest.delete(userId);
    }
  });
});

io.on("connection_error", (err) => console.error("WebSocket Error:", err.message));

server.listen(PORT, () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
  console.log(`✅ WebSocket Server running on port ${PORT}`);
});

