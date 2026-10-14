import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { publish } from "../realtime.js";

const router = Router();

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role, skin_type: user.skin_type },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    skin_type: row.skin_type,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, skin_type } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, skin_type)
       VALUES ($1, $2, $3, 'user', $4)
       RETURNING id, name, email, role, skin_type, is_active, created_at`,
      [name.trim().slice(0, 100), email.toLowerCase(), password_hash, skin_type || null]
    );

    const user = result.rows[0];
    publish("signup", {
      title: "New sign-up",
      detail: `${user.name} (${user.email}) joined SkinLove`,
      user_id: user.id,
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: "This account has been deactivated" });
    }

    try {
      await query(
        "INSERT INTO login_events (user_id, email, ip, user_agent) VALUES ($1, $2, $3, $4)",
        [user.id, user.email, req.ip || null, (req.headers["user-agent"] || "").slice(0, 255)]
      );
    } catch (logErr) {
      console.error("[auth] login_events insert failed", logErr.message);
    }
    publish("login", {
      title: "User login",
      detail: `${user.name} (${user.email}) signed in`,
      user_id: user.id,
    });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — JWT is stateless; client drops the token
router.post("/logout", requireAuth, (req, res) => {
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, skin_type, is_active, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

export default router;
