import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

const SOCKET_URL = "http://localhost:8000";

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"], // Allow fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);

      // Authenticate with server
      const token = localStorage.getItem("accessToken");
      if (token) {
        newSocket.emit("authenticate", token);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("authenticated", (data) => {
      console.log("Socket authenticated:", data);
    });

    newSocket.on("auth_error", (error) => {
      console.error("Socket auth error:", error);
    });

    newSocket.on("new_message", (data) => {
      console.log("New message received:", data);
      
      // Create a unique key for this message
      const messageKey = `${data.message.sender._id}-${data.message.content}-${data.message.createdAt}`;
      
      // Check if we're already processing this exact message
      if (messageProcessingRef.current.has(messageKey)) {
        console.log("Message already being processed, skipping:", messageKey);
        return;
      }
      
      // Mark as processing
      messageProcessingRef.current.set(messageKey, true);
      
      // Clear processing flag after a short delay
      setTimeout(() => {
        messageProcessingRef.current.delete(messageKey);
      }, 2000);
      
      setMessages((prev) => {
        // Check if we've recently processed this message
        if (recentMessagesRef.current.has(messageKey)) {
          console.log("Message recently processed, skipping:", messageKey);
          return prev;
        }
        
        // Add to recent messages (cleanup old ones)
        recentMessagesRef.current.add(messageKey);
        if (recentMessagesRef.current.size > 100) {
          const firstItem = recentMessagesRef.current.values().next().value;
          recentMessagesRef.current.delete(firstItem);
        }
        
        // First, check if message already exists by ID
        const existingById = prev.some(m => m._id === data.message._id);
        if (existingById) {
          console.log("Message already exists by ID, skipping");
          return prev;
        }
        
        // Check if this is our own message being confirmed
        const tempIndex = prev.findIndex(m => 
          m._id.startsWith('temp-') && 
          m.content === data.message.content && 
          m.sender._id === data.message.sender._id
        );
        
        if (tempIndex !== -1) {
          console.log("Replacing optimistic message");
          // Replace the optimistic message with the real one
          const newMessages = [...prev];
          newMessages[tempIndex] = data.message;
          return newMessages;
        }
        
        // Final check - exact match by content and sender (more strict time window)
        const exactMatch = prev.some(m => 
          m.content === data.message.content && 
          m.sender._id === data.message.sender._id &&
          Math.abs(new Date(m.createdAt) - new Date(data.message.createdAt)) < 500 // Reduced to 500ms
        );
        
        if (exactMatch) {
          console.log("Exact message match found, skipping");
          return prev;
        }
        
        console.log("Adding new message:", messageKey);
        return [...prev, data.message];
      });

      // Play notification sound and mark as read if not from current user
      if (data.message.sender._id !== user._id) {
        playNotificationSound();
        
        console.log("New message from other user, updating unread count");
        
        // Increment unread count for the chat where the message was sent
        // Find the chat by component ID and buyer/seller IDs
        setChats((prev) => 
          prev.map(chat => {
            // Check if this message belongs to this chat by matching participants
            const messageComponentId = data.message.componentId || data.message.component?._id;
            const chatComponentId = chat.component?._id;
            
            if (messageComponentId === chatComponentId) {
              console.log("Found matching chat for unread count update");
              
              // Check if current user is buyer in this chat
              if (chat.buyer && String(chat.buyer._id) === String(user._id)) {
                console.log("Incrementing buyer unread count");
                return { 
                  ...chat, 
                  unreadCount: { 
                    ...chat.unreadCount, 
                    buyer: (chat.unreadCount?.buyer || 0) + 1 
                  } 
                };
              }
              // Check if current user is seller in this chat
              else if (chat.seller && String(chat.seller._id) === String(user._id)) {
                console.log("Incrementing seller unread count");
                return { 
                  ...chat, 
                  unreadCount: { 
                    ...chat.unreadCount, 
                    seller: (chat.unreadCount?.seller || 0) + 1 
                  } 
                };
              }
            }
            return chat;
          })
        );
        
        // Mark message as read if it's from the other user and this chat is currently open
        if (currentChat && String(currentChat._id) === String(data.chatId)) {
          setTimeout(() => {
            // Use the socket from the captured closure or get fresh reference
            const currentSocket = socket || newSocket;
            currentSocket.emit("mark_read", currentChat._id);
          }, 500);
        }
      }
    });

    newSocket.on("message_read", (data) => {
      console.log("Message read receipt:", data);
      // Update the read status of messages from the current user
      setMessages((prev) => 
        prev.map(msg => 
          msg.sender._id === user._id ? { ...msg, read: true } : msg
        )
      );
    });

    newSocket.on("chat_history", (chatData) => {
      console.log("Chat history received:", chatData);
      setCurrentChat(chatData);
      setMessages(chatData.messages || []);
      setIsLoading(false);
    });

    newSocket.on("unread_count", (count) => {
      console.log("Received unread count from server:", count);
      // Only update if we haven't just marked messages as read
      // This prevents server from overriding our local read status
      // setUnreadCount(count);
    });

    newSocket.on("user_typing", ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("connect_timeout", () => {
      console.error("Socket connection timeout");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Track recent messages to prevent duplicates
  const recentMessagesRef = useRef(new Set());
  const messageProcessingRef = useRef(new Map());

  // Load user's chats
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("ChatContext: Not authenticated, skipping chat load");
      return;
    }

    try {
      console.log("ChatContext: Loading chats for authenticated user");
      const token = localStorage.getItem("accessToken");
      console.log("ChatContext: Token exists:", !!token);
      console.log("ChatContext: Token length:", token?.length);
      const response = await fetch("http://localhost:8000/api/chat/my-chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ChatContext: Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("ChatContext: Chats loaded successfully", data.data);
        setChats(data.data || []);
      } else {
        const errorText = await response.text();
        console.error("ChatContext: Failed to load chats", response.status, response.statusText);
        console.error("ChatContext: Error response:", errorText);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  }, [isAuthenticated]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Calculate unread count based on user role
  useEffect(() => {
    if (!chats || !user) return;
    
    let totalUnread = 0;
    console.log("Calculating unread count for user:", user._id);
    
    chats.forEach(chat => {
      // Check if user is buyer or seller in this chat
      if (chat.buyer && String(chat.buyer._id) === String(user._id)) {
        const buyerUnread = chat.unreadCount?.buyer || 0;
        console.log(`Chat ${chat._id}: Buyer unread = ${buyerUnread}`);
        totalUnread += buyerUnread;
      } else if (chat.seller && String(chat.seller._id) === String(user._id)) {
        const sellerUnread = chat.unreadCount?.seller || 0;
        console.log(`Chat ${chat._id}: Seller unread = ${sellerUnread}`);
        totalUnread += sellerUnread;
      }
    });
    
    console.log("Total unread count calculated:", totalUnread);
    setUnreadCount(totalUnread);
  }, [chats, user]);

  // Join chat room
  const joinChat = useCallback(
    (componentId, buyerId, sellerId) => {
      if (!socket || !isConnected) return;

      setIsLoading(true);
      socket.emit("join_chat", { componentId, buyerId, sellerId });
    },
    [socket, isConnected]
  );

  // Leave chat room
  const leaveChat = useCallback(() => {
    if (!socket) return;

    socket.emit("leave_chat");
    setCurrentChat(null);
    setMessages([]);
  }, [socket]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    (content, type = "text", metadata = {}) => {
      if (!socket || !isConnected || !currentChat) return;

      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content,
        type,
        metadata,
        sender: { _id: user._id, name: user.name, avatar: user.avatar },
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      const messageData = {
        componentId: currentChat.component._id,
        buyerId: currentChat.buyer._id,
        sellerId: currentChat.seller._id,
        content,
        type,
        metadata,
      };

      socket.emit("send_message", messageData);
    },
    [socket, isConnected, currentChat, user]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping) => {
      if (!socket || !isConnected || !currentChat) return;

      socket.emit("typing", {
        componentId: currentChat.component._id,
        buyerId: currentChat.buyer._id,
        sellerId: currentChat.seller._id,
        isTyping,
      });
    },
    [socket, isConnected, currentChat]
  );

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    sendTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  }, [sendTyping]);

  // Mark messages as read
  const markAsRead = useCallback(
    (chatId) => {
      if (!socket) return;

      console.log("Marking chat as read:", chatId, "for user:", user._id);

      // Mark all messages from other user as read (not current user's messages)
      setMessages((prev) => {
        const updated = prev.map(msg => 
          msg.sender._id !== user._id ? { ...msg, read: true } : msg
        );
        console.log("Updated messages read status, count:", updated.length);
        return updated;
      });

      // Update the chat's unread count in the chats array
      setChats((prev) => {
        const updated = prev.map(chat => {
          if (chat._id === chatId) {
            console.log("Found chat to update:", chatId);
            console.log("Current unread count:", chat.unreadCount);
            
            // Reset unread count for the current user
            if (chat.buyer && String(chat.buyer._id) === String(user._id)) {
              console.log("Resetting buyer unread count to 0");
              return { ...chat, unreadCount: { ...chat.unreadCount, buyer: 0 } };
            } else if (chat.seller && String(chat.seller._id) === String(user._id)) {
              console.log("Resetting seller unread count to 0");
              return { ...chat, unreadCount: { ...chat.unreadCount, seller: 0 } };
            }
          }
          return chat;
        });
        console.log("Updated chats array");
        return updated;
      });

      // Also directly set unread count to 0 for immediate effect
      setUnreadCount(0);

      socket.emit("mark_read", chatId);
    },
    [socket, user]
  );

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  // Get or create chat for component
  const getOrCreateChat = useCallback(async (componentId) => {
    if (!isAuthenticated || !user) {
      console.log("ChatContext: Not authenticated or no user, skipping chat creation");
      return null;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8000/api/chat/component/${componentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentChat(data.data);
        setMessages(data.data.messages || []);
        return data.data;
      } else {
        const errorData = await response.json();
        console.error("Chat API error:", errorData);
        // Don't throw error, just return null to prevent app crash
        setCurrentChat(null);
        setMessages([]);
        return null;
      }
    } catch (error) {
      console.error("Failed to get/create chat:", error);
      // Show error in UI but don't crash the app
      setCurrentChat(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
    currentChat,
    messages,
    setMessages,
    unreadCount,
    chats,
    isLoading,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    handleTyping,
    markAsRead,
    getOrCreateChat,
    loadChats,
    setCurrentChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
