const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  skinTypes: [String], // oily, dry, combination, sensitive, normal
  category: String,
  brand: String,
  image: String,
  benefits: [String],
  rating: { type: Number, default: 0 },
  reviews: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
