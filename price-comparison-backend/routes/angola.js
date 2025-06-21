const express = require('express');
const router = express.Router();
const { getAngolaContext, getMarketInsights } = require('../controllers/angolaController');


router.get('/context', getAngolaContext);


router.get('/insights', getMarketInsights);

module.exports = router;

