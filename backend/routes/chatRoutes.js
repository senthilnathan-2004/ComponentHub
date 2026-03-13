import express from "express";
import Chat from "../models/Chat.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all chats for current user
router.get("/my-chats", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      $or: [{ buyer: userId }, { seller: userId }],
    })
      .populate("component", "title screenshots price")
      .populate("buyer", "name avatar email")
      .populate("seller", "name avatar email")
      .sort({ updatedAt: -1 });

    // Add user role info to each chat
    const chatsWithRole = chats.map((chat) => ({
      ...chat.toObject(),
      userRole: chat.buyer._id.toString() === userId.toString() ? "buyer" : "seller",
      unreadForUser:
        chat.buyer._id.toString() === userId.toString()
          ? chat.unreadCount.buyer
          : chat.unreadCount.seller,
    }));

    res.json({
      success: true,
      data: chatsWithRole,
    });
  } catch (error) {
    console.error("Get my chats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chats",
    });
  }
});

// Get or create chat for a component
router.get("/component/:componentId", protect, async (req, res) => {
  try {
    const { componentId } = req.params;
    const userId = req.user._id;

    // Get component to find seller
    const Component = (await import("../models/Component.js")).default;
    const component = await Component.findById(componentId).populate("seller", "_id");

    if (!component) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    const sellerId = component.seller._id.toString();
    const userIdStr = userId.toString();

    // Determine if user is buyer or seller
    let buyerId, sellerIdForChat;

    if (userIdStr === sellerId) {
      // Current user is the seller
      const requestedBuyerId = req.query.buyerId;
      
      if (!requestedBuyerId) {
        // Return all chats for this component where user is the seller
        const chats = await Chat.find({
          component: componentId,
          seller: userIdStr,
        })
          .populate("messages.sender", "name avatar")
          .populate("buyer", "name avatar email")
          .populate("seller", "name avatar email")
          .populate("component", "title screenshots price")
          .sort({ updatedAt: -1 });

        return res.json({
          success: true,
          data: chats,
          isSeller: true,
          message: "Showing all buyer conversations for this component",
        });
      }
      
      buyerId = requestedBuyerId;
      sellerIdForChat = userIdStr;
    } else {
      // Current user is the buyer
      buyerId = userIdStr;
      sellerIdForChat = sellerId;
    }

    // Get or create chat
    let chat = await Chat.findOne({
      component: componentId,
      buyer: buyerId,
      seller: sellerIdForChat,
    })
      .populate("messages.sender", "name avatar")
      .populate("buyer", "name avatar email")
      .populate("seller", "name avatar email")
      .populate("component", "title screenshots price");

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        component: componentId,
        buyer: buyerId,
        seller: sellerIdForChat,
      });

      // Populate the new chat
      await chat.populate("buyer", "name avatar email");
      await chat.populate("seller", "name avatar email");
      await chat.populate("component", "title screenshots price");
    }

    // Mark messages as read for current user
    await chat.markAsRead(userId);

    res.json({
      success: true,
      data: {
        ...chat.toObject(),
        userRole: userIdStr === buyerId ? "buyer" : "seller",
      },
    });
  } catch (error) {
    console.error("Get component chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat",
    });
  }
});

// Get specific chat by ID - must be after /unread/count and /component
router.get("/:chatId", protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate chatId is a valid MongoDB ObjectId
    if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format",
      });
    }

    const chat = await Chat.findById(chatId)
      .populate("messages.sender", "name avatar")
      .populate("buyer", "name avatar email")
      .populate("seller", "name avatar email")
      .populate("component", "title screenshots price");

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Verify user is part of this chat
    if (
      chat.buyer._id.toString() !== userId.toString() &&
      chat.seller._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this chat",
      });
    }

    // Mark messages as read
    await chat.markAsRead(userId);

    res.json({
      success: true,
      data: {
        ...chat.toObject(),
        userRole: chat.buyer._id.toString() === userId.toString() ? "buyer" : "seller",
      },
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat",
    });
  }
});

// Send message (REST API fallback for when socket is unavailable)
router.post("/:chatId/message", protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = "text", metadata = {} } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Verify user is part of this chat
    if (
      chat.buyer.toString() !== userId.toString() &&
      chat.seller.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages in this chat",
      });
    }

    // Add message
    const message = await chat.addMessage({
      sender: userId,
      content: content.trim(),
      type,
      metadata,
    });

    await chat.populate("messages.sender", "name avatar");
    const populatedMessage = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

// Close/archived chat
router.patch("/:chatId/status", protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Validate chatId is a valid MongoDB ObjectId
    if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Verify user is part of this chat
    if (
      chat.buyer.toString() !== userId.toString() &&
      chat.seller.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this chat",
      });
    }

    chat.status = status;
    await chat.save();

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Update chat status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update chat status",
    });
  }
});

// Get unread message count
router.get("/unread/count", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      $or: [{ buyer: userId }, { seller: userId }],
    });

    let totalUnread = 0;
    chats.forEach((chat) => {
      if (chat.buyer.toString() === userId.toString()) {
        totalUnread += chat.unreadCount.buyer;
      } else {
        totalUnread += chat.unreadCount.seller;
      }
    });

    res.json({
      success: true,
      data: { unreadCount: totalUnread },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
});

export default router;
