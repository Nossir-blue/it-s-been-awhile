const cron = require('node-cron');
const Product = require('../models/Product');
const KibaboScraper = require('./KibaboScraper');
const MeumerkadoScraper = require('./MeumerkadoScraper');

class ScrapingManager {
  constructor() {
    this.scrapers = [
      new KibaboScraper(),
      new MeumerkadoScraper()
    ];
    
    this.searchTerms = [
      'arroz',
      'feijão',
      'açúcar',
      'óleo',
      'farinha',
      'massa',
      'leite',
      'ovos',
      'pão',
      'carne',
      'peixe',
      'frango',
      'batata',
      'cebola',
      'tomate'
    ];
  }

  async scrapeAllStores() {
    console.log('Iniciando scraping de todas as lojas...');
    const allProducts = [];

    for (const scraper of this.scrapers) {
      for (const term of this.searchTerms) {
        try {
          console.log(`Fazendo scraping de "${term}" em ${scraper.storeName}...`);
          const products = await scraper.scrapeProducts(term);
          allProducts.push(...products);
          
          // Pausa entre requisições para evitar sobrecarga
          await this.delay(2000);
        } catch (error) {
          console.error(`Erro ao fazer scraping de "${term}" em ${scraper.storeName}:`, error);
        }
      }
    }

    console.log(`Total de produtos coletados: ${allProducts.length}`);
    return allProducts;
  }

  async saveProducts(products) {
    console.log('Salvando produtos na base de dados...');
    let savedCount = 0;
    let updatedCount = 0;

    for (const productData of products) {
      try {
        // Verificar se o produto já existe
        const existingProduct = await Product.findOne({
          name: productData.name,
          store: productData.store
        });

        if (existingProduct) {
          // Atualizar produto existente
          if (existingProduct.price !== productData.price) {
            // Adicionar ao histórico de preços
            existingProduct.priceHistory.push({
              price: existingProduct.price,
              date: existingProduct.lastUpdated
            });
            
            // Manter apenas os últimos 30 registros de histórico
            if (existingProduct.priceHistory.length > 30) {
              existingProduct.priceHistory = existingProduct.priceHistory.slice(-30);
            }
          }

          // Atualizar campos
          Object.assign(existingProduct, productData);
          await existingProduct.save();
          updatedCount++;
        } else {
          // Criar novo produto
          const newProduct = new Product(productData);
          await newProduct.save();
          savedCount++;
        }
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
      }
    }

    console.log(`Produtos salvos: ${savedCount}, atualizados: ${updatedCount}`);
    return { saved: savedCount, updated: updatedCount };
  }

  async runFullScraping() {
    try {
      const startTime = Date.now();
      console.log('=== INICIANDO SCRAPING COMPLETO ===');
      
      const products = await this.scrapeAllStores();
      const result = await this.saveProducts(products);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('=== SCRAPING COMPLETO FINALIZADO ===');
      console.log(`Duração: ${duration}s`);
      console.log(`Produtos processados: ${products.length}`);
      console.log(`Novos: ${result.saved}, Atualizados: ${result.updated}`);
      
      return result;
    } catch (error) {
      console.error('Erro no scraping completo:', error);
      throw error;
    }
  }

  startScheduledScraping() {
    // Executar a cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('Executando scraping agendado...');
      try {
        await this.runFullScraping();
      } catch (error) {
        console.error('Erro no scraping agendado:', error);
      }
    });

    console.log('Scraping agendado configurado para executar a cada 6 horas');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ScrapingManager;

