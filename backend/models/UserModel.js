// backend/models/UserModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    role: { type: String, enum: ["farmer", "expert", "moderator", "admin"], default: "farmer" },
    avatar: { type: String, trim: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
