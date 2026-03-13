// Chat Service for REST API calls
const API_BASE_URL = "http://localhost:8000/api";

const getToken = () => localStorage.getItem("accessToken");

const chatService = {
  // Get all chats for current user
  async getMyChats() {
    const response = await fetch(`${API_BASE_URL}/chat/my-chats`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chats");
    }

    return response.json();
  },

  // Get or create chat for a component
  async getOrCreateChat(componentId) {
    const response = await fetch(`${API_BASE_URL}/chat/component/${componentId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chat");
    }

    return response.json();
  },

  // Get specific chat by ID
  async getChat(chatId) {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get chat");
    }

    return response.json();
  },

  // Send message via REST API (fallback)
  async sendMessage(chatId, content, type = "text", metadata = {}) {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ content, type, metadata }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send message");
    }

    return response.json();
  },

  // Get unread message count
  async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/chat/unread/count`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get unread count");
    }

    return response.json();
  },

  // Update chat status
  async updateChatStatus(chatId, status) {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update chat status");
    }

    return response.json();
  },
};

export default chatService;
