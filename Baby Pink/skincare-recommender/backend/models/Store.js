const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  phone: String,
  hours: String,
  products: [mongoose.Schema.Types.ObjectId],
  rating: { type: Number, default: 0 },
  distance: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
