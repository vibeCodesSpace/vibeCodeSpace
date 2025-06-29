import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'dist' folder
app.use(express.static(path.join(__dirname, "dist", "public")));

// For all GET requests, send back index.html so React Router works
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
