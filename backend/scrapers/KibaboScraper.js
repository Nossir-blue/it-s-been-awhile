const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class KibaboScraper {
  constructor() {
    this.baseUrl = 'https://www.kibabo.co.ao/pt/';
    this.storeName = 'Kibabo Online';
  }

  async scrapeProducts(searchTerm = 'arroz') {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navegar para a página inicial
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

      // Aceitar cookies se necessário
      try {
        await page.waitForSelector('span:contains("ACEITAR TODOS OS COOKIES")', { timeout: 3000 });
        await page.click('span:contains("ACEITAR TODOS OS COOKIES")');
      } catch (e) {
        console.log('Botão de cookies não encontrado ou já aceito');
      }

      // Buscar pelo termo
      await page.waitForSelector('input[placeholder="O que procura?"]');
      await page.type('input[placeholder="O que procura?"]', searchTerm);
      await page.keyboard.press('Enter');

      // Aguardar resultados
      await page.waitForSelector('.product-item, .produto', { timeout: 10000 });

      const content = await page.content();
      const $ = cheerio.load(content);

      const products = [];

      // Extrair produtos da página de resultados
      $('.product-item, .produto, [class*="product"]').each((index, element) => {
        const $element = $(element);
        
        const name = $element.find('.product-name, .nome-produto, h3, h4, .title').text().trim();
        const priceText = $element.find('.price, .preco, .valor, [class*="price"]').text().trim();
        const brand = $element.find('.brand, .marca').text().trim();
        const imageUrl = $element.find('img').attr('src');
        const productUrl = $element.find('a').attr('href');

        // Extrair preço numérico
        const priceMatch = priceText.match(/[\d.,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;

        if (name && price) {
          products.push({
            name: name,
            brand: brand || null,
            price: price,
            currency: 'AOA',
            store: this.storeName,
            storeUrl: this.baseUrl,
            productUrl: productUrl ? (productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl) : null,
            category: 'Alimentação',
            imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : this.baseUrl + imageUrl) : null,
            inStock: true,
            lastUpdated: new Date()
          });
        }
      });

      console.log(`Kibabo: Encontrados ${products.length} produtos para "${searchTerm}"`);
      return products;

    } catch (error) {
      console.error('Erro no scraping do Kibabo:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = KibaboScraper;

