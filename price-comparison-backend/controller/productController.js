const Product = require('../models/Product');
const Cache = require('../models/Cache');
const SearchOptimizer = require('../services/SearchOptimizer');

const searchOptimizer = new SearchOptimizer();

const getCachedData = async (key) => {
  try {
    const cached = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
    return cached ? cached.data : null;
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    return null;
  }
};

const setCachedData = async (key, data, ttlMinutes = 30) => {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await Cache.findOneAndUpdate(
      { key },
      { data, expiresAt },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q, store, category, sortBy = 'price', order = 'asc', page = 1, limit = 20, priceMin, priceMax } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório' });
    }

    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cachedResult = await getCachedData(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const filters = {
      store,
      category,
      priceMin,
      priceMax,
      limit: parseInt(limit),
      page: parseInt(page)
    };

    const optimizedResults = await searchOptimizer.optimizedSearch(q, filters);
    
    const products = optimizedResults.flatMap(group => 
      group.products.map(product => ({
        ...product,
        priceRange: group.priceRange,
        storeCount: group.storeCount
      }))
    );

    const result = {
      products: products.slice(0, parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length,
        pages: Math.ceil(products.length / parseInt(limit))
      },
      optimizedResults: optimizedResults.slice(0, 10) // Top 10 grupos
    };

    await setCachedData(cacheKey, result, 15);

    res.json(result);
  } catch (error) {
    console.error('Erro na busca de produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const compareProductPrices = async (req, res) => {
  try {
    const { productName } = req.params;
    
    const cacheKey = `compare:${productName}`;
    const cachedResult = await getCachedData(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const comparison = await searchOptimizer.compareProductPrices(productName);

    if (comparison.storeComparison.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const allStores = comparison.storeComparison.map(store => ({
      store: store._id,
      price: store.minPrice,
      currency: 'AOA',
      name: productName,
      productCount: store.productCount
    })).sort((a, b) => a.price - b.price);

    const result = {
      productName,
      totalStores: comparison.marketStats.totalStores,
      lowestPrice: allStores[0],
      highestPrice: allStores[allStores.length - 1],
      allStores,
      marketStats: comparison.marketStats,
      recommendations: comparison.recommendations
    };

    await setCachedData(cacheKey, result, 30);

    res.json(result);
  } catch (error) {
    console.error('Erro na comparação de preços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getStores = async (req, res) => {
  try {
    const cacheKey = 'stores:all';
    const cachedResult = await getCachedData(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const stores = await Product.distinct('store');
    

    await setCachedData(cacheKey, stores, 60);

    res.json(stores);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getCategories = async (req, res) => {
  try {
    const cacheKey = 'categories:all';
    const cachedResult = await getCachedData(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const categories = await Product.distinct('category');
    
    await setCachedData(cacheKey, categories, 60);

    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getStats = async (req, res) => {
  try {
    const cacheKey = 'stats:general';
    const cachedResult = await getCachedData(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const totalProducts = await Product.countDocuments({ inStock: true });
    const totalStores = await Product.distinct('store').then(stores => stores.length);
    const totalCategories = await Product.distinct('category').then(cats => cats.length);
    const lastUpdate = await Product.findOne().sort({ lastUpdated: -1 }).select('lastUpdated');

    const stats = {
      totalProducts,
      totalStores,
      totalCategories,
      lastUpdate: lastUpdate ? lastUpdate.lastUpdated : null
    };

    await setCachedData(cacheKey, stats, 30);

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  searchProducts,
  compareProductPrices,
  getStores,
  getCategories,
  getStats
};

