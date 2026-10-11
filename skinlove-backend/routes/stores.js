import { Router } from "express";
import { query } from "../db/client.js";

const router = Router();

// GET /api/stores — all stores
router.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM stores ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/stores/nearby?lat=&lng= — sorted by real distance (Haversine)
router.get("/nearby", async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: "lat and lng query parameters are required" });
    }

    const result = await query(
      `SELECT * FROM (
         SELECT id, name, latitude, longitude, hours, available_products,
           (6371 * acos(
             cos(radians($1)) * cos(radians(latitude)) *
             cos(radians(longitude) - radians($2)) +
             sin(radians($1)) * sin(radians(latitude))
           ))::numeric(4,1) AS distance_km
         FROM stores
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ) ranked
       ORDER BY distance_km ASC`,
      [lat, lng]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
