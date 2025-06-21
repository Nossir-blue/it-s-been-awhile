const express = require('express');
const router = express.Router();
const {
  searchProducts,
  compareProductPrices,
  getStores,
  getCategories,
  getStats
} = require('../controllers/productController');

// Rota para buscar produtos
router.get('/search', searchProducts);

// Rota para comparar preços de um produto específico
router.get('/compare/:productName', compareProductPrices);

// Rota para obter todas as lojas
router.get('/stores', getStores);

// Rota para obter todas as categorias
router.get('/categories', getCategories);

// Rota para obter estatísticas gerais
router.get('/stats', getStats);

module.exports = router;

