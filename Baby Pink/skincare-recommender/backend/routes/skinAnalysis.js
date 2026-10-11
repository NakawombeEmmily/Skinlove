const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Quiz-based skin analysis
router.post('/quiz', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    
    // Simple quiz scoring
    const skinType = determineSkinType(answers);
    
    const analysis = new SkinAnalysis({
      userId: req.userId,
      skinType,
      quizAnswers: answers,
      analysisResult: {
        type: skinType,
        oilLevel: answers.oiliness || 0,
        sensitivity: answers.sensitivity || 0,
        hydration: answers.hydration || 0
      }
    });

    await analysis.save();

    // Get recommendations
    const recommendations = await Product.find({ skinTypes: skinType }).limit(5);
    analysis.recommendations = recommendations.map(p => p._id);
    await analysis.save();

    res.json({ skinType, recommendations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Image-based skin analysis
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Mock image analysis - in production, use a real ML model
    const skinType = 'oily'; // Placeholder
    
    const analysis = new SkinAnalysis({
      userId: req.userId,
      skinType,
      imageUrl: `/uploads/${req.file.filename}`,
      analysisResult: {
        type: skinType,
        oilLevel: 75,
        sensitivity: 40,
        hydration: 30
      }
    });

    await analysis.save();

    const recommendations = await Product.find({ skinTypes: skinType }).limit(5);
    analysis.recommendations = recommendations.map(p => p._id);
    await analysis.save();

    // Update user's skin type
    await User.findByIdAndUpdate(req.userId, { skinType });

    res.json({ skinType, recommendations, imageUrl: analysis.imageUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get analysis history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const analyses = await SkinAnalysis.find({ userId: req.userId })
      .populate('recommendations')
      .sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

function determineSkinType(answers) {
  // Simple algorithm based on quiz answers
  let oilScore = 0;
  let dryScore = 0;

  if (answers.oiliness > 5) oilScore += 2;
  if (answers.pores === 'large') oilScore += 1;
  if (answers.texture === 'bumpy') oilScore += 1;

  if (answers.moisture < 3) dryScore += 2;
  if (answers.flaking === 'yes') dryScore += 2;
  if (answers.tightness === 'yes') dryScore += 1;

  if (oilScore > dryScore) return 'oily';
  if (dryScore > oilScore) return 'dry';
  return 'combination';
}

module.exports = router;
