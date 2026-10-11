const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Track feature usage
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { feature } = req.body;

    let usage = await Usage.findOne({ userId: req.userId, feature });
    
    if (usage) {
      usage.usageCount += 1;
      usage.lastUsed = new Date();
    } else {
      usage = new Usage({
        userId: req.userId,
        feature,
        usageCount: 1,
        lastUsed: new Date()
      });
    }

    await usage.save();
    res.json({ message: 'Usage tracked' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user usage stats
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const stats = await Usage.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
