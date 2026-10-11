const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Admin dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const totalUsers = await User.countDocuments();
    const totalAnalyses = await SkinAnalysis.countDocuments();
    const usageStats = await Usage.aggregate([
      { $group: { _id: '$feature', count: { $sum: '$usageCount' } } }
    ]);

    res.json({ totalUsers, totalAnalyses, usageStats });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get usage reports
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    
    const usage = await Usage.aggregate([
      {
        $group: {
          _id: { feature: '$feature', month: { $month: '$createdAt' } },
          total: { $sum: '$usageCount' }
        }
      },
      { $sort: { '_id.month': -1 } }
    ]);

    res.json(usage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get usage by user
router.get('/usage/:userId', authMiddleware, async (req, res) => {
  try {
    if (!req.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    
    const usage = await Usage.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(usage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
