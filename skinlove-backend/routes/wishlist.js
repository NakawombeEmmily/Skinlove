import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

// GET /api/wishlist — current user's wishlist
router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, w.created_at AS added_at
       FROM wishlist w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist/:productId — add product
router.post("/:productId", async (req, res, next) => {
  try {
    const product = await query("SELECT id FROM products WHERE id = $1 AND is_active = true", [req.params.productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const result = await query(
      `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id`,
      [req.user.id, req.params.productId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Already in your wishlist" });
    }
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/:productId — remove product
router.delete("/:productId", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id", [
      req.user.id,
      req.params.productId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not in your wishlist" });
    }
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
});

export default router;
