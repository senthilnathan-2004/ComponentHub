import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { MessageSquare, X, Send, ChevronDown, ChevronUp, Minimize2, Maximize2, ExternalLink } from "lucide-react";

const ChatWidget = ({ componentId, componentTitle, sellerId, isOpen: initialOpen = false }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    currentChat,
    messages,
    isConnected,
    isLoading,
    typingUsers,
    sendMessage,
    handleTyping,
    getOrCreateChat,
    joinChat,
    leaveChat,
    unreadCount,
    setCurrentChat,
    setMessages,
  } = useChat();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const buyerIdFromUrl = searchParams.get("chat");

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState("code_change");
  const [requestDetails, setRequestDetails] = useState("");

  // Auto-open chat if seller is viewing specific buyer chat
  useEffect(() => {
    if (buyerIdFromUrl && user && sellerId && String(user._id) === String(sellerId)) {
      setIsOpen(true);
    }
  }, [buyerIdFromUrl, user, sellerId]);

  // Initialize chat when component loads
  useEffect(() => {
    if (!isAuthenticated || !componentId || !user) {
      console.log("ChatWidget: Missing required data", { isAuthenticated, componentId, userId: user?._id });
      return;
    }

    const initChat = async () => {
      console.log("ChatWidget: Initializing chat for component", componentId);
      
      // If seller and buyerId is in URL, get specific chat for that buyer
      if (sellerId && String(user._id) === String(sellerId) && buyerIdFromUrl) {
        // Seller viewing specific buyer's chat
        try {
          const response = await fetch(`http://localhost:8000/api/chat/component/${componentId}?buyerId=${buyerIdFromUrl}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const chat = data.data;
            console.log("ChatWidget: Got specific chat for seller", chat);
            if (chat && chat.buyer && chat.seller) {
              setCurrentChat(chat);
              setMessages(chat.messages || []);
              // Small delay to ensure socket is ready
              setTimeout(() => {
                joinChat(componentId, chat.buyer._id, chat.seller._id);
              }, 100);
            }
          } else {
            console.error("ChatWidget: Failed to get seller chat", response.status);
          }
        } catch (error) {
          console.error("ChatWidget: Error getting seller chat", error);
        }
      } else {
        // Regular chat initialization for buyer
        const chat = await getOrCreateChat(componentId);
        console.log("ChatWidget: Got chat data", chat);
        if (chat && chat.buyer && chat.seller) {
          // Small delay to ensure socket is ready
          setTimeout(() => {
            joinChat(componentId, chat.buyer._id, chat.seller._id);
          }, 100);
        } else {
          console.warn("ChatWidget: Chat data incomplete", { chat, hasBuyer: !!chat?.buyer, hasSeller: !!chat?.seller });
        }
      }
    };

    initChat();

    return () => {
      leaveChat();
    };
  }, [isAuthenticated, componentId, user, sellerId, buyerIdFromUrl, getOrCreateChat, joinChat, leaveChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return;

    sendMessage(messageInput.trim());
    setMessageInput("");
    
    // Reset typing indicator
    if (handleTyping) {
      handleTyping();
    }
  }, [messageInput, sendMessage, handleTyping]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    handleTyping();
  };

  const handleSendRequest = () => {
    if (!requestDetails.trim()) return;

    const requestMessages = {
      code_change: "Code Change Request",
      theme_change: "Theme Change Request",
      feature_add: "Feature Addition Request",
      bug_fix: "Bug Fix Request",
      other: "Request",
    };

    sendMessage(
      `${requestMessages[requestType]}: ${requestDetails.trim()}`,
      "component_request",
      { requestType, details: requestDetails.trim() }
    );

    setRequestDetails("");
    setShowRequestForm(false);
  };

  const getOtherUser = () => {
    if (!currentChat || !user) {
      console.log("getOtherUser: currentChat or user is null", { currentChat, user });
      return null;
    }
    if (!currentChat.buyer || !currentChat.seller) {
      console.log("getOtherUser: buyer or seller is null", { buyer: currentChat.buyer, seller: currentChat.seller });
      return null;
    }
    const isBuyer = String(currentChat.buyer._id) === String(user._id);
    return isBuyer ? currentChat.seller : currentChat.buyer;
  };

  const getUserRole = () => {
    if (!currentChat || !user) return "";
    if (!currentChat.buyer || !currentChat.seller) return "";
    return String(currentChat.buyer._id) === String(user._id) ? "Buyer" : "Seller";
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const otherUser = getOtherUser();
  const userRole = getUserRole();
  const isTyping = otherUser && typingUsers.has(String(otherUser._id));
  const isSeller = String(user?._id) === String(sellerId);

  if (!isAuthenticated) return null;

  // If seller is viewing component without specific buyer, show message
  if (isSeller && !currentChat && !buyerIdFromUrl) {
    return (
      <div className="chat-widget-container">
        <div className="chat-window">
          <div className="chat-header">
            <h4 className="chat-title">Component Chat</h4>
            <button
              className="chat-header-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="chat-messages" style={{ padding: "20px", textAlign: "center" }}>
            <MessageSquare size={48} style={{ color: "var(--color-border-default)", marginBottom: "16px" }} />
            <p style={{ marginBottom: "8px" }}>No chat selected</p>
            <p style={{ fontSize: "13px", color: "var(--color-fg-muted)", marginBottom: "16px" }}>
              Go to <Link to="/seller-chats" style={{ color: "var(--color-accent-fg)" }}>Messages</Link> to view and reply to buyer conversations.
            </p>
            <Link
              to={`/chat/${componentId}`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              <ExternalLink size={14} style={{ marginRight: "4px" }} />
              Open Chat Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-widget-container">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          className="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Open Chat"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? "minimized" : ""}`}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <h4 className="chat-title">
                {componentTitle ? `Chat: ${componentTitle}` : "Component Chat"}
              </h4>
              {otherUser && (
                <span className="chat-subtitle">
                  {otherUser.name} ({userRole === "Buyer" ? "Seller" : "Buyer"})
                  {!isConnected && <span className="chat-offline"> • Offline</span>}
                </span>
              )}
            </div>
            <div className="chat-header-actions">
              
              <button
                className="chat-header-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                className="chat-header-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="chat-messages">
                {isLoading ? (
                  <div className="chat-loading">
                    <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
                    <p>Loading chat...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <MessageSquare size={48} className="chat-empty-icon" />
                    <p>Start a conversation!</p>
                    <p className="chat-empty-subtitle">
                      Discuss component changes, customizations, or any questions.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = String(msg.sender._id) === String(user._id);
                    const showAvatar =
                      index === 0 || String(messages[index - 1].sender._id) !== String(msg.sender._id);

                    return (
                      <div
                        key={msg._id || index}
                        className={`chat-message ${isMine ? "mine" : "theirs"} ${
                          msg.type === "component_request" ? "request" : ""
                        }`}
                      >
                        {!isMine && showAvatar && (
                          <div className="chat-avatar">
                            {msg.sender.avatar ? (
                              <img src={msg.sender.avatar} alt={msg.sender.name} />
                            ) : (
                              <span>{msg.sender.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )}
                        <div className="chat-message-content">
                          {!isMine && showAvatar && (
                            <span className="chat-message-sender">{msg.sender.name}</span>
                          )}
                          <div className="chat-message-bubble">
                            {msg.type === "component_request" && (
                              <span className="chat-request-badge">
                                {msg.metadata?.requestType
                                  ?.replace("_", " ")
                                  .toUpperCase() || "REQUEST"}
                              </span>
                            )}
                            <p>{msg.content}</p>
                          </div>
                          <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>
                            {formatMessageTime(msg.createdAt)}
                            {isMine && (
                              <span style={{ color: "var(--color-success-fg)", marginLeft: "4px" }}>
                                {msg.read ? "✓✓" : "✓"}
                              </span>
                            )}
                            {!isMine && (
                              <span style={{ 
                                color: msg.read ? "var(--color-success-fg)" : "var(--color-fg-muted)", 
                                marginLeft: "4px",
                                fontSize: "10px"
                              }}>
                                {msg.read ? "Read" : "Delivered"}
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}

                {isTyping && (
                  <div className="chat-typing-indicator">
                    <div className="chat-typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{otherUser?.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Request Form */}
              {showRequestForm && (
                <div className="chat-request-form">
                  <div className="chat-request-header">
                    <h5>Send Component Request</h5>
                    <button
                      className="chat-request-close"
                      onClick={() => setShowRequestForm(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <select
                    className="form-control chat-request-select"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <option value="code_change">Code Change</option>
                    <option value="theme_change">Theme Change</option>
                    <option value="feature_add">Feature Addition</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="other">Other Request</option>
                  </select>
                  <textarea
                    className="form-control chat-request-textarea"
                    placeholder="Describe your request in detail..."
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="btn btn-primary btn-sm chat-request-send"
                    onClick={handleSendRequest}
                    disabled={!requestDetails.trim()}
                  >
                    Send Request
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <div className="chat-input-area">
                <button
                  className="chat-request-toggle"
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  title="Send component request"
                >
                  {showRequestForm ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control chat-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected || isLoading}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
