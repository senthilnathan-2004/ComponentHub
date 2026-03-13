import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowLeft, User, Package, Clock, ChevronRight } from "lucide-react";

const SellerChats = () => {
  console.log("SellerChats: Component rendering");
  const { user, isAuthenticated } = useAuth();
  const { chats, loadChats, unreadCount } = useChat();
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState("all");
  const navigate = useNavigate();

  // Load chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      console.log("SellerChats: Loading chats for user", user?._id);
      setLoading(true);
      await loadChats();
      
      // Also test direct API call
      if (user?._id) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch("http://localhost:8000/api/chat/my-chats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          console.log("SellerChats: Direct API response", data);
        } catch (error) {
          console.error("SellerChats: Direct API error", error);
        }
      }
      
      setLoading(false);
    };
    fetchChats();
  }, [loadChats, user?._id]);

  // Debug log chats
  useEffect(() => {
    console.log("SellerChats: Chats loaded", chats);
    console.log("SellerChats: User is", user);
    console.log("SellerChats: User role", user?.role);
    if (chats && chats.length > 0) {
      console.log("SellerChats: First chat structure", chats[0]);
      console.log("SellerChats: Seller ID comparison", {
        user: user?._id || user?.id,
        chatSeller: chats[0].seller?._id || chats[0].seller,
        isMatch: String(user?._id || user?.id) === String(chats[0].seller?._id || chats[0].seller)
      });
    }
  }, [chats, user]);

  // Refresh chats when component mounts to get latest unread counts
  useEffect(() => {
    const interval = setInterval(() => {
      loadChats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadChats]);

  // Filter chats for seller (where user is the seller)
  const sellerChats = chats.filter(
    (chat) => {
      const sellerId = chat.seller?._id || chat.seller;
      const userId = user?._id || user?.id;
      const isSeller = String(sellerId) === String(userId);
      console.log(`Chat ${chat._id}:`, {
        sellerId,
        userId,
        isSeller,
        sellerType: typeof sellerId,
        userType: typeof userId
      });
      return isSeller;
    }
  );

  // TEMPORARY: Add mock data for testing if no chats exist
  const mockChats = sellerChats.length === 0 ? [
    {
      _id: "mock1",
      buyer: { _id: "buyer1", name: "Test Buyer", email: "buyer@test.com" },
      seller: { _id: user?._id, name: user?.name },
      component: { _id: "comp1", title: "Test Component" },
      lastMessage: { content: "Is this component available?", timestamp: new Date() },
      unreadCount: { seller: 2, buyer: 0 },
      updatedAt: new Date()
    }
  ] : sellerChats;

  const displayChats = sellerChats.length === 0 ? mockChats : sellerChats;

  console.log("SellerChats: Filtered seller chats", sellerChats);
  console.log("SellerChats: Total chats vs seller chats", {
    total: chats?.length || 0,
    seller: sellerChats.length
  });

  // Group chats by component
  const chatsByComponent = displayChats.reduce((acc, chat) => {
    const componentId = chat.component?._id;
    if (!componentId) return acc;
    
    if (!acc[componentId]) {
      acc[componentId] = {
        component: chat.component,
        chats: [],
        totalUnread: 0,
      };
    }
    acc[componentId].chats.push(chat);
    // Calculate unread for seller
    const unreadForSeller = chat.unreadCount?.seller || 0;
    acc[componentId].totalUnread += unreadForSeller;
    return acc;
  }, {});

  // Get unique components for filter
  const components = Object.values(chatsByComponent).map((group) => ({
    id: group.component._id,
    title: group.component.title,
    unread: group.totalUnread,
  }));

  // Filter chats by selected component
  const filteredChats =
    selectedComponent === "all"
      ? displayChats
      : displayChats.filter(
          (chat) => String(chat.component?._id) === selectedComponent
        );

  // Sort by most recent message
  const sortedChats = [...filteredChats].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    // Older
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="alert alert-warning">
          Please <Link to="/login">sign in</Link> to view your messages.
        </div>
      </div>
    );
  }

  // Temporary test to see if component renders
  console.log("SellerChats: Rendering component, isAuthenticated:", isAuthenticated, "user:", user);

  return (
    <div className="container" style={{ paddingTop: "24px", paddingBottom: "40px" }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/seller-dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="mb-0" style={{ fontSize: "24px",marginLeft:"10px" }}>
            Messages from Buyers
          </h1>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-danger">
            {unreadCount} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : displayChats.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <MessageSquare size={64} style={{ color: "var(--color-border-default)", marginBottom: "16px" }} />
          <h3 style={{ marginBottom: "8px" }}>No Messages Yet</h3>
          <p style={{ color: "var(--color-fg-muted)", maxWidth: "400px", margin: "0 auto 24px" }}>
            When buyers contact you about your components, their messages will appear here.
          </p>
          <Link to="/my-components" className="btn btn-primary">
            View My Components
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: "24px", alignItems: "start" }}>
          {/* Left Column - Chat List */}
          <div>
            {/* Component Filter */}
            {components.length > 1 && (
              <div className="card mb-3">
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-default)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-muted)", textTransform: "uppercase" }}>
                    Filter by Component
                  </span>
                </div>
                <div style={{ padding: "8px" }}>
                  <button
                    className={`btn btn-sm ${selectedComponent === "all" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSelectedComponent("all")}
                    style={{ margin: "4px" }}
                  >
                    All Components
                    {unreadCount > 0 && (
                      <span className="badge badge-danger" style={{ marginLeft: "8px" }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {components.map((comp) => (
                    <button
                      key={comp.id}
                      className={`btn btn-sm ${selectedComponent === comp.id ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setSelectedComponent(comp.id)}
                      style={{ margin: "4px" }}
                    >
                      {comp.title.length > 20
                        ? comp.title.substring(0, 20) + "..."
                        : comp.title}
                      {comp.unread > 0 && (
                        <span className="badge badge-danger" style={{ marginLeft: "8px" }}>
                          {comp.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat List */}
            <div className="card">
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border-default)",
                  backgroundColor: "var(--color-canvas-subtle)",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-fg-muted)", textTransform: "uppercase" }}>
                  {sortedChats.length} Conversation{sortedChats.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                {sortedChats.map((chat) => {
                  const buyer = chat.buyer;
                  const component = chat.component;
                  const lastMessage = chat.lastMessage;
                  const unread = chat.unreadCount?.seller || 0;
                  const isActive = false; // Could track selected chat

                  return (
                    <Link
                      key={chat._id}
                      to={`/chat/${component?._id}/${buyer?._id}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "16px",
                        borderBottom: "1px solid var(--color-border-default)",
                        textDecoration: "none",
                        color: "inherit",
                        backgroundColor: isActive ? "var(--color-canvas-subtle)" : "transparent",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-canvas-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {/* Buyer Avatar */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          backgroundColor: buyer?.avatar
                            ? "transparent"
                            : "var(--color-accent-emphasis)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {buyer?.avatar ? (
                          <img
                            src={buyer.avatar}
                            alt={buyer.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <User size={24} color="#fff" />
                        )}
                      </div>

                      {/* Chat Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              margin: "0 0 4px 0",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {buyer?.name || "Unknown Buyer"}
                          </h4>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--color-fg-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Clock size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                            {formatTime(chat.updatedAt)}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-fg-muted)",
                            marginBottom: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Package size={12} />
                          {component?.title || "Unknown Component"}
                        </div>

                        <p
                          style={{
                            fontSize: "13px",
                            color: unread > 0 ? "var(--color-fg-default)" : "var(--color-fg-muted)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: unread > 0 ? 500 : 400,
                          }}
                        >
                          {lastMessage?.content || "No messages yet"}
                        </p>

                        {unread > 0 && (
                          <span
                            className="badge badge-danger"
                            style={{ marginTop: "8px" }}
                          >
                            {unread} new message{unread !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        size={20}
                        style={{ color: "var(--color-fg-muted)", flexShrink: 0 }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Instructions */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">How to Reply</h3>
              </div>
              <div style={{ padding: "16px" }}>
                <p style={{ marginBottom: "16px" }}>
                  Click on any conversation to open the chat and reply to the buyer.
                </p>
                <ol style={{ paddingLeft: "20px", marginBottom: "20px", color: "var(--color-fg-muted)" }}>
                  <li style={{ marginBottom: "8px" }}>
                    Select a conversation from the list on the left
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    You&apos;ll be taken to the component page with the chat open
                  </li>
                  <li>Type your reply and send it to the buyer</li>
                </ol>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--color-canvas-subtle)",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-fg-muted)" }}>
                    <strong>Tip:</strong> Buyers may ask about customizations, code changes, or theme modifications. Be responsive to increase your sales!
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card mt-3">
              <div className="card-header">
                <h3 className="mb-0">Message Statistics</h3>
              </div>
              <div style={{ padding: "16px" }}>
                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                  <div className="stat-card" style={{ padding: "12px" }}>
                    <div className="stat-value" style={{ fontSize: "20px" }}>
                      {displayChats.length}
                    </div>
                    <div className="stat-label">Total Conversations</div>
                  </div>
                  <div className="stat-card" style={{ padding: "12px" }}>
                    <div className="stat-value" style={{ fontSize: "20px", color: "var(--color-danger-fg)" }}>
                      {unreadCount}
                    </div>
                    <div className="stat-label">Unread Messages</div>
                  </div>
                  <div className="stat-card" style={{ padding: "12px" }}>
                    <div className="stat-value" style={{ fontSize: "20px" }}>
                      {components.length}
                    </div>
                    <div className="stat-label">Components with Chats</div>
                  </div>
                  <div className="stat-card" style={{ padding: "12px" }}>
                    <div className="stat-value" style={{ fontSize: "20px" }}>
                      {displayChats.filter((c) => c.status === "active").length}
                    </div>
                    <div className="stat-label">Active Chats</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerChats;
