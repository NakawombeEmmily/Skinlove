const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Simple rule-based chatbot
const chatResponses = {
  greeting: ['Hello! Welcome to Skincare Recommender. How can I help you today?', 'Hi there! Looking for skincare advice?'],
  skintype: ['I can help! Would you like to take a quiz or upload an image to identify your skin type?', 'Let me help you find your skin type. Choose quiz or image analysis.'],
  products: ['We have products for oily, dry, combination, sensitive, and normal skin types. What\'s your skin type?', 'Tell me your skin type and I\'ll recommend the best products!'],
  stores: ['I can show you nearby stores where you can buy skincare products. Enable location access first!', 'Ready to find stores near you? Just share your location.'],
  help: ['I can help with: 1. Skin Type Analysis 2. Product Recommendations 3. Find Nearby Stores 4. Chat Support', 'What do you need? Skin analysis, product recommendations, or store locations?'],
  default: ['I didn\'t quite understand. Can you rephrase that?', 'Sorry, could you say that differently? Try asking about skin type, products, or stores!']
};

// Chat endpoint
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    let response = chatResponses.default[Math.floor(Math.random() * chatResponses.default.length)];

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = chatResponses.greeting[Math.floor(Math.random() * chatResponses.greeting.length)];
    } else if (lowerMessage.includes('skin type') || lowerMessage.includes('analyze') || lowerMessage.includes('quiz')) {
      response = chatResponses.skintype[Math.floor(Math.random() * chatResponses.skintype.length)];
    } else if (lowerMessage.includes('product') || lowerMessage.includes('recommend')) {
      response = chatResponses.products[Math.floor(Math.random() * chatResponses.products.length)];
    } else if (lowerMessage.includes('store') || lowerMessage.includes('buy') || lowerMessage.includes('location')) {
      response = chatResponses.stores[Math.floor(Math.random() * chatResponses.stores.length)];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      response = chatResponses.help[Math.floor(Math.random() * chatResponses.help.length)];
    }

    res.json({
      message: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
