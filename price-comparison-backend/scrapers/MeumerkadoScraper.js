const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class MeumerkadoScraper {
  constructor() {
    this.baseUrl = 'https://meumerkado.com/';
    this.storeName = 'MEUMERKADO';
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

      // Buscar pelo termo
      await page.waitForSelector('input[title="Procurar produtos"]');
      await page.type('input[title="Procurar produtos"]', searchTerm);
      await page.keyboard.press('Enter');

      // Aguardar resultados
      await page.waitForSelector('.product-item, .ty-grid-list__item', { timeout: 10000 });

      const content = await page.content();
      const $ = cheerio.load(content);

      const products = [];

      // Extrair produtos da página de resultados
      $('.product-item, .ty-grid-list__item, [class*="product"]').each((index, element) => {
        const $element = $(element);
        
        const name = $element.find('.product-title, .ty-grid-list__product-name, h3, h4, a[title]').text().trim() ||
                     $element.find('a[title]').attr('title');
        
        const priceText = $element.find('.ty-price, .price, .valor, [class*="price"]').text().trim();
        const brand = $element.find('.brand, .marca, .ty-grid-list__brand').text().trim();
        const imageUrl = $element.find('img').attr('src');
        const productUrl = $element.find('a').attr('href');

        // Extrair preço numérico (formato AOA)
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

      console.log(`MEUMERKADO: Encontrados ${products.length} produtos para "${searchTerm}"`);
      return products;

    } catch (error) {
      console.error('Erro no scraping do MEUMERKADO:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = MeumerkadoScraper;

