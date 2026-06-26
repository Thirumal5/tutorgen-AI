import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "dean", "hod", "mentor", "student"],
    required: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  college: { type: String },
  dept: {
    type: String,
    enum: ["cse", "aids", "csbs", "aiml", "eee", "ece"],
  },
  year: {
    type: String,
    enum: ["1st", "2nd", "3rd", "4th"],
  },
  score: { type: Number, default: 0 },
  performance: { type: String, default: 'Pending Validation' },
  roadmap: { type: mongoose.Schema.Types.Mixed, default: 'Core Fundamentals' },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  feedback: { type: String, default: 'Welcome! Complete your first assessment to receive personalized feedback.' },
  cpProfiles: {
    leetcode: { type: String, default: '' },
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);