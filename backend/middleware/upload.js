import multer from "multer"
import path from "path"
import fs from "fs"

// Ensure upload directories exist
const componentDir = path.join(process.cwd(), "uploads/components")
const screenshotDir = path.join(process.cwd(), "uploads/screenshots")
fs.mkdirSync(componentDir, { recursive: true })
fs.mkdirSync(screenshotDir, { recursive: true })

// Disk storage for component files
const componentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const componentId = req.params.id;
    if (!componentId) {
      return cb(new Error("Component ID is required"), null);
    }
    const componentDir = path.join(process.cwd(), "uploads/components", componentId);
    fs.mkdirSync(componentDir, { recursive: true });
    cb(null, componentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

// Disk storage for screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, screenshotDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `screenshot-${uniqueSuffix}${ext}`)
  },
})

// File filter for component files
const componentFileFilter = (req, file, cb) => {
  const allowedExtensions = [".html", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".json", ".md", ".txt"]
  const fileExtension = path.extname(file.originalname).toLowerCase()
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(", ")}`), false)
  }
}

// File filter for screenshots
const screenshotFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed for screenshots"), false)
  }
}

// Multer configs
export const uploadComponentFiles = multer({
  storage: componentStorage,
  fileFilter: componentFileFilter,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 20,
  },
}).array("files", 20)

export const uploadScreenshots = multer({
  storage: screenshotStorage,
  fileFilter: screenshotFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 5,
  },
}).array("screenshots", 5)

export const uploadSingleFile = multer({
  storage: componentStorage,
  fileFilter: componentFileFilter,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
}).single("file")

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: { message: "File too large. Max 5MB.", code: "FILE_TOO_LARGE" } })
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: { message: "Too many files.", code: "TOO_MANY_FILES" } })
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: { message: "Unexpected field name.", code: "UNEXPECTED_FIELD" } })
    }
  }

  if (error.message.includes("File type not allowed")) {
    return res.status(400).json({ error: { message: error.message, code: "INVALID_FILE_TYPE" } })
  }

  next(error)
}
