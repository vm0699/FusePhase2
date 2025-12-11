import UserProfile from '../models/UserProfile.js';
import Like from '../models/Like.js';
import Chat from '../models/ChatModel.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

// ✅ Get User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('📌 Retrieved User Profile:', user);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: user.phoneNumber,
        name: user.name,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        height: user.height,
        interests: user.interests,
        values: user.values,
        prompts: user.prompts,
        photos: user.photos,
        location: user.location, // ✅ Logs location data
      },
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ✅ Update User Location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      console.error('❌ Invalid location data received:', req.body);
      return res.status(400).json({ success: false, message: 'Invalid location data' });
    }

    console.log('📌 Updating location for user:', req.user.id, 'to:', { latitude, longitude });

    const user = await UserProfile.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found for location update:', req.user.id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.location = { latitude, longitude };
    await user.save();

    console.log('✅ Location updated successfully:', user.location);

    res.status(200).json({ success: true, message: 'Location updated successfully', location: user.location });
  } catch (error) {
    console.error('❌ Error updating location:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

// ✅ Delete Account and Related Data
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("🗑️ Deleting user:", userId);

    // 1. Delete user profile
    const user = await UserProfile.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Delete all likes related to this user
    await Like.deleteMany({
      $or: [{ likerId: userId }, { likedUserId: userId }]
    });

    // 3. Delete all chats involving this user
    await Chat.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    // 4. Clean references from other user profiles
    await UserProfile.updateMany(
      {},
      {
        $pull: {
          swipedRight: userId,
          swipedLeft: userId,
          matches: userId,
          swipedUserIds: userId,
        },
      }
    );

    // 5. Delete user's uploaded photos from S3
    if (user.photos && user.photos.length > 0) {
      const deletePromises = user.photos.map((url) => {
        const filename = url.split('/').pop();
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
        });
        return s3.send(command);
      });

      await Promise.all(deletePromises);
      console.log("✅ Deleted photos from S3");
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Server error during account deletion' });
  }
};
