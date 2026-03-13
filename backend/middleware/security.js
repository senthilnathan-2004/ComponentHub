import rateLimit from "express-rate-limit"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import xss from "xss"

// Enhanced rate limiting for different endpoints
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        message,
        code: "RATE_LIMIT_EXCEEDED",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Specific rate limiters
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts, please try again later.",
)

export const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  "Too many file uploads, please try again later.",
)

export const paymentRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // 20 payment attempts
  "Too many payment attempts, please try again later.",
)

export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests
  "Too many requests from this IP, please try again later.",
)

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})

// MongoDB injection prevention
export const mongoSanitization = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt detected: ${key}`)
  },
})

// XSS protection middleware
export const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key])
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = xss(req.query[key])
      }
    }
  }

  next()
}

// Input validation middleware
export const validateInput = (req, res, next) => {
  // Check for common malicious patterns
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ]

  const checkValue = (value) => {
    if (typeof value === "string") {
      return maliciousPatterns.some((pattern) => pattern.test(value))
    }
    return false
  }

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkValue(obj[key]) || (typeof obj[key] === "object" && checkObject(obj[key]))) {
        return true
      }
    }
    return false
  }

  if (checkObject(req.body) || checkObject(req.query)) {
    return res.status(400).json({
      error: {
        message: "Invalid input detected",
        code: "INVALID_INPUT",
      },
    })
  }

  next()
}

// File upload security
export const validateFileUpload = (req, res, next) => {
  if (!req.files && !req.file) {
    return next()
  }

  const files = req.files || [req.file]
  const dangerousExtensions = [".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js"]

  for (const file of files) {
    // Check file extension
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."))
    if (dangerousExtensions.includes(ext)) {
      return res.status(400).json({
        error: {
          message: "File type not allowed for security reasons",
          code: "DANGEROUS_FILE_TYPE",
        },
      })
    }

    // Check file size
    if (file.size > (process.env.MAX_FILE_SIZE || 5 * 1024 * 1024)) {
      return res.status(400).json({
        error: {
          message: "File size exceeds maximum allowed size",
          code: "FILE_TOO_LARGE",
        },
      })
    }
  }

  next()
}

// API key validation (for future use)
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]

  if (req.path.startsWith("/api/public") && !apiKey) {
    return res.status(401).json({
      error: {
        message: "API key required for public endpoints",
        code: "API_KEY_REQUIRED",
      },
    })
  }

  next()
}

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const startTime = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - startTime
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id || "anonymous",
    }

    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn("Suspicious activity:", logData)
    }
  })

  next()
}
// safeMongoSanitize
function sanitizeObjectInPlace(obj) {
  if (!obj || typeof obj !== "object") return;
  // Only iterate own enumerable keys
  for (const key of Object.keys(obj)) {
    // remove dangerous keys
    if (key.startsWith("$") || key.includes(".")) {
      try { delete obj[key]; } catch (e) { /* non-configurable skip */ }
      continue;
    }
    const val = obj[key];
    // Recurse for nested plain objects & arrays
    if (val && typeof val === "object") {
      sanitizeObjectInPlace(val);
    }
  }
}

export default function safeMongoSanitize(req, res, next) {
  try {
    // sanitize body & params (mutate in-place)
    if (req.body && typeof req.body === "object") sanitizeObjectInPlace(req.body);
    if (req.params && typeof req.params === "object") sanitizeObjectInPlace(req.params);

    // For query: mutate its keys if it's an object (no reassignment)
    const q = req.query;
    if (q && typeof q === "object") {
      const keys = Object.keys(q);
      for (const k of keys) {
        if (k.startsWith("$") || k.includes(".")) {
          try { delete q[k]; } catch (e) { /* skip non-deletable keys */ }
        } else {
          const v = q[k];
          if (v && typeof v === "object") sanitizeObjectInPlace(v);
        }
      }
    }
  } catch (err) {
    // Never crash on sanitizer errors
    console.warn("safeMongoSanitize error", err);
  }
  next();
}
