const mongoose = require('mongoose');

const skinAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skinType: String,
  quizAnswers: Object,
  imageUrl: String,
  analysisResult: {
    type: String,
    oilLevel: Number,
    sensitivity: Number,
    hydration: Number
  },
  recommendations: [mongoose.Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkinAnalysis', skinAnalysisSchema);
