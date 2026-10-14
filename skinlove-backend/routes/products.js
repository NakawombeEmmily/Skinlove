import { Router } from "express";
import { query } from "../db/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { publish } from "../realtime.js";

const router = Router();

const PRODUCT_FIELDS = ["name", "brand", "type", "description", "price", "rating", "skin_types", "image_emoji", "image_url"];
const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];

function normaliseSkinTypes(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(list.map((s) => String(s).trim().toLowerCase()).filter((s) => SKIN_TYPES.includes(s)))];
}

// GET /api/products — ?skin_type= &type= &search=
router.get("/", async (req, res, next) => {
  try {
    const { skin_type, type, search } = req.query;
    const conditions = ["is_active = true"];
    const params = [];

    if (skin_type && SKIN_TYPES.includes(String(skin_type).toLowerCase())) {
      params.push(String(skin_type).toLowerCase());
      conditions.push(`skin_types @> ARRAY[$${params.length}]::text[]`);
    }
    if (type) {
      params.push(`%${String(type)}%`);
      conditions.push(`type ILIKE $${params.length}`);
    }
    if (search) {
      params.push(`%${String(search)}%`);
      conditions.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const result = await query(
      `SELECT * FROM products WHERE ${conditions.join(" AND ")} ORDER BY rating DESC NULLS LAST, name ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM products WHERE id = $1 AND is_active = true", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/products — Admin only
router.post("/", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    const skin_types = normaliseSkinTypes(body.skin_types);
    const result = await query(
      `INSERT INTO products (name, brand, type, description, price, rating, skin_types, image_emoji, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        body.name,
        body.brand || null,
        body.type || null,
        body.description || null,
        body.price || null,
        body.rating != null ? Number(body.rating) : null,
        skin_types,
        body.image_emoji || "🧴",
        body.image_url || null,
      ]
    );
    publish("product", { title: "Product added", detail: `${req.user.name} added product ${body.name}` });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id — Admin only
router.put("/:id", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const sets = [];
    const params = [];

    for (const field of PRODUCT_FIELDS) {
      if (body[field] !== undefined) {
        params.push(field === "skin_types" ? normaliseSkinTypes(body[field]) : body[field]);
        sets.push(`${field} = $${params.length}`);
      }
    }
    if (body.is_active !== undefined) {
      params.push(Boolean(body.is_active));
      sets.push(`is_active = $${params.length}`);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    const result = await query(`UPDATE products SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    publish("product", { title: "Product updated", detail: `${req.user.name} updated product ${result.rows[0].name}` });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id — soft delete (is_active = false)
router.delete("/:id", requireAuth, adminOnly, async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE products SET is_active = false WHERE id = $1 RETURNING id, name, is_active",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    publish("product", { title: "Product removed", detail: `${req.user.name} removed product ${result.rows[0].name}` });
    res.json({ message: "Product removed", product: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
