import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import {
  MessageSquare,
  X,
  Send,
  ArrowLeft,
  User,
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const ChatPage = () => {
  const { componentId, buyerId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    currentChat,
    messages,
    isConnected,
    isLoading,
    typingUsers,
    sendMessage,
    handleTyping,
    joinChat,
    leaveChat,
    setCurrentChat,
    setMessages,
    markAsRead,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState("code_change");
  const [requestDetails, setRequestDetails] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat information
  useEffect(() => {
    const loadChat = async () => {
      if (!isAuthenticated || !componentId) return;

      try {
        const token = localStorage.getItem("accessToken");
        let url = `http://localhost:8000/api/chat/component/${componentId}`;
        
        // If buyerId is provided, get specific chat for that buyer
        if (buyerId) {
          url += `?buyerId=${buyerId}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const chat = data.data;
          
          if (Array.isArray(chat)) {
            // Multiple chats returned (seller view without specific buyer)
            if (chat.length > 0) {
              setChatInfo({
                component: chat[0].component,
                chats: chat,
                multipleChats: true,
              });
            }
          } else {
            // Single chat returned
            setChatInfo({
              component: chat.component,
              chat: chat,
              multipleChats: false,
            });
            setCurrentChat(chat);
            
            // Only set messages if we haven't joined the socket room yet
            // This prevents duplicates when socket events fire
            if (!chat.buyer || !chat.seller) {
              setMessages(chat.messages || []);
            }
            
            if (chat.buyer && chat.seller) {
              joinChat(componentId, chat.buyer._id, chat.seller._id);
              
              // Mark messages as read immediately when opening chat
              markAsRead(chat._id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load chat:", error);
      }
    };

    loadChat();

    return () => {
      leaveChat();
    };
  }, [isAuthenticated, componentId, buyerId, joinChat, leaveChat, setCurrentChat, markAsRead]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentChat) return;
    sendMessage(messageInput);
    setMessageInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendRequest = () => {
    if (!requestDetails.trim() || !currentChat) return;
    sendMessage(requestDetails, "component_request", { requestType });
    setShowRequestForm(false);
    setRequestDetails("");
    setRequestType("code_change");
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getOtherUser = () => {
    if (!currentChat || !user) return null;
    return String(currentChat.buyer._id) === String(user._id)
      ? currentChat.seller
      : currentChat.buyer;
  };

  const getUserRole = () => {
    if (!currentChat || !user) return "";
    return String(currentChat.buyer._id) === String(user._id) ? "Buyer" : "Seller";
  };

  const otherUser = getOtherUser();
  const userRole = getUserRole();
  const isTyping = otherUser && typingUsers.has(String(otherUser._id));

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="alert alert-warning">
          Please <Link to="/login">sign in</Link> to view the chat.
        </div>
      </div>
    );
  }

  // Show multiple chats selection (for sellers)
  if (chatInfo?.multipleChats && chatInfo.chats.length > 0) {
    return (
      <div className="container" style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="mb-0" style={{ fontSize: "24px" }}>
            Select Conversation
          </h1>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">{chatInfo.component?.title}</h3>
            <p className="text-muted mb-0">Choose which buyer conversation to open</p>
          </div>
          <div style={{ padding: "16px" }}>
            {chatInfo.chats.map((chat) => (
              <Link
                key={chat._id}
                to={`/chat/${componentId}/${chat.buyer._id}`}
                className="d-flex align-items-center gap-3 p-3 mb-2 text-decoration-none border rounded"
                style={{
                  backgroundColor: "var(--color-canvas-default)",
                  borderColor: "var(--color-border-default)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-canvas-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-canvas-default)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent-emphasis)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={24} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <h5 className="mb-1">{chat.buyer?.name}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                {chat.unreadCount?.seller > 0 && (
                  <span className="badge bg-danger">
                    {chat.unreadCount.seller} unread
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !chatInfo) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show no chat state
  if (!currentChat && !chatInfo.multipleChats) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <MessageSquare size={64} style={{ color: "var(--color-border-default)", marginBottom: "16px" }} />
          <h3 style={{ marginBottom: "8px" }}>No Chat Found</h3>
          <p style={{ color: "var(--color-fg-muted)", maxWidth: "400px", margin: "0 auto 24px" }}>
            No conversation found for this component.
          </p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "32px", paddingBottom: "48px", paddingLeft: "24px", paddingRight: "24px" }}>
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center" style={{ padding: "20px 24px" }}>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginRight: "16px" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="mb-0" style={{ fontSize: "20px" }}>{chatInfo.component?.title}</h3>
              {otherUser && (
                <p className="text-muted mb-0" style={{ fontSize: "14px", marginTop: "4px" }}>
                  Chat with {otherUser.name} ({userRole})
                  {!isConnected && <span className="text-danger"> • Offline</span>}
                </p>
              )}
            </div>
          </div>
          <Link to={`/components/${componentId}`} className="btn btn-outline-secondary btn-sm">
            <Package size={16} style={{ marginRight: "6px" }} />
            View Component
          </Link>
        </div>
      </div>

      {/* Chat Container */}
      <div className="card" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            backgroundColor: "var(--color-canvas-subtle)",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <MessageSquare size={48} style={{ color: "var(--color-border-default)", marginBottom: "20px" }} />
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>Start a conversation!</p>
              <p className="text-muted" style={{ fontSize: "14px" }}>
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
                  className={`d-flex mb-4 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                >
                  {!isMine && showAvatar && (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent-emphasis)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        flexShrink: 0,
                      }}
                    >
                      {msg.sender.avatar ? (
                        <img
                          src={msg.sender.avatar}
                          alt={msg.sender.name}
                          style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                        />
                      ) : (
                        <User size={18} color="#fff" />
                      )}
                    </div>
                  )}
                  <div style={{ maxWidth: "70%", minWidth: "0" }}>
                    {!isMine && showAvatar && (
                      <small className="text-muted d-block mb-2" style={{ fontSize: "12px" }}>
                        {msg.sender.name} {msg.sender._id === currentChat?.seller?._id ? "(Seller)" : "(Buyer)"}
                      </small>
                    )}
                    <div
                      className={`p-3 rounded ${
                        isMine
                          ? "bg-primary text-white align-self-end"
                          : "bg-white border align-self-start"
                      }`}
                      style={{
                        wordBreak: "break-word",
                        boxShadow: isMine ? "0 2px 4px rgba(0,123,255,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
                        border: isMine ? "none" : "1px solid var(--color-border-default)",
                        backgroundColor: isMine ? "var(--color-btn-primary-bg)" : "var(--color-canvas-default)",
                        padding: "12px 16px",
                      }}
                    >
                      {msg.type === "component_request" && (
                        <span
                          className="badge mb-2"
                          style={{
                            backgroundColor: isMine ? "rgba(255,255,255,0.2)" : "var(--color-accent-emphasis)",
                            color: "white",
                            fontSize: "11px",
                          }}
                        >
                          {msg.metadata?.requestType?.replace("_", " ").toUpperCase() || "REQUEST"}
                        </span>
                      )}
                      <p className="mb-0" style={{ 
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: "1.4"
                      }}>
                        {msg.content}
                      </p>
                    </div>
                    <small className="text-muted d-block mt-1" style={{ 
                      fontSize: "11px",
                      textAlign: isMine ? "right" : "left"
                    }}>
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
            <div className="d-flex justify-content-start mb-3">
              <div className="bg-white border p-3 rounded">
                <div className="d-flex gap-1">
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-fg-muted)",
                      animation: "typing 1.4s infinite",
                    }}
                  ></span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-fg-muted)",
                      animation: "typing 1.4s infinite 0.2s",
                    }}
                  ></span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-fg-muted)",
                      animation: "typing 1.4s infinite 0.4s",
                    }}
                  ></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Request Form */}
        {showRequestForm && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border-default)", backgroundColor: "var(--color-canvas-subtle)" }}>
            <div className="mb-3">
              <h5 className="mb-3" style={{ fontSize: "16px" }}>Send Component Request</h5>
              <select
                className="form-control mb-3"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                style={{ padding: "10px 12px" }}
              >
                <option value="code_change">Code Change</option>
                <option value="theme_change">Theme Change</option>
                <option value="feature_add">Feature Addition</option>
                <option value="bug_fix">Bug Fix</option>
                <option value="other">Other Request</option>
              </select>
              <textarea
                className="form-control"
                placeholder="Describe your request in detail..."
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                rows={3}
                style={{ padding: "12px", resize: "vertical" }}
              />
              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-primary"
                  onClick={handleSendRequest}
                  disabled={!requestDetails.trim()}
                  style={{ padding: "8px 16px" }}
                >
                  Send Request
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRequestForm(false)}
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border-default)", backgroundColor: "var(--color-canvas-default)" }}>
          <div className="d-flex gap-3" style={{ alignItems: "center" }}>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowRequestForm(!showRequestForm)}
              title="Send component request"
              style={{ marginRight: "8px", padding: "8px 12px" }}
            >
              {showRequestForm ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              style={{ padding: "12px 16px", fontSize: "14px" }}
            />
            <button 
              className="btn btn-primary"
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
              style={{ marginLeft: "8px", padding: "8px 16px" }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
