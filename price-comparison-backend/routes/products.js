const express = require('express');
const router = express.Router();
const {
  searchProducts,
  compareProductPrices,
  getStores,
  getCategories,
  getStats
} = require('../controllers/productController');


router.get('/search', searchProducts);


router.get('/compare/:productName', compareProductPrices);


router.get('/stores', getStores);


router.get('/categories', getCategories);


router.get('/stats', getStats);

module.exports = router;

