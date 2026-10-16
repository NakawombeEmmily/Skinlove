import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { publish } from "../realtime.js";

const router = Router();

async function summaryFor(productId) {
  const result = await query(
    `SELECT COALESCE(AVG(rating), 0)::float AS average, COUNT(*)::int AS count
       FROM reviews WHERE product_id = $1`,
    [productId]
  );
  const row = result.rows[0] || { average: 0, count: 0 };
  return { average: Math.round(row.average * 10) / 10, count: row.count };
}

// GET /api/reviews/product/:productId — public list of reviews + rating summary
router.get("/product/:productId", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at, u.name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
        WHERE r.product_id = $1
        ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    res.json({ summary: await summaryFor(req.params.productId), reviews: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/product/:productId — create or update the current user's review
router.post("/product/:productId", requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be a whole number from 1 to 5" });
    }
    const comment = body.comment != null ? String(body.comment).trim().slice(0, 1000) : null;

    const product = await query("SELECT id, name FROM products WHERE id = $1 AND is_active = true", [
      req.params.productId,
    ]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING id, product_id, user_id, rating, comment, created_at, updated_at`,
      [req.params.productId, req.user.id, rating, comment]
    );

    publish("review", {
      title: "Product review",
      detail: `${req.user.name} rated ${product.rows[0].name} ${rating}/5`,
      user_id: req.user.id,
      product_id: Number(req.params.productId),
    });

    res.status(201).json({ review: result.rows[0], summary: await summaryFor(req.params.productId) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reviews/:id — owner or admin deletes a review
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const found = await query("SELECT id, user_id, product_id FROM reviews WHERE id = $1", [req.params.id]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = found.rows[0];
    if (review.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own review" });
    }

    await query("DELETE FROM reviews WHERE id = $1", [req.params.id]);
    publish("review", {
      title: "Review removed",
      detail: `${req.user.name} removed a review`,
      user_id: review.user_id,
    });
    res.json({ message: "Review removed", summary: await summaryFor(review.product_id) });
  } catch (err) {
    next(err);
  }
});

export default router;
