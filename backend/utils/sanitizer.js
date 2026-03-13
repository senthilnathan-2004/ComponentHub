import DOMPurify from "isomorphic-dompurify"

// Sanitize HTML content
export const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  })
}

// Sanitize user input for database storage
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
}

// Sanitize filename for file uploads
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .toLowerCase()
}

// Validate and sanitize email
export const sanitizeEmail = (email) => {
  if (typeof email !== "string") return ""

  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, "") // Keep only valid email characters
}

// Sanitize search query
export const sanitizeSearchQuery = (query) => {
  if (typeof query !== "string") return ""

  return query
    .trim()
    .replace(/[<>]/g, "")
    .replace(/[^\w\s-]/g, "") // Keep only alphanumeric, spaces, and hyphens
    .substring(0, 100) // Limit length
}
