import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Components from "./pages/Components.jsx";
import ComponentDetail from "./pages/ComponentDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import BuyerDashboard from "./pages/BuyerDashboard.jsx";
import UploadComponent from "./pages/UploadComponent.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MyComponents from "./pages/ MyComponents.jsx";
import About from "./pages/About.jsx";
import SellerProfile from "./pages/SellerProfile.jsx";
import EditComponent from "./pages/EditComponent.jsx";
import Download from "./pages/DownloadPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import ReportComponent from "./pages/ReportComponent.jsx";
import AdminApp from "./AdminApp.jsx";
import EditableDemo from "./pages/EditableDemo.jsx";
import SellerChats from "./pages/SellerChats.jsx";
import ChatPage from "./pages/ChatPage.jsx";

function App() {
  const location = useLocation();
  return (
    <AuthProvider>
      <ChatProvider>
        {localStorage.getItem("adminToken") ? (
          <div className="App">
            <Routes>
              <Route path="/" element={<AdminApp />} />
              <Route path="/components/:id" element={<ComponentDetail />} />
              <Route path="/components/:id/download" element={<Download />} />
              <Route path="/components/:id/editable-demo" element={<EditableDemo />} />
            </Routes>
          </div>
        ) : (
          <div className="App">
            {location.pathname !== "/admin" && <Header />}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/components" element={<Components />} />
              <Route path="/components/:id" element={<ComponentDetail />} />
              <Route path="/components/:id/editable-demo" element={<EditableDemo />} />
              <Route path="/my-components" element={<MyComponents />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin" element={<AdminApp />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/reviews/:id" element={<ReviewsPage />} />
              <Route
                path="/components/:id/download"
                element={
                  <ProtectedRoute>
                    <Download />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/components/edit/:id"
                element={
                  <ProtectedRoute requiredRole="seller">
                    <EditComponent />
                  </ProtectedRoute>
                }
              />

              <Route path="/seller/:id" element={<SellerProfile />} />
              <Route
                path="/report/:id"
                element={
                  <ProtectedRoute>
                    <ReportComponent />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-dashboard"
                element={
                  <ProtectedRoute requiredRole="seller">
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-chats"
                element={
                  <ProtectedRoute>
                    <SellerChats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buyer-dashboard"
                element={
                  <ProtectedRoute requiredRole="buyer">
                    <BuyerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute requiredRole="seller">
                    <UploadComponent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:componentId"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:componentId/:buyerId"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        )}
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
