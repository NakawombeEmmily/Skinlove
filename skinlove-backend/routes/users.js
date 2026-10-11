import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];

// GET /api/users/me — profile
router.get("/me", async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, skin_type, is_active, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me — edit name and skin type
router.put("/me", async (req, res, next) => {
  try {
    const { name, skin_type } = req.body || {};
    const sets = [];
    const params = [];

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ error: "Name cannot be empty" });
      params.push(trimmed.slice(0, 100));
      sets.push(`name = $${params.length}`);
    }
    if (skin_type !== undefined) {
      const value = skin_type === null || skin_type === "" ? null : String(skin_type).toLowerCase();
      if (value && !SKIN_TYPES.includes(value)) {
        return res.status(400).json({ error: "Invalid skin type" });
      }
      params.push(value);
      sets.push(`skin_type = $${params.length}`);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}
       RETURNING id, name, email, role, skin_type, is_active, created_at`,
      params
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
