import UserProfile from '../models/UserProfile.js';
import Like from '../models/Like.js';
import Chat from '../models/ChatModel.js';
import client from "../config/twilio.js";
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Save or Update User Profile
export const saveUserProfile = async (req, res) => {
  try {
    const { intro, options, profileDetails, prompts, phoneNumber, photos } = req.body;

    // ƒo. Ensure all required fields are provided
    if (
      !intro?.name ||
      !intro?.dob ||
      !options?.username ||
      !options?.gender ||
      !profileDetails?.height ||
      !profileDetails?.interests?.length ||
      !profileDetails?.values?.length ||
      !prompts?.length ||
      !phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required profile fields.",
      });
    }

    // ƒo. Find the user (already created during phone verification)
    const existingUser = await UserProfile.findOne({ phoneNumber });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please verify your phone number first.",
      });
    }

    // ƒo. Update the dummy user with full profile data
    existingUser.name = intro.name;
    existingUser.dateOfBirth = intro.dob;
    existingUser.username = options.username;
    existingUser.gender = options.gender;
    existingUser.height = profileDetails.height;
    existingUser.interests = profileDetails.interests;
    existingUser.values = profileDetails.values;
    existingUser.prompts = prompts;
    existingUser.photos = photos;

    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        accessToken: jwt.sign({ phoneNumber }, process.env.JWT_SECRET, { expiresIn: "1h" }),
        refreshToken: jwt.sign({ phoneNumber }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" }),
      },
    });
  } catch (error) {
    console.error("ƒ?O Error saving profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving the profile.",
    });
  }
};




// Fetch User Profile by Phone Number (JWT)
// Fetch User Profile by Phone Number (JWT)
export const getProfileByPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.user;

    const user = await UserProfile.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    // ƒo. Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(user);

    // ƒo. Normalize photo URLs
    const fixedPhotos = (user.photos || []).map(photo => {
      if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
      const normalized = photo.replace(/\\/g, "/"); // Convert backslashes to forward slashes
      return `http://172.20.10.4:5000/${normalized}`; // Add full URL prefix
    });

    console.log("dY\"1 Backend User Profile Response:", {
      name: user.name,
      phoneNumber: user.phoneNumber,
      photos: fixedPhotos,
    });

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully!',
      data: {
        name: user.name,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        height: user.height,
        interests: user.interests,
        values: user.values,
        prompts: user.prompts || [],
        photos: fixedPhotos, // ƒo. Return the fixed photo URLs
        profileComplete: profileCompleteness, // Include profile completeness
        // ƒo. Newly added profile fields
        pronouns: user.pronouns,
        sexuality: user.sexuality,
        work: user.work,
        jobTitle: user.jobTitle,
        college: user.college,
        educationLevel: user.educationLevel,
        religion: user.religion,
        homeTown: user.homeTown,
        politics: user.politics,
        languages: user.languages,
        datingIntentions: user.datingIntentions,
        relationshipType: user.relationshipType,
        ethnicity: user.ethnicity,
        children: user.children,
        familyPlans: user.familyPlans,
        covidVaccine: user.covidVaccine,
        pets: user.pets,
        zodiacSign: user.zodiacSign,
        drinking: user.drinking,
        smoking: user.smoking,
        marijuana: user.marijuana,
        drugs: user.drugs,
      },
    });
  } catch (error) {
    console.error('ƒ?O Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the user profile.',
    });
  }
};




// export const getUserByJWT = async (req, res) => {
//   try {
//     const { phoneNumber } = req.user; // Extract phoneNumber from JWT token

//     const user = await UserProfile.findOne({ phoneNumber });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found.',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         username: user.username,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({
//       success: false,
//       message: 'An error occurred while fetching user.',
//     });
//   }
// };

export const getFilteredProfiles = async (req, res) => {
  try {
    console.log("Received request for filtered profiles");

    if (!req.user) {
      console.log("Error: req.user is undefined.");
      return res.status(401).json({ success: false, message: "Unauthorized: No user data" });
    }

    const { id, gender, interests } = req.user;

    if (!id || !gender) {
      console.log("Error: User data missing.", { id, gender, interests });
      return res.status(400).json({ success: false, message: "User data is incomplete" });
    }

  console.log("Authenticated user details:", { id, gender, interests });

  const preferredGender = gender === "Man" ? "Woman" : "Man";
  console.log("Preferred gender for query:", preferredGender);

  const requester = await UserProfile.findById(id).lean();
  const swipedUserIds = requester?.swipedUserIds?.map((val) => val?.toString()) || [];

  const query = {
    _id: { $ne: id },
    gender: preferredGender,
  };

  if (Array.isArray(interests) && interests.length > 0) {
    query.interests = { $in: interests };
  }

  const excludeQuery = { ...query, _id: { $ne: id, $nin: swipedUserIds } };

  console.log("Query being executed:", JSON.stringify(excludeQuery));

  let users = await UserProfile.find(excludeQuery).lean();
  console.log("Profiles fetched:", users.length);

  if (!users.length) {
    console.log("No profiles found after exclusion. Returning fresh deck with base filters only.");
    users = await UserProfile.find(query).lean();
    console.log("Profiles fetched after reset:", users.length);
  }

    const profiles = users.map((user) => {
      // ƒo. No need to add base URL ƒ?" S3 photo URLs are already public and complete
      const fixedPhotos = (user.photos || []).map(photo => {
        if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
        return photo; // Fallback: already valid in most cases from S3
      });

      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        height: user.height,
        interests: user.interests,
        values: user.values,
        prompts: user.prompts || [],
        photos: fixedPhotos,

        // ƒo. Extended Profile Fields
        pronouns: user.pronouns || "",
        sexuality: user.sexuality || "",
        work: user.work || "",
        jobTitle: user.jobTitle || "",
        college: user.college || "",
        educationLevel: user.educationLevel || "",
        religion: user.religion || "",
        homeTown: user.homeTown || "",
        politics: user.politics || "",
        languages: user.languages || [],
        datingIntentions: user.datingIntentions || "",
        relationshipType: user.relationshipType || "",
        ethnicity: user.ethnicity || "",
        children: user.children || "",
        familyPlans: user.familyPlans || "",
        covidVaccine: user.covidVaccine || "",
        pets: user.pets || "",
        zodiacSign: user.zodiacSign || "",
        drinking: user.drinking || "",
        smoking: user.smoking || "",
        marijuana: user.marijuana || "",
        drugs: user.drugs || "",
      };
    });

    res.status(200).json({
      success: true,
      message: "Filtered profiles fetched successfully!",
      profiles,
    });
  } catch (error) {
    console.error("Error fetching filtered profiles:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching filtered profiles.",
    });
  }
};




export const handleSwipe = async (req, res) => {
  try {
    const { id: loggedInUserId } = req.user;
    const { swipedUserId, action } = req.body;

    console.log("\n================= SWIPE API CALLED =================");
    console.log("Action:", action);
    console.log("Logged-in User (liker):", loggedInUserId);
    console.log("Target User (swipedUserId):", swipedUserId);

    if (!swipedUserId || !["like", "dislike"].includes(action)) {
      console.log("❌ Invalid swipe request");
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const loggedInUser = await UserProfile.findById(loggedInUserId);
    const swipedUser = await UserProfile.findById(swipedUserId);

    if (!loggedInUser || !swipedUser) {
      console.log("❌ One of the users not found in DB");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Ensure arrays exist
    loggedInUser.swipedRight ||= [];
    loggedInUser.swipedLeft ||= [];
    loggedInUser.matches ||= [];
    swipedUser.swipedRight ||= [];
    swipedUser.matches ||= [];

    console.log("BEFORE UPDATE:");
    console.log("loggedInUser.swipedRight =", loggedInUser.swipedRight);
    console.log("swipedUser.swipedRight =", swipedUser.swipedRight);

    if (action === "like") {
      console.log("➡ Processing LIKE action");

      // Upsert Like
      await Like.findOneAndUpdate(
        { likerId: loggedInUserId, likedUserId: swipedUserId },
        {
          $setOnInsert: {
            likerId: loggedInUserId,
            likedUserId: swipedUserId,
            status: "pending",
          },
        },
        { upsert: true, new: true }
      );

      // Update swipedRight for liker
      if (!loggedInUser.swipedRight.some(id => id.toString() === swipedUserId.toString())) {
        loggedInUser.swipedRight.push(swipedUserId);
      }

      console.log("AFTER updating liker swipedRight:", loggedInUser.swipedRight);

      // Check mutual like
      const userBLikedA = swipedUser.swipedRight.some(
        (id) => id.toString() === loggedInUserId.toString()
      );

      console.log("🔍 MUTUAL LIKE CHECK:");
      console.log("Does swipedUser.swipedRight contain loggedInUserId? =", userBLikedA);

      if (userBLikedA) {
        console.log("🎉 MATCH DETECTED!");

        // Add to matches
        if (!loggedInUser.matches.includes(swipedUserId)) loggedInUser.matches.push(swipedUserId);
        if (!swipedUser.matches.includes(loggedInUserId)) swipedUser.matches.push(loggedInUserId);

        // Create / reuse chat
        const pairKey = [loggedInUserId.toString(), swipedUserId.toString()]
          .sort()
          .join("|");

        console.log("Chat pairKey:", pairKey);

        let chat = await Chat.findOne({ pairKey });

        if (!chat) {
          console.log("Creating NEW chat for match");
          chat = new Chat({
            senderId: loggedInUserId,
            receiverId: swipedUserId,
            status: "accepted",
            messages: [],
            pairKey,
          });
        } else {
          console.log("Reusing EXISTING chat");
          chat.status = "accepted";
        }

        // Twilio channel creation
        if (!chat.twilioChannelSid) {
          try {
            const service = client.chat.v2.services(process.env.TWILIO_CHAT_SERVICE_SID);
            const friendlyName = `${loggedInUserId}-${swipedUserId}`;
            const uniqueName = `chat-${pairKey}`;

            console.log("Creating Twilio channel:", uniqueName);

            const created = await service.channels.create({ friendlyName, uniqueName });

            if (created?.sid) {
              chat.twilioChannelSid = created.sid;
              chat.twilioChatChannelSid = chat.twilioChatChannelSid || created.sid;
            }
          } catch (err) {
            console.log("⚠ Twilio Error:", err?.message);
          }
        }

        // Update Like status
        console.log("Updating Like documents to status: matched");

        await Like.updateMany(
          {
            $or: [
              { likerId: loggedInUserId, likedUserId: swipedUserId },
              { likerId: swipedUserId, likedUserId: loggedInUserId },
            ],
          },
          { $set: { status: "matched" } }
        );

        await chat.save();
        await loggedInUser.save();
        await swipedUser.save();

        console.log("🎯 MATCH RESPONSE SENT");

        return res.status(200).json({
          success: true,
          message: "Swipe recorded successfully",
          isMatch: true,
          chatId: chat._id,
          twilioChannelSid: chat.twilioChannelSid || chat.twilioChatChannelSid || null,
          otherUser: {
            _id: swipedUser._id,
            name: swipedUser.name,
            photos: swipedUser.photos || [],
          },
        });
      }
    }

    // Dislike flow
    if (action === "dislike") {
      console.log("➡ Processing DISLIKE action");

      if (!loggedInUser.swipedLeft.includes(swipedUserId)) {
        loggedInUser.swipedLeft.push(swipedUserId);
      }
    }

    // Save tracking
    console.log("Saving non-match swipe...");
    await UserProfile.findByIdAndUpdate(loggedInUserId, {
      $addToSet: { swipedUserIds: swipedUserId },
    });

    await loggedInUser.save();
    await swipedUser.save();

    console.log("Swipe saved with NO MATCH");
    console.log("====================================================");

    return res.status(200).json({
      success: true,
      message: "Swipe recorded successfully",
      isMatch: false,
    });

  } catch (error) {
    console.error("❌ ERROR IN handleSwipe:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while handling swipe.",
    });
  }
};




export const uploadPhotos = async (req, res) => {
  try {
    console.log("dY\"\" Full req.body:", req.body);
    console.log("dY\"ú Uploaded files:", req.files);

    const phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    const replaceIndex = req.body.replaceIndex;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required to upload photos.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded.",
      });
    }

    // ƒo. Extract S3 URLs from files
    const fileUrls = req.files.map(file => file.location); // <-- key change

    let user = await UserProfile.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (replaceIndex !== undefined) {
      user.photos[replaceIndex] = fileUrls[0];
    } else {
      user.photos.push(...fileUrls);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Photos uploaded successfully!",
      data: user,
    });
  } catch (error) {
    console.error("ƒ?O Error uploading photos:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while uploading photos.",
    });
  }
};




// export const updateUserProfile = async (req, res) => {
//   try {
//       console.log("dY\" Incoming Update Request:", req.body);
//       console.log("dY\", Uploaded Files:", req.files);

//       let { phoneNumber, name, username, dob, gender, height, interests, values } = req.body;

//       if (!phoneNumber || phoneNumber === "null") {
//           console.error("ƒ?O Missing phone number in request!");
//           return res.status(400).json({ success: false, message: "Phone number is required and cannot be null." });
//       }

//       console.log(`dY\"? Searching for user profile with phone number: ${phoneNumber}`);

//       // ƒo. Get uploaded photo URLs
//       const photoUrls = req.files?.map(file => file.path) || [];

//       // ƒo. Check if profile exists
//       const existingProfile = await UserProfile.findOne({ phoneNumber });

//       if (!existingProfile) {
//           console.error("ƒ?O User profile not found for phone number:", phoneNumber);
//           return res.status(404).json({ success: false, message: "User profile not found." });
//       }

//       // ƒo. Construct updated fields
//       const updatedFields = {
//           name: name || existingProfile.name,
//           username: username || existingProfile.username,
//           dateOfBirth: dob || existingProfile.dateOfBirth,
//           gender: gender || existingProfile.gender,
//           height: height || existingProfile.height,
//           interests: interests ? JSON.parse(interests) : existingProfile.interests,
//           values: values ? JSON.parse(values) : existingProfile.values,
//       };

//       // ƒo. Append photos if uploaded
//       if (photoUrls.length > 0) {
//           updatedFields.photos = photoUrls;
//       }

//       // ƒo. Update user profile
//       const updatedProfile = await UserProfile.findOneAndUpdate(
//           { phoneNumber },
//           { $set: updatedFields },
//           { new: true }
//       );

//       console.log("ƒo. Updated Profile:", updatedProfile);
//       res.json({ success: true, message: "Profile updated successfully!", data: updatedProfile });

//   } catch (error) {
//       console.error("ƒ?O Profile Update Error:", error);
//       res.status(500).json({ success: false, message: "Failed to update profile." });
//   }
// };



export const updateUserProfile = async (req, res) => {
  try {
    const { phoneNumber, updates } = req.body;

    if (!phoneNumber || !updates) {
      return res.status(400).json({
        success: false,
        message: "Phone number and update data are required.",
      });
    }

    const user = await UserProfile.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ƒo. Apply updates only for provided fields
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        user[key] = value;
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: user,
    });
  } catch (error) {
    console.error("ƒ?O Error updating profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile.",
    });
  }
};

// Calculate Profile Completeness
export const calculateProfileCompleteness = (user) => {
  let totalFields = 0;
  let filledFields = 0;

  // List the required fields to be checked for completion
  const requiredFields = [
    'name',
    'dateOfBirth',
    'gender',
    'height',
    'interests',
    'values',
    'photos',
    'location',
    'pronouns',
    'sexuality',
    'work',
    'jobTitle',
    'college',
    'educationLevel',
    'religion',
    'homeTown',
    'politics',
    'languages',
    'datingIntentions',
    'relationshipType',
    'ethnicity',
    'children',
    'familyPlans',
    'covidVaccine',
    'pets',
    'zodiacSign',
    'drinking',
    'smoking',
    'marijuana',
    'drugs'
  ];

  requiredFields.forEach((field) => {
    totalFields++;

    // Check if the field is populated
    if (field === 'photos' && user[field]?.length > 0) {
      filledFields++; // Photos array should have at least one photo
    } else if (user[field] && (Array.isArray(user[field]) ? user[field].length > 0 : user[field] !== "")) {
      filledFields++;
    }
  });

  return (filledFields / totalFields) * 100; // Return percentage
};
