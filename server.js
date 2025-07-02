import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`Request URL: ${req.url}`);
  let filePath;

  // Handle requests for root path to serve index.html from public
  if (req.url === "/") {
    filePath = path.join(__dirname, "public", "index.html");
  } else {
    // For other requests, assume they are for static assets in public
    filePath = path.join(__dirname, "public", req.url);
  }

  console.log(`Resolved file path: ${filePath}`);

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error(`Error reading file ${filePath}: ${error.code}`);
      if (error.code == "ENOENT") {
        res.writeHead(404);
        res.end("404 Not Found");
      } else {
        res.writeHead(500);
        res.end(
          "Sorry, check with the site admin for error: " + error.code + "..\n",
        );
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
