import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema(
  {
    component: {
      type: mongoose.Schema.ObjectId,
      ref: "Component",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Please add a comment"],
      maxlength: [500, "Comment cannot be more than 500 characters"],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    moderatedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Prevent user from submitting more than one review per component
reviewSchema.index({ component: 1, user: 1 }, { unique: true })

// Update component rating after review save
reviewSchema.post("save", async function () {
  const Component = mongoose.model("Component")
  const component = await Component.findById(this.component)
  if (component) {
    await component.updateRating()
  }
})

// Update component rating after review remove
reviewSchema.post("remove", async function () {
  const Component = mongoose.model("Component")
  const component = await Component.findById(this.component)
  if (component) {
    await component.updateRating()
  }
})

export default mongoose.model("Review", reviewSchema)
