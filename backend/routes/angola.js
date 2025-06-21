const express = require('express');
const router = express.Router();
const { getAngolaContext, getMarketInsights } = require('../controllers/angolaController');

// Rota para obter dados contextuais de Angola
router.get('/context', getAngolaContext);

// Rota para obter insights do mercado angolano
router.get('/insights', getMarketInsights);

module.exports = router;

