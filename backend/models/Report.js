import mongoose from "mongoose";

const { Schema } = mongoose;

const fileMetaSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
  },
  { _id: false, timestamps: true },
);

const reportSchema = new Schema(
  {
    component: { type: Schema.Types.ObjectId, ref: "Component", required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User" }, // optional if anonymous
    reporterName: { type: String },
    reporterEmail: { type: String },
    isAnonymous: { type: Boolean, default: false },
    reason: {
      type: String,
      required: true,
      enum: [
        "Copyright Infringement",
        "Inappropriate Content",
        "Malicious Code",
        "Spam or Misleading",
        "Broken/Non-functional",
        "Duplicate Content",
        "Other",
      ],
    },
    description: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending","open", "under_review", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: { type: String },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    attachments: [fileMetaSchema],
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

// Indexes for common queries
reportSchema.index({ component: 1, status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });

export default mongoose.model("Report", reportSchema);
