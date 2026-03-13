import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Component from "../models/Component.js";

// Store connected users with their socket IDs
const connectedUsers = new Map();

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Authenticate user
    socket.on("authenticate", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await User.findById(decoded.id).select("_id name role");

        if (!user) {
          socket.emit("auth_error", "User not found");
          return;
        }

        socket.userId = user._id.toString();
        socket.user = user;
        connectedUsers.set(user._id.toString(), socket.id);

        socket.emit("authenticated", { userId: user._id, name: user.name, role: user.role });

        // Join user's personal room for notifications
        socket.join(`user_${user._id}`);

        // Send unread message count
        const unreadCount = await getUnreadCount(user._id);
        socket.emit("unread_count", unreadCount);

        console.log(`User ${user.name} (${user._id}) authenticated`);
      } catch (error) {
        console.error("Socket authentication error:", error);
        socket.emit("auth_error", "Invalid token");
      }
    });

    // Join chat room
    socket.on("join_chat", async (data) => {
      try {
        const { componentId, buyerId, sellerId } = data;

        if (!socket.userId) {
          socket.emit("error", "Not authenticated");
          return;
        }

        // Verify user is part of this chat
        if (socket.userId !== buyerId && socket.userId !== sellerId) {
          socket.emit("error", "Not authorized for this chat");
          return;
        }

        const chat = await Chat.getOrCreateChat(componentId, buyerId, sellerId);
        const roomId = `chat_${chat._id}`;

        socket.join(roomId);
        socket.currentChatId = chat._id.toString();

        // Mark messages as read
        await chat.markAsRead(socket.userId);

        // Get chat history
        const chatHistory = await Chat.findById(chat._id)
          .populate("messages.sender", "name avatar")
          .populate("buyer", "name avatar email")
          .populate("seller", "name avatar email")
          .populate("component", "title screenshots");

        socket.emit("chat_history", chatHistory);

        // Update unread count
        const unreadCount = await getUnreadCount(socket.userId);
        socket.emit("unread_count", unreadCount);

        console.log(`User ${socket.userId} joined chat ${chat._id}`);
      } catch (error) {
        console.error("Join chat error:", error);
        socket.emit("error", "Failed to join chat");
      }
    });

    // Leave chat room
    socket.on("leave_chat", () => {
      if (socket.currentChatId) {
        socket.leave(`chat_${socket.currentChatId}`);
        socket.currentChatId = null;
      }
    });

    // Send message
    socket.on("send_message", async (data) => {
      try {
        const { componentId, buyerId, sellerId, content, type = "text", metadata = {} } = data;

        if (!socket.userId) {
          socket.emit("error", "Not authenticated");
          return;
        }

        // Verify user is part of this chat
        if (socket.userId !== buyerId && socket.userId !== sellerId) {
          socket.emit("error", "Not authorized for this chat");
          return;
        }

        const chat = await Chat.getOrCreateChat(componentId, buyerId, sellerId);

        // Add message to chat
        const messageData = {
          sender: socket.userId,
          content,
          type,
          metadata,
        };

        const message = await chat.addMessage(messageData);

        // Populate sender info
        await chat.populate("messages.sender", "name avatar");
        const populatedMessage = chat.messages[chat.messages.length - 1];

        // Broadcast to chat room
        const roomId = `chat_${chat._id}`;
        io.to(roomId).emit("new_message", {
          chatId: chat._id,
          message: populatedMessage,
        });

        // Send notification to offline user
        const recipientId = socket.userId === buyerId ? sellerId : buyerId;
        const recipientSocketId = connectedUsers.get(recipientId);

        if (recipientSocketId) {
          // User is online, send notification
          io.to(recipientSocketId).emit("new_notification", {
            type: "new_message",
            chatId: chat._id,
            sender: socket.user.name,
            componentId,
            preview: content.substring(0, 100),
          });

          // Update unread count
          const unreadCount = await getUnreadCount(recipientId);
          io.to(recipientSocketId).emit("unread_count", unreadCount);
        }

        console.log(`Message sent in chat ${chat._id} by ${socket.userId}`);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    // Mark messages as read
    socket.on("mark_read", async (chatId) => {
      try {
        if (!socket.userId) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        await chat.markAsRead(socket.userId);

        const unreadCount = await getUnreadCount(socket.userId);
        socket.emit("unread_count", unreadCount);
      } catch (error) {
        console.error("Mark read error:", error);
      }
    });

    // Typing indicator
    socket.on("typing", async (data) => {
      const { componentId, buyerId, sellerId, isTyping } = data;
      const Component = (await import("../models/Component.js")).default;
      const component = await Component.findById(componentId);
      
      if (!component) return;
      
      const chat = await Chat.findOne({
        component: componentId,
        buyer: buyerId,
        seller: sellerId,
      });
      
      if (!chat) return;
      
      const roomId = `chat_${chat._id}`;
      socket.to(roomId).emit("user_typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      if (socket.currentChatId) {
        socket.leave(`chat_${socket.currentChatId}`);
      }
    });
  });
};

// Helper function to get unread message count
const getUnreadCount = async (userId) => {
  try {
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

    return totalUnread;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

export { connectedUsers };
