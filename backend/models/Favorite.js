import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    component: {
      type: mongoose.Schema.ObjectId,
      ref: "Component",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure a user can only favorite a component once
favoriteSchema.index({ user: 1, component: 1 }, { unique: true });

// Create indexes for efficient queries
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ component: 1 });

export default mongoose.model("Favorite", favoriteSchema);
