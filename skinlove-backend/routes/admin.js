import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { bus, publish } from "../realtime.js";

const router = Router();

router.use(requireAuth, adminOnly);

// GET /api/admin/events — Server-Sent Events stream of live activity
router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();
  res.write("retry: 5000\n\n");

  const onEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  bus.on("event", onEvent);

  const ping = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(ping);
    bus.off("event", onEvent);
    res.end();
  });
});

// GET /api/admin/logins — recent login activity
router.get("/logins", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = await query(
      `SELECT l.id, l.user_id, l.email, l.ip, l.created_at, u.name
         FROM login_events l
         LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.created_at DESC
        LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/wishlist — wishlist/favorites activity across all users
router.get("/wishlist", async (req, res, next) => {
  try {
    const [items, top] = await Promise.all([
      query(
        `SELECT w.id, w.created_at, u.id AS user_id, u.name, u.email,
                p.id AS product_id, p.name AS product, p.brand, p.price, p.image_emoji
           FROM wishlist w
           JOIN users u ON u.id = w.user_id
           JOIN products p ON p.id = w.product_id
          ORDER BY w.created_at DESC
          LIMIT 200`
      ),
      query(
        `SELECT p.id, p.name, p.brand, p.image_emoji, COUNT(*)::int AS saves
           FROM wishlist w
           JOIN products p ON p.id = w.product_id
          GROUP BY p.id
          ORDER BY saves DESC, p.name ASC
          LIMIT 10`
      ),
    ]);
    res.json({ items: items.rows, top: top.rows });
  } catch (err) {
    next(err);
  }
});

// ---- Store merchandise management ----
router.get("/stores", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM stores ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/stores", async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ error: "Store name is required" });
    const products = Array.isArray(b.available_products)
      ? b.available_products.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const result = await query(
      `INSERT INTO stores (name, latitude, longitude, hours, available_products)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [b.name, b.latitude ?? null, b.longitude ?? null, b.hours || null, products]
    );
    publish("store", { title: "Store added", detail: `${req.user.name} added store ${b.name}` });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/stores/:id", async (req, res, next) => {
  try {
    const b = req.body || {};
    const allowed = ["name", "latitude", "longitude", "hours", "available_products"];
    const sets = [];
    const params = [];
    for (const field of allowed) {
      if (b[field] !== undefined) {
        params.push(
          field === "available_products"
            ? Array.isArray(b[field])
              ? b[field].map((s) => String(s).trim()).filter(Boolean)
              : []
            : b[field]
        );
        sets.push(`${field} = $${params.length}`);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    const result = await query(`UPDATE stores SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    publish("store", { title: "Store updated", detail: `${req.user.name} updated store ${result.rows[0].name}` });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/stores/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM stores WHERE id = $1 RETURNING name", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    publish("store", { title: "Store removed", detail: `${req.user.name} removed store ${result.rows[0].name}` });
    res.json({ message: "Store removed" });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — all users with order counts
router.get("/users", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.skin_type, u.is_active, u.created_at,
              COUNT(o.id)::int AS order_count
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/deactivate
router.put("/users/:id/deactivate", async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: "You cannot deactivate your own account" });
    }
    const active = req.query.activate === "true";
    const result = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, role, is_active`,
      [active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: result.rows[0],
      message: active ? "Account reactivated" : "Account deactivated",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics — skin type stats, top products, monthly signups
router.get("/analytics", async (req, res, next) => {
  try {
    const [skinTypes, topProducts, signups, totals] = await Promise.all([
      query(
        `SELECT COALESCE(skin_type, 'unset') AS skin_type, COUNT(*)::int AS count
         FROM users GROUP BY 1 ORDER BY count DESC`
      ),
      query(
        `SELECT p.id, p.name, p.brand, p.rating, COUNT(o.id)::int AS orders
         FROM products p
         LEFT JOIN orders o ON o.product_id = p.id
         WHERE p.is_active = true
         GROUP BY p.id
         ORDER BY orders DESC, p.rating DESC NULLS LAST
         LIMIT 5`
      ),
      query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1 ASC`
      ),
      query(
        `SELECT
           (SELECT COUNT(*) FROM users)::int AS total_users,
           (SELECT COUNT(*) FROM users WHERE is_active = true)::int AS active_users,
           (SELECT COUNT(*) FROM products WHERE is_active = true)::int AS total_products,
           (SELECT COUNT(*) FROM orders)::int AS total_orders,
           (SELECT COUNT(*) FROM chat_history)::int AS chat_messages,
           (SELECT COUNT(*) FROM support_requests WHERE status = 'open')::int AS open_support`
      ),
    ]);

    res.json({
      skin_types: skinTypes.rows,
      top_products: topProducts.rows,
      monthly_signups: signups.rows,
      totals: totals.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/support — support requests raised when a user asks for a human
// ?status=open (default: open) or ?status=all
router.get("/support", async (req, res, next) => {
  try {
    const filter = req.query.status === "all" ? null : req.query.status || "open";
    const result = await query(
      `SELECT s.id, s.user_id, s.message, s.status, s.created_at, s.resolved_at,
              u.name, u.email
         FROM support_requests s
         JOIN users u ON u.id = s.user_id
        ${filter ? "WHERE s.status = $1" : ""}
        ORDER BY
          CASE WHEN s.status = 'open' THEN 0 ELSE 1 END,
          s.created_at DESC`,
      filter ? [filter] : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/support/:id/resolve  (?reopen=true to mark open again)
router.put("/support/:id/resolve", async (req, res, next) => {
  try {
    const reopen = req.query.reopen === "true";
    const status = reopen ? "open" : "resolved";
    const result = await query(
      `UPDATE support_requests
          SET status = $1,
              resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE NULL END
        WHERE id = $3
        RETURNING id, status`,
      [status, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Support request not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products
router.post("/products", async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ error: "Product name is required" });

    const skinTypes = Array.isArray(body.skin_types)
      ? body.skin_types.map((s) => String(s).toLowerCase().trim())
      : [];

    const result = await query(
      `INSERT INTO products (name, brand, type, description, price, rating, skin_types, image_emoji)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        body.name,
        body.brand || null,
        body.type || null,
        body.description || null,
        body.price || null,
        body.rating != null ? Number(body.rating) : null,
        skinTypes,
        body.image_emoji || "🧴",
      ]
    );
    publish("product", { title: "Product added", detail: `${req.user.name} added product ${body.name}` });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id
router.put("/products/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const allowed = ["name", "brand", "type", "description", "price", "rating", "skin_types", "image_emoji", "is_active"];
    const sets = [];
    const params = [];

    for (const field of allowed) {
      if (body[field] !== undefined) {
        params.push(field === "skin_types" ? (Array.isArray(body[field]) ? body[field] : []) : body[field]);
        sets.push(`${field} = $${params.length}`);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    const result = await query(`UPDATE products SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    publish("product", { title: "Product updated", detail: `${req.user.name} updated product ${result.rows[0].name}` });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
