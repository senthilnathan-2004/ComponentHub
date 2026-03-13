import Component from "../models/Component.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const serveComponentDemo = async (req, res, next) => {
  try {
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

    const componentDir = path.join(__dirname, "../uploads/components", req.params.id);
    
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
};

export const serveComponentStatic = async (req, res, next) => {
  try {
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

    const requestedPath = req.params[0]; // Get the wildcard parameter
    const requestedFile = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
    
    // Find the file by originalName in the component's files array
    const fileRecord = component.files.find(file => file.originalName === requestedFile);
    
    if (!fileRecord) {
      return res.status(404).send(`File '${requestedFile}' not found in component files`);
    }

    const filePath = fileRecord.filePath; // Use the stored file path
    
    // Security: Ensure the file is within the component directory
    const componentDir = path.join(__dirname, "../uploads/components", req.params.id);
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
};
