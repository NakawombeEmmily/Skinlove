const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feature: String,
  usageCount: { type: Number, default: 1 },
  lastUsed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usage', usageSchema);
