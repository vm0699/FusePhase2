import UserProfile from '../models/UserProfile.js';
import Like from '../models/Like.js';
import Chat from '../models/ChatModel.js';
import client from "../config/twilio.js";
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Save or Update User Profile
export const saveUserProfile = async (req, res) => {
  console.log("📥 [saveUserProfile] Incoming body:", req.body);
  console.log("🔑 [saveUserProfile] Auth user:", req.user);

  try {
    const { intro, options, profileDetails, prompts, photos } = req.body;

    const userId = req.user?.id;
    const phoneFromToken = req.user?.phoneNumber;

    if (!userId || !phoneFromToken) {
      console.log("❌ Missing user ID or phone in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing user in token",
      });
    }

    console.log("🟢 Using authenticated user:", userId, phoneFromToken);

    let existingUser = await UserProfile.findById(userId);

    if (!existingUser) {
      console.log("⚠️ User not found by ID. Trying phoneNumber lookup…");
      existingUser = await UserProfile.findOne({ phoneNumber: phoneFromToken });
    }

    if (!existingUser) {
      console.log("❌ User not found in database at all.");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log("🟢 User found:", existingUser._id.toString());

    // 📝 Save onboarding fields
    existingUser.name = intro?.name;
    existingUser.dateOfBirth = intro?.dob;
    existingUser.username = options?.username;
    existingUser.gender = options?.gender;

    existingUser.height = profileDetails?.height;
    existingUser.interests = profileDetails?.interests || [];
    existingUser.values = profileDetails?.values || [];
    existingUser.prompts = prompts || [];

    if (Array.isArray(photos) && photos.length > 0) {
      console.log("📸 Updating photos:", photos);
      existingUser.photos = photos;
    }

    // ✅ CRITICAL 2.1 CHECKPOINT — ONBOARDING COMPLETE
    existingUser.onboardingStage = "COMPLETE";

    console.log("💾 Saving updated profile with onboarding COMPLETE…");
    await existingUser.save();
    console.log("✅ User profile saved and onboarding marked COMPLETE.");

    const profileComplete = calculateProfileCompleteness(existingUser);
    console.log("📊 Profile completeness:", profileComplete);

    const fixedPhotos = (existingUser.photos || []).map((p) => p);

    const profilePayload = {
      _id: existingUser._id,
      name: existingUser.name,
      username: existingUser.username,
      phoneNumber: existingUser.phoneNumber,
      dateOfBirth: existingUser.dateOfBirth,
      gender: existingUser.gender,
      height: existingUser.height,
      interests: existingUser.interests,
      values: existingUser.values,
      prompts: existingUser.prompts,
      photos: fixedPhotos,
      profileComplete,

      pronouns: existingUser.pronouns,
      sexuality: existingUser.sexuality,
      work: existingUser.work,
      jobTitle: existingUser.jobTitle,
      college: existingUser.college,
      educationLevel: existingUser.educationLevel,
      religion: existingUser.religion,
      homeTown: existingUser.homeTown,
      politics: existingUser.politics,
      languages: existingUser.languages,
      datingIntentions: existingUser.datingIntentions,
      relationshipType: existingUser.relationshipType,
      ethnicity: existingUser.ethnicity,
      children: existingUser.children,
      familyPlans: existingUser.familyPlans,
      pets: existingUser.pets,
      zodiacSign: existingUser.zodiacSign,
      drinking: existingUser.drinking,
      smoking: existingUser.smoking,
      marijuana: existingUser.marijuana,
      drugs: existingUser.drugs,
    };

    const accessToken = jwt.sign(
      {
        id: existingUser._id.toString(),
        phoneNumber: existingUser.phoneNumber,
        username: existingUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: existingUser._id.toString(),
        phoneNumber: existingUser.phoneNumber,
        username: existingUser.username,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully.",
      data: {
        profile: profilePayload,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("🔥 ERROR in saveUserProfile:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving profile.",
    });
  }
};






// Fetch User Profile by Phone Number (JWT)
// Fetch User Profile by Phone Number (JWT)
export const getProfileByPhoneNumber = async (req, res) => {
  try {
    // 🔑 Always trust authMiddleware
    const userId = req.user.id;

    console.log("🔍 [getProfileByPhoneNumber] Fetching user for ID:", userId);

    const user = await UserProfile.findById(userId);

    if (!user) {
      console.log("❌ [getProfileByPhoneNumber] User not found");
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    console.log("✅ [getProfileByPhoneNumber] User found:", {
      id: user._id.toString(),
      onboardingStage: user.onboardingStage,
    });

    // 📊 Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(user);

    // 🖼 Normalize photo URLs
    const fixedPhotos = (user.photos || []).map(photo => {
      if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
      const normalized = photo.replace(/\\/g, "/");
      return `http://172.20.10.4:5000/${normalized}`;
    });

    console.log("📤 [getProfileByPhoneNumber] Returning profile snapshot:", {
      name: user.name,
      phoneNumber: user.phoneNumber,
      onboardingStage: user.onboardingStage,
    });

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully!',
      data: {
        // 🔥 REQUIRED FOR AUTHGATE (CORE FIX)
        onboardingStage: user.onboardingStage,

        // Core profile fields
        name: user.name,
        phoneNumber: user.phoneNumber,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        height: user.height,
        interests: user.interests,
        values: user.values,
        prompts: user.prompts || [],
        photos: fixedPhotos,
        profileComplete: profileCompleteness,

        // Extended profile fields
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
    console.error('🔥 [getProfileByPhoneNumber] Error:', error);
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
    console.log("📥 [FilteredProfiles] Incoming request");
    console.log("➡️ Method:", req.method);

    if (!req.user) {
      console.log("⛔ No req.user – unauthorized");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, gender, interests: profileInterests } = req.user;
    const filters = req.body?.filters || null;

    console.log("👤 User:", { id, gender });
    console.log("🎛️ Filters received:", filters);

    const requester = await UserProfile.findById(id).lean();
    if (!requester) {
      console.log("⛔ Requester not found in DB");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const swipedUserIds =
      requester.swipedUserIds?.map((v) => v.toString()) || [];

    console.log("🚫 Swiped users count:", swipedUserIds.length);

    /* ---------------- BASE QUERY (ALWAYS) ---------------- */

    const preferredGender = gender === "Man" ? "Woman" : "Man";

    let baseQuery = {
      _id: { $ne: id, $nin: swipedUserIds },
      gender: preferredGender,
    };

    console.log("🧱 Base query initialized:", baseQuery);

    /* ---------------- DEFAULT MODE (GET, NO FILTERS) ---------------- */

    if (!filters) {
      console.log("🟢 DEFAULT MODE (no filters)");

      if (Array.isArray(profileInterests) && profileInterests.length > 0) {
        baseQuery.interests = { $in: profileInterests };
        console.log("🎯 Applying profile interests:", profileInterests);
      }

      let users = await UserProfile.find(baseQuery).lean();
      console.log("📊 Users found (default):", users.length);

      if (!users.length) {
        console.log("🔁 Default fallback triggered (no swipe exclusion)");
        users = await UserProfile.find({
          _id: { $ne: id },
          gender: preferredGender,
        }).lean();
        console.log("📊 Users found after fallback:", users.length);
      }

      return res.status(200).json({
        success: true,
        profiles: mapProfiles(users),
      });
    }

    /* ---------------- FILTER MODE (POST) ---------------- */

    console.log("🟣 FILTER MODE (POST)");

    const {
      ageRange,
      ageFlex,
      distanceKm,
      distanceFlex,
      interests,
    } = filters;

    // 🎯 AGE FILTER
    if (ageRange?.min && ageRange?.max) {
      const today = new Date();
      const minDOB = new Date(
        today.getFullYear() - ageRange.max,
        today.getMonth(),
        today.getDate()
      );
      const maxDOB = new Date(
        today.getFullYear() - ageRange.min,
        today.getMonth(),
        today.getDate()
      );

      baseQuery.dateOfBirth = {
        $gte: minDOB.toISOString().slice(0, 10),
        $lte: maxDOB.toISOString().slice(0, 10),
      };

      console.log("🎂 Age filter applied:", ageRange);
    }

    // 🎯 INTEREST FILTER
    if (Array.isArray(interests) && interests.length > 0) {
      baseQuery.interests = { $in: interests };
      console.log("❤️ Discovery interests applied:", interests);
    }

    // 🎯 DISTANCE FILTER (placeholder logic)
    if (
      distanceKm &&
      requester.location?.latitude &&
      requester.location?.longitude
    ) {
      baseQuery["location.latitude"] = { $ne: null };
      baseQuery["location.longitude"] = { $ne: null };

      console.log(
        "📍 Distance filter placeholder applied:",
        distanceKm,
        "km"
      );
    }

    console.log("🔍 Final query before execution:", baseQuery);

    let users = await UserProfile.find(baseQuery).lean();
    console.log("📊 Users found (filtered):", users.length);

    /* ---------------- FLEX FALLBACKS ---------------- */

    if (!users.length && ageFlex && ageRange) {
      console.log("↔️ Age flex fallback triggered");

      const expandedMin = Math.max(18, ageRange.min - 2);
      const expandedMax = ageRange.max + 2;

      const today = new Date();
      baseQuery.dateOfBirth = {
        $gte: new Date(today.getFullYear() - expandedMax)
          .toISOString()
          .slice(0, 10),
        $lte: new Date(today.getFullYear() - expandedMin)
          .toISOString()
          .slice(0, 10),
      };

      users = await UserProfile.find(baseQuery).lean();
      console.log("📊 Users after age flex:", users.length);
    }

    if (!users.length && distanceFlex) {
      console.log("🌍 Distance flex fallback triggered");

      delete baseQuery["location.latitude"];
      delete baseQuery["location.longitude"];

      users = await UserProfile.find(baseQuery).lean();
      console.log("📊 Users after distance flex:", users.length);
    }

    console.log("✅ Returning profiles:", users.length);

    return res.status(200).json({
      success: true,
      profiles: mapProfiles(users),
    });
  } catch (error) {
    console.error("🔥 FilteredProfiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filtered profiles",
    });
  }
};

/* ---------------- PROFILE MAPPER (unchanged) ---------------- */

function mapProfiles(users) {
  return users.map((user) => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    height: user.height,
    interests: user.interests,
    values: user.values,
    prompts: user.prompts || [],
    photos: user.photos || [],

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
  }));
}





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
    console.log('📸 [uploadPhotos] Full req.body:', req.body);
    console.log('📸 [uploadPhotos] Uploaded files:', req.files);
    console.log('📸 [uploadPhotos] Auth user:', req.user);

    const userId = req.user?.id;
    const phoneFromToken = req.user?.phoneNumber;
    const replaceIndex = req.body.replaceIndex;

    // 🔒 Auth check (JWT is the source of truth)
    if (!userId || !phoneFromToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: missing user in token',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded.',
      });
    }

    // ✅ Extract S3 URLs
    const fileUrls = req.files.map(file => file.location);
    console.log('📸 [uploadPhotos] File URLs:', fileUrls);

    // ✅ Fetch user by ID (NOT phone number)
    const user = await UserProfile.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // 🔁 Replace OR append
    if (replaceIndex !== undefined && replaceIndex !== null) {
      console.log(`🔁 [uploadPhotos] Replacing photo at index ${replaceIndex}`);
      user.photos[replaceIndex] = fileUrls[0];
    } else {
      console.log('➕ [uploadPhotos] Appending photos');
      user.photos.push(...fileUrls);
    }

    await user.save();
    console.log('✅ [uploadPhotos] Photos saved successfully');

    return res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully!',
      data: {
        photos: user.photos,
      },
    });
  } catch (error) {
    console.error('🔥 [uploadPhotos] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while uploading photos.',
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
  console.log("🛠 [updateUserProfile] Raw body:", req.body);
  console.log("🛡 [updateUserProfile] Auth user:", req.user);

  try {
    const userId = req.user?.id;
    const phoneFromToken = req.user?.phoneNumber;

    if (!userId || !phoneFromToken) {
      console.log("❌ [updateUserProfile] Missing auth user details");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing user in token",
      });
    }

    // Load user
    const user = await UserProfile.findById(userId);
    if (!user) {
      console.log("❌ [updateUserProfile] User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log("✅ [updateUserProfile] Found user:", {
      id: user._id.toString(),
      currentOnboardingStage: user.onboardingStage,
    });

    // Support both:
    // { updates: {...} }
    // { name: "...", gender: "..." }
    const updates =
      req.body.updates && typeof req.body.updates === "object"
        ? req.body.updates
        : req.body;

    console.log("✏️ [updateUserProfile] Parsed updates:", updates);

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update.",
      });
    }

    // ✅ ALLOWED FIELDS (FIXED)
    const allowedFields = [
      // Core profile
      "name",
      "username",
      "dateOfBirth",
      "gender",
      "height",
      "interests",
      "values",
      "prompts",
      "photos",

      // 🔹 ONBOARDING CHECKPOINT (CRITICAL FIX)
      "onboardingStage",

      // Identity + lifestyle fields
      "pronouns",
      "sexuality",
      "work",
      "jobTitle",
      "college",
      "educationLevel",
      "religion",
      "homeTown",
      "politics",
      "languages",
      "datingIntentions",
      "relationshipType",
      "ethnicity",
      "children",
      "familyPlans",
      "pets",
      "zodiacSign",
      "drinking",
      "smoking",
      "marijuana",
      "drugs",
    ];

    // ✅ Allowed onboarding stages (guardrail)
    const ALLOWED_ONBOARDING_STAGES = [
      "PHONE_VERIFIED",
      "INTRO_DONE",
      "PROFILE_SETUP_DONE",
      "DETAILS_DONE",
      "PROMPTS_DONE",
      "PHOTOS_DONE",
      "COMPLETE",
    ];

    let anyFieldUpdated = false;

    for (const key of Object.keys(updates)) {
      if (!allowedFields.includes(key)) {
        console.log(`⚠️ [updateUserProfile] Ignoring disallowed field: ${key}`);
        continue;
      }

      const value = updates[key];

      // 🔐 Extra safety for onboardingStage
      if (key === "onboardingStage") {
        if (!ALLOWED_ONBOARDING_STAGES.includes(value)) {
          console.log(
            "❌ [updateUserProfile] Invalid onboardingStage rejected:",
            value
          );
          continue;
        }

        console.log(
          `🧭 [updateUserProfile] Updating onboardingStage: ${user.onboardingStage} → ${value}`
        );
      } else {
        console.log(`✏️ [updateUserProfile] Setting ${key} =`, value);
      }

      user[key] = value;
      anyFieldUpdated = true;
    }

    if (!anyFieldUpdated) {
      console.log("ℹ️ [updateUserProfile] No allowed fields found in updates.");
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update.",
      });
    }

    console.log("💾 [updateUserProfile] Saving user…");
    await user.save();
    console.log("✅ [updateUserProfile] User saved.");

    // Recalculate completeness
    const profileCompleteness = calculateProfileCompleteness(user);
    console.log("📊 [updateUserProfile] Profile completeness:", profileCompleteness);

    const fixedPhotos = (user.photos || []).map((p) => p);

    const profilePayload = {
      _id: user._id,
      name: user.name,
      username: user.username,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      interests: user.interests,
      values: user.values,
      prompts: user.prompts || [],
      photos: fixedPhotos,
      profileComplete: profileCompleteness,

      // 🔹 IMPORTANT: expose onboardingStage for debugging
      onboardingStage: user.onboardingStage,

      // Extended fields
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
      pets: user.pets,
      zodiacSign: user.zodiacSign,
      drinking: user.drinking,
      smoking: user.smoking,
      marijuana: user.marijuana,
      drugs: user.drugs,
    };

    console.log("📤 [updateUserProfile] Final profilePayload:", profilePayload);

    // Issue fresh tokens
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        username: user.username,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🔑 [updateUserProfile] New access & refresh tokens issued.");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        profile: profilePayload,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("🔥 [updateUserProfile] ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile.",
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


export const reorderPhotos = async (req, res) => {
  console.log("🎯 [reorderPhotos] Body:", req.body);
  console.log("🛡 [reorderPhotos] Auth user:", req.user);

  try {
    const userId = req.user?.id;

    if (!userId) {
      console.log("❌ [reorderPhotos] Missing auth user id");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing user in token",
      });
    }

    const { newOrder } = req.body;

    if (!Array.isArray(newOrder)) {
      console.log("❌ [reorderPhotos] newOrder is not an array");
      return res.status(400).json({
        success: false,
        message: "newOrder must be an array of photo URLs.",
      });
    }

    const user = await UserProfile.findById(userId);
    if (!user) {
      console.log("❌ [reorderPhotos] User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const currentPhotos = user.photos || [];

    // Filter out any null/empty entries that may come from the frontend
    const cleanedNewOrder = newOrder.filter((p) => typeof p === "string" && p.trim().length > 0);

    // Basic integrity check: all items in newOrder must exist in currentPhotos
    const allExist = cleanedNewOrder.every((url) => currentPhotos.includes(url));
    if (!allExist) {
      console.log("⚠️ [reorderPhotos] Some URLs in newOrder do not exist in current photos.");
      return res.status(400).json({
        success: false,
        message: "Invalid photo URLs in newOrder.",
      });
    }

    // Optional: if newOrder doesn't include all photos (e.g. fewer), append remaining at the end
    const remaining = currentPhotos.filter((url) => !cleanedNewOrder.includes(url));
    const finalOrder = [...cleanedNewOrder, ...remaining];

    console.log("🧩 [reorderPhotos] Final ordered photos:", finalOrder);
    user.photos = finalOrder;

    await user.save();
    console.log("✅ [reorderPhotos] User photos reordered & saved.");

    const profileCompleteness = calculateProfileCompleteness(user);
    const fixedPhotos = (user.photos || []).map((p) => p);

    return res.status(200).json({
      success: true,
      message: "Photos reordered successfully.",
      data: {
        photos: fixedPhotos,
        profileComplete: profileCompleteness,
      },
    });
  } catch (error) {
    console.error("🔥 [reorderPhotos] ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while reordering photos.",
    });
  }
};


export const deletePhoto = async (req, res) => {
  console.log("🗑 [deletePhoto] Body:", req.body);
  console.log("🛡 [deletePhoto] Auth user:", req.user);

  try {
    const userId = req.user?.id;

    if (!userId) {
      console.log("❌ [deletePhoto] Missing auth user id");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing user in token",
      });
    }

    const { index } = req.body;

    if (index === undefined || index === null) {
      console.log("❌ [deletePhoto] index not provided");
      return res.status(400).json({
        success: false,
        message: "index is required.",
      });
    }

    const user = await UserProfile.findById(userId);
    if (!user) {
      console.log("❌ [deletePhoto] User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const photos = user.photos || [];

    if (index < 0 || index >= photos.length) {
      console.log("❌ [deletePhoto] index out of range:", index);
      return res.status(400).json({
        success: false,
        message: "Invalid photo index.",
      });
    }

    console.log("🗑 [deletePhoto] Removing photo at index:", index, "URL:", photos[index]);
    photos.splice(index, 1); // remove one item at the index
    user.photos = photos;

    await user.save();
    console.log("✅ [deletePhoto] Photo removed & user saved.");

    const profileCompleteness = calculateProfileCompleteness(user);
    const fixedPhotos = (user.photos || []).map((p) => p);

    return res.status(200).json({
      success: true,
      message: "Photo deleted successfully.",
      data: {
        photos: fixedPhotos,
        profileComplete: profileCompleteness,
      },
    });
  } catch (error) {
    console.error("🔥 [deletePhoto] ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting photo.",
    });
  }
};
