import mongoose from "mongoose";

const componentFileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
  },
  changes: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const componentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
      min: [0, "Price cannot be negative"],
    },
    demoEnabled: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: [
        "UI Components",
        "Layout Components",
        "Form Components",
        "Navigation",
        "Data Display",
        "Feedback",
        "Utilities",
        "Templates",
        "Other",
      ],
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    screenshots: [
      {
        type: String,
      },
    ],
    previewSnippet: {
      type: String,
      maxlength: [2000, "Preview snippet cannot be more than 2000 characters"],
    },
    files: [componentFileSchema],
    versions: [versionSchema],
    license: {
      type: String,
      enum: ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "Custom"],
      default: "MIT",
    },
    downloads: {
      type: Number,
      default: 0,
    },
    stars: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    rejectionReason: String,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for search
componentSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

// Virtual for seller info
componentSchema.virtual("sellerInfo", {
  ref: "User",
  localField: "seller",
  foreignField: "_id",
  justOne: true,
  select: "name avatar",
});

// Virtual for reviews
componentSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "component",
});

// Update rating when reviews change
componentSchema.methods.updateRating = async function () {
  const Review = mongoose.model("Review");
  const stats = await Review.aggregate([
    {
      $match: { component: this._id, isApproved: true },
    },
    {
      $group: {
        _id: "$component",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.rating = Math.round(stats[0].averageRating * 10) / 10;
    this.reviewCount = stats[0].reviewCount;
  } else {
    this.rating = 0;
    this.reviewCount = 0;
  }

  await this.save();
};

export default mongoose.model("Component", componentSchema);
