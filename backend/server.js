import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

// Import routes
import authRoutes from "./routes/authRoutes.js"
import componentRoutes from "./routes/componentRoutes.js"
// import paymentRoutes from "./routes/paymentRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import fileRoutes from "./routes/fileRoutes.js"
import adminRoutes from "./routes/admin.js"
import reportRoutes from "./routes/reportRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"

// Import socket handler
import { initializeSocket } from "./socket/chatSocket.js"

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js"
import { notFound } from "./middleware/notFound.js"
import safeMongoSanitize from "./middleware/security.js";
import {
  securityHeaders,
  xssProtection,
  validateInput,
  securityLogger,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  paymentRateLimit,
} from "./middleware/security.js"

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 8000

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
})

// Initialize socket handlers
initializeSocket(io)

// Security headers
app.use(securityHeaders)

// Security logging
app.use(securityLogger)

//CORS configuration
app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use((req, res, next) => {
  try {
    const desc = Object.getOwnPropertyDescriptor(req, "query");
    if (desc && typeof desc.get === "function" && !desc.set) {
      Object.defineProperty(req, "query", {
        value: { ...(req.query || {}) },
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  } catch (err) {
    // Do not stop the request on patch failure; optionally log:
    console.warn("query patch failed", err);
  }
  next();
});

// General rate limiting
// app.use(generalRateLimit)

// MongoDB injection prevention
app.use(safeMongoSanitize);

// XSS protection
app.use(xssProtection)

// Input validation
app.use(validateInput)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // your frontend
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // allows images to load
  },
}));

// Demo route - serves component files securely
app.get("/demo/:id", async (req, res, next) => {
  try {
    const Component = (await import("./models/Component.js")).default;
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).send("Component not found");
    }

    if (!component.published) {
      return res.status(403).send("Component not published");
    }

    if (!component.demoEnabled) {
      return res.status(403).send("Demo not available for this component");
    }

    const componentDir = path.join(__dirname, "uploads/components", req.params.id);
    
    if (!fs.existsSync(componentDir)) {
      return res.status(404).send("Component files not found");
    }

    // Find the index.html file by originalName
    const indexFile = component.files.find(file => file.originalName.toLowerCase() === "index.html");
    
    if (!indexFile) {
      return res.status(404).send("index.html not found in component files");
    }

    const indexPath = indexFile.filePath;
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("index.html file not found on disk");
    }

    // Read the HTML file and inject base tag
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if base tag already exists
    if (!htmlContent.includes('<base href=')) {
      // Insert base tag after <head> tag
      const baseTag = `<base href="/demo/${req.params.id}/">`;
      htmlContent = htmlContent.replace('<head>', `<head>\n    ${baseTag}`);
    }
    
    // Set content type and serve modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
});

// Serve static files for component demos (CSS, JS, images)
app.get("/demo/:id/:file", async (req, res, next) => {
  try {
    const Component = (await import("./models/Component.js")).default;
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).send("Component not found");
    }

    if (!component.published) {
      return res.status(403).send("Component not published");
    }

    if (!component.demoEnabled) {
      return res.status(403).send("Demo not available for this component");
    }

    const requestedFile = req.params.file; // Get the file parameter
    
    // Find the file by originalName in the component's files array
    const fileRecord = component.files.find(file => file.originalName === requestedFile);
    
    if (!fileRecord) {
      return res.status(404).send(`File '${requestedFile}' not found in component files`);
    }

    const filePath = fileRecord.filePath; // Use the stored file path
    
    // Security: Ensure the file is within the component directory
    const componentDir = path.join(__dirname, "uploads/components", req.params.id);
    if (!filePath.startsWith(componentDir)) {
      return res.status(403).send("Access denied");
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found on disk");
    }

    // Set appropriate MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// Handle nested paths for component demos
app.get("/demo/:id/:dir/:file", async (req, res, next) => {
  try {
    const Component = (await import("./models/Component.js")).default;
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).send("Component not found");
    }

    if (!component.published) {
      return res.status(403).send("Component not published");
    }

    if (!component.demoEnabled) {
      return res.status(403).send("Demo not available for this component");
    }

    const requestedFile = `${req.params.dir}/${req.params.file}`;
    
    // Find the file by originalName in the component's files array
    const fileRecord = component.files.find(file => file.originalName === requestedFile);
    
    if (!fileRecord) {
      return res.status(404).send(`File '${requestedFile}' not found in component files`);
    }

    const filePath = fileRecord.filePath; // Use the stored file path
    
    // Security: Ensure the file is within the component directory
    const componentDir = path.join(__dirname, "uploads/components", req.params.id);
    if (!filePath.startsWith(componentDir)) {
      return res.status(403).send("Access denied");
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found on disk");
    }

    // Set appropriate MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});


// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/component-marketplace", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes with specific rate limiting
app.use("/api/auth", authRoutes)//, authRateLimit
app.use("/api/components", componentRoutes)
app.use("/api/components", fileRoutes)//, uploadRateLimit
// app.use("/api/payments", paymentRateLimit, paymentRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api", reportRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/chat", chatRoutes)


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }
