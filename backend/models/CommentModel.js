// backend/models/CommentModel.js
import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const CommentSchema = new Schema(
  {
    post: { type: Types.ObjectId, ref: "Community", required: true, index: true },
    author: { type: Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    isEdited: { type: Boolean, default: false },
    deletedAt: { type: Date }, // soft delete
  },
  { timestamps: true }
);

CommentSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("content")) this.isEdited = true;
  next();
});

const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
export default Comment;
