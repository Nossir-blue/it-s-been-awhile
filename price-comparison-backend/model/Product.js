const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  brand: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'AOA'
  },
  store: {
    type: String,
    required: true,
    index: true
  },
  storeUrl: {
    type: String,
    required: true
  },
  productUrl: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: false,
    index: true
  },
  description: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices compostos para otimização de consultas
productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ store: 1, category: 1 });
productSchema.index({ price: 1, store: 1 });

module.exports = mongoose.model('Product', productSchema);

