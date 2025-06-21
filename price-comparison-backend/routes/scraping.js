const express = require('express');
const router = express.Router();
const ScrapingManager = require('../scrapers/ScrapingManager');

const scrapingManager = new ScrapingManager();


router.post('/run', async (req, res) => {
  try {
    console.log('Scraping manual iniciado via API');
    const result = await scrapingManager.runFullScraping();
    
    res.json({
      success: true,
      message: 'Scraping executado com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro no scraping manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar scraping',
      details: error.message
    });
  }
});


router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    scrapers: scrapingManager.scrapers.map(s => s.storeName),
    searchTerms: scrapingManager.searchTerms,
    lastRun: new Date().toISOString()
  });
});

module.exports = router;

