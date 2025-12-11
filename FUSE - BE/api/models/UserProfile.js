import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const profileSchema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, required: true },
    height: { type: String, required: true },

    interests: { type: [String], required: true },
    values: { type: [String], required: true },

    prompts: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],

    photos: { type: [String], default: [] },

    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },

    // ===== Editable Profile Fields =====
    pronouns: { type: String, default: "" },
    sexuality: { type: String, default: "" },
    work: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    college: { type: String, default: "" },
    educationLevel: { type: String, default: "" },
    religion: { type: String, default: "" },
    homeTown: { type: String, default: "" },
    politics: { type: String, default: "" },
    languages: { type: [String], default: [] },
    datingIntentions: { type: String, default: "" },
    relationshipType: { type: String, default: "" },
    ethnicity: { type: String, default: "" },
    children: { type: String, default: "" },
    familyPlans: { type: String, default: "" },
    covidVaccine: { type: String, default: "" },
    pets: { type: String, default: "" },
    zodiacSign: { type: String, default: "" },
    drinking: { type: String, default: "" },
    smoking: { type: String, default: "" },
    marijuana: { type: String, default: "" },
    drugs: { type: String, default: "" },

    // ===== Tracking swiped profiles =====
    swipedUserIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "UserProfile",
      default: []
    },

    // ===== CRITICAL: For matching & swipe logic =====
    swipedRight: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "UserProfile",
      default: []
    },

    swipedLeft: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "UserProfile",
      default: []
    },

    matches: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "UserProfile",
      default: []
    },
  },
  { timestamps: true }
);

const UserProfile = model('UserProfile', profileSchema);

export default UserProfile;
