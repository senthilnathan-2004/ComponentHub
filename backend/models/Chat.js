import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, "Message cannot be more than 2000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "component_request", "code_snippet", "system"],
      default: "text",
    },
    metadata: {
      componentId: {
        type: mongoose.Schema.ObjectId,
        ref: "Component",
      },
      codeSnippet: String,
      themeChange: String,
      requestType: {
        type: String,
        enum: ["code_change", "theme_change", "feature_add", "bug_fix", "other"],
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    component: {
      type: mongoose.Schema.ObjectId,
      ref: "Component",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ["active", "closed", "archived"],
      default: "active",
    },
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      timestamp: Date,
    },
    unreadCount: {
      buyer: {
        type: Number,
        default: 0,
      },
      seller: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
chatSchema.index({ buyer: 1, seller: 1, component: 1 }, { unique: true });
chatSchema.index({ buyer: 1, updatedAt: -1 });
chatSchema.index({ seller: 1, updatedAt: -1 });
chatSchema.index({ "messages.read": 1 });

// Virtual for component info
chatSchema.virtual("componentInfo", {
  ref: "Component",
  localField: "component",
  foreignField: "_id",
  justOne: true,
  select: "title screenshots seller",
});

// Virtual for buyer info
chatSchema.virtual("buyerInfo", {
  ref: "User",
  localField: "buyer",
  foreignField: "_id",
  justOne: true,
  select: "name avatar email",
});

// Virtual for seller info
chatSchema.virtual("sellerInfo", {
  ref: "User",
  localField: "seller",
  foreignField: "_id",
  justOne: true,
  select: "name avatar email",
});

// Method to add a message
chatSchema.methods.addMessage = async function (messageData) {
  this.messages.push(messageData);
  this.lastMessage = {
    content: messageData.content,
    sender: messageData.sender,
    timestamp: new Date(),
  };

  // Update unread count
  if (messageData.sender.toString() === this.buyer.toString()) {
    this.unreadCount.seller += 1;
  } else {
    this.unreadCount.buyer += 1;
  }

  await this.save();
  return this.messages[this.messages.length - 1];
};

// Method to mark messages as read
chatSchema.methods.markAsRead = async function (userId) {
  const userIdStr = userId.toString();
  let updated = false;

  this.messages.forEach((message) => {
    if (message.sender.toString() !== userIdStr && !message.read) {
      message.read = true;
      message.readAt = new Date();
      updated = true;
    }
  });

  if (updated) {
    // Reset unread count for the user who is reading
    if (this.buyer && userIdStr === this.buyer.toString()) {
      this.unreadCount.buyer = 0;
    } else if (this.seller && userIdStr === this.seller.toString()) {
      this.unreadCount.seller = 0;
    }
    await this.save();
  }

  return updated;
};

// Static method to get or create chat
chatSchema.statics.getOrCreateChat = async function (componentId, buyerId, sellerId) {
  let chat = await this.findOne({
    component: componentId,
    buyer: buyerId,
    seller: sellerId,
  });

  if (!chat) {
    chat = await this.create({
      component: componentId,
      buyer: buyerId,
      seller: sellerId,
    });
  }

  return chat;
};

export default mongoose.model("Chat", chatSchema);
