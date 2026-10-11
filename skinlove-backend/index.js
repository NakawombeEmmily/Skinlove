import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import wishlistRoutes from "./routes/wishlist.js";
import storeRoutes from "./routes/stores.js";
import chatRoutes from "./routes/chat.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : true,
  })
);
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again in a few minutes" },
});
app.use("/api", limiter);

// Keep-alive ping for cron-job.org (Render free tier)
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

app.get("/", (req, res) => {
  res.json({ name: "SkinLove API", version: "1.0.0", docs: "/health" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  res.status(500).json({ error: "Something went wrong — please try again" });
});

app.listen(PORT, () => {
  console.log(`SkinLove API listening on port ${PORT}`);
});
