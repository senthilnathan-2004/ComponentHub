import fs from "fs";
import path from "path";
import Component from "../models/Component.js";
import { fileURLToPath } from "url";
import archiver from "archiver";

// Helper: get absolute path to /uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadBase = path.join(__dirname, "..", "uploads");

// @desc    Upload component files
// @route   POST /api/components/:id/files
// @access  Private (Owner/Admin)
export const uploadComponentFiles = async (req, res, next) => {
  console.log(req.files); // Debug: log uploaded files
  console.log(req.params.id); // Debug: log component ID
  console.log(req.user); // Debug: log user info
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // Check ownership
    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: { message: "Not authorized", code: "FORBIDDEN" } });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: { message: "No files uploaded", code: "NO_FILES" } });
    }

    const uploadedFiles = req.files.map((file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      let fileType = "other";

      if ([".html"].includes(ext)) fileType = "demo";
      else if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) fileType = "component";
      else if ([".css", ".scss"].includes(ext)) fileType = "styles";
      else if ([".json", ".md", ".txt"].includes(ext)) fileType = "export";

      return {
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType,
        mimeType: file.mimetype,
      };
    });

    component.files.push(...uploadedFiles);

    // Auto-enable demo if index.html exists
    const hasIndexHtml = uploadedFiles.some(file => 
      file.originalName.toLowerCase() === "index.html"
    );
    if (hasIndexHtml) {
      component.demoEnabled = true;
    }

    await component.save();

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles.map((f) => ({
        filename: f.originalName,
        url: `${req.protocol}://${req.get("host")}/uploads/components/${req.params.id}/${f.filename}`,
        size: f.fileSize,
        type: f.fileType,
        uploadedAt: new Date(),
      })),
      demoEnabled: component.demoEnabled,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload component screenshots
// @route   POST /api/components/:id/screenshots
// @access  Private (Owner/Admin)
export const uploadScreenshots = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: { message: "Not authorized", code: "FORBIDDEN" } });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: { message: "No screenshots uploaded", code: "NO_FILES" },
      });
    }

    const processed = req.files.map((file) => {
      const filePath = path.join(process.cwd(), "uploads/screenshots", file.filename);
  
      // Verify file actually exists on disk
      if (!fs.existsSync(filePath)) {
        console.error(`Screenshot file not found: ${filePath}`);
        return null;
      }
  
      return {
        original: `${req.protocol}://${req.get("host")}/uploads/screenshots/${
          file.filename
        }`,
        thumbnail: `${req.protocol}://${req.get("host")}/uploads/screenshots/${
          file.filename
        }`, // no resizing here
        filename: file.filename,
      };
    }).filter(Boolean); // Remove any null entries

    if (processed.length === 0) {
      return res.status(500).json({
        error: { message: "Failed to save screenshot files", code: "FILE_SAVE_ERROR" },
      });
    }

    component.screenshots.push(...processed.map((p) => p.original));
    await component.save();

    res
      .status(200)
      .json({ message: "Screenshots uploaded", screenshots: processed });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete component file
// @route   DELETE /api/components/:id/files/:fileId
// @access  Private (Owner/Admin)
export const deleteComponentFile = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    if (
      component.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: { message: "Not authorized", code: "FORBIDDEN" } });
    }

    const fileIndex = component.files.findIndex(
      (f) => f._id.toString() === req.params.fileId
    );
    if (fileIndex === -1) {
      return res
        .status(404)
        .json({ error: { message: "File not found", code: "FILE_NOT_FOUND" } });
    }

    const file = component.files[fileIndex];
    try {
      fs.unlinkSync(file.filePath); // remove from disk
    } catch (e) {
      console.error("File already removed:", e.message);
    }

    component.files.splice(fileIndex, 1);
    await component.save();

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get file content (preview)
// @route   GET /api/components/:id/files/:fileId/content
// @access  Public
export const getFileContent = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component || !component.published) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    const file = component.files.find(
      (f) => f._id.toString() === req.params.fileId
    );
    if (!file) {
      return res
        .status(404)
        .json({ error: { message: "File not found", code: "FILE_NOT_FOUND" } });
    }

    const previewableTypes = ["component", "styles"];
    if (!previewableTypes.includes(file.fileType)) {
      return res.status(403).json({
        error: {
          message: "Preview not available",
          code: "PREVIEW_NOT_AVAILABLE",
        },
      });
    }

    const content = fs.readFileSync(file.filePath, "utf-8");
    const preview =
      content.length > 1000 ? content.slice(0, 1000) + "..." : content;

    res.status(200).json({
      filename: file.originalName,
      fileType: file.fileType,
      content: preview,
      fullSize: content.length,
      isPreview: content.length > 1000,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate ZIP (stub)
// @route   GET /api/components/:id/download
// @access  Private
export const downloadComponentZip = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    // const Purchase = (await import("../models/Purchase.js")).default;
    // const purchase = await Purchase.findOne({
    //   component: req.params.id,
    //   buyer: req.user.id,
    //   status: "completed",
    // });

    // const isOwner = component.seller.toString() === req.user.id;
    // const isAdmin = req.user.role === "admin";

    // if (!isOwner && !isAdmin) {//!purchase
    //   return res.status(403).json({
    //     error: { message: "Purchase required", code: "PURCHASE_REQUIRED" },
    //   });
    // }

    // //Increment downloads count
    // component.downloads = (component.downloads || 0) + 1;
    // await component.save();

    res.status(200).json({
      message: "Download URLs provided",
      files: component.files.map((f) => ({
        name: f.originalName,
        url: `${req.protocol}://${req.get("host")}/uploads/components/${req.params.id}/${f.filename}`,
        size: f.fileSize,
        type: f.fileType,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate ZIP (stub)
// @route   GET /api/components/:id/download
// Prepare zip stream
export const downloadComponentZipStream = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({
        error: {
          message: "Component not found",
          code: "COMPONENT_NOT_FOUND",
        },
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${component.title.replace(/\s+/g, "-")}.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      throw err;
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files from component.files
    for (const f of component.files) {
      if (fs.existsSync(f.filePath)) {
        archive.file(f.filePath, { name: f.originalName });
      }
    }

    // archive.on("end", async () => {
    //   component.downloads = (component.downloads || 0) + 1
    //   await component.save()
    // })

    // finalize (send)
    await archive.finalize();
  } catch (err) {
    next(err);
  }
};
