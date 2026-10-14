import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { publish } from "../realtime.js";

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
    const product = await query("SELECT id, name FROM products WHERE id = $1 AND is_active = true", [req.params.productId]);
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
    publish("wishlist", {
      title: "Wishlist add",
      detail: `${req.user.name} saved ${product.rows[0].name}`,
      action: "added",
      user_id: req.user.id,
    });
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
    const product = await query("SELECT name FROM products WHERE id = $1", [req.params.productId]);
    publish("wishlist", {
      title: "Wishlist remove",
      detail: `${req.user.name} removed ${product.rows[0]?.name || "a product"} from their wishlist`,
      action: "removed",
      user_id: req.user.id,
    });
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
});

export default router;
