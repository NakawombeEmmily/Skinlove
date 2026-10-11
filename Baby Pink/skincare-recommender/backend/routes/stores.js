const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get nearby stores
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.coordinates) {
      return res.status(400).json({ message: 'User location not set' });
    }

    const stores = await Store.find().limit(10);
    
    // Calculate distance (mock implementation)
    const storesWithDistance = stores.map(store => ({
      ...store.toObject(),
      distance: calculateDistance(user.coordinates, store.coordinates)
    })).sort((a, b) => a.distance - b.distance);

    res.json(storesWithDistance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find().populate('products');
    res.json(stores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create store (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    
    const store = new Store(req.body);
    await store.save();
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper function to calculate distance (Haversine formula)
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Distance in km
}

module.exports = router;
