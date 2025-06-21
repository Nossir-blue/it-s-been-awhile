const Product = require('../models/Product');

class SearchOptimizer {
  constructor() {
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Algoritmo de busca otimizada com cache e índices
  async optimizedSearch(query, filters = {}) {
    const cacheKey = this.generateCacheKey(query, filters);
    
    // Verificar cache
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.searchCache.delete(cacheKey);
    }

    // Construir pipeline de agregação otimizada
    const pipeline = this.buildOptimizedPipeline(query, filters);
    
    try {
      const results = await Product.aggregate(pipeline);
      
      // Cache dos resultados
      this.searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
      
      return results;
    } catch (error) {
      console.error('Erro na busca otimizada:', error);
      throw error;
    }
  }

  // Construir pipeline de agregação MongoDB otimizada
  buildOptimizedPipeline(query, filters) {
    const pipeline = [];

    // 1. Match inicial com índices
    const matchStage = {
      inStock: true
    };

    if (query) {
      matchStage.$text = { $search: query };
    }

    if (filters.store) {
      matchStage.store = filters.store;
    }

    if (filters.category) {
      matchStage.category = filters.category;
    }

    if (filters.priceMin || filters.priceMax) {
      matchStage.price = {};
      if (filters.priceMin) matchStage.price.$gte = parseFloat(filters.priceMin);
      if (filters.priceMax) matchStage.price.$lte = parseFloat(filters.priceMax);
    }

    pipeline.push({ $match: matchStage });

    // 2. Adicionar score de relevância se houver busca textual
    if (query) {
      pipeline.push({
        $addFields: {
          score: { $meta: "textScore" }
        }
      });
    }

    // 3. Agrupar por produto similar para evitar duplicatas
    pipeline.push({
      $group: {
        _id: {
          normalizedName: {
            $toLower: {
              $trim: {
                input: {
                  $replaceAll: {
                    input: "$name",
                    find: /\s+/,
                    replacement: " "
                  }
                }
              }
            }
          }
        },
        products: {
          $push: {
            _id: "$_id",
            name: "$name",
            brand: "$brand",
            price: "$price",
            currency: "$currency",
            store: "$store",
            storeUrl: "$storeUrl",
            productUrl: "$productUrl",
            category: "$category",
            imageUrl: "$imageUrl",
            lastUpdated: "$lastUpdated",
            score: query ? { $meta: "textScore" } : 1
          }
        },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgPrice: { $avg: "$price" },
        storeCount: { $addToSet: "$store" }
      }
    });

    // 4. Ordenar por relevância e preço
    const sortStage = {};
    if (query) {
      sortStage.score = -1;
    }
    sortStage.minPrice = 1;
    
    pipeline.push({ $sort: sortStage });

    // 5. Limitar resultados
    pipeline.push({ $limit: parseInt(filters.limit) || 50 });

    // 6. Projetar campos finais
    pipeline.push({
      $project: {
        _id: 0,
        productName: "$_id.normalizedName",
        products: 1,
        priceRange: {
          min: "$minPrice",
          max: "$maxPrice",
          avg: { $round: ["$avgPrice", 2] }
        },
        storeCount: { $size: "$storeCount" },
        bestDeal: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$products",
                cond: { $eq: ["$$this.price", "$minPrice"] }
              }
            },
            0
          ]
        }
      }
    });

    return pipeline;
  }

  // Algoritmo de comparação de preços com análise de tendências
  async compareProductPrices(productName) {
    try {
      const pipeline = [
        {
          $match: {
            $text: { $search: productName },
            inStock: true
          }
        },
        {
          $group: {
            _id: "$store",
            products: {
              $push: {
                name: "$name",
                price: "$price",
                currency: "$currency",
                lastUpdated: "$lastUpdated",
                priceHistory: "$priceHistory"
              }
            },
            minPrice: { $min: "$price" },
            avgPrice: { $avg: "$price" },
            productCount: { $sum: 1 }
          }
        },
        {
          $sort: { minPrice: 1 }
        }
      ];

      const storeComparison = await Product.aggregate(pipeline);

      // Calcular estatísticas de mercado
      const allPrices = storeComparison.flatMap(store => 
        store.products.map(p => p.price)
      );

      const marketStats = {
        totalStores: storeComparison.length,
        totalProducts: allPrices.length,
        priceRange: {
          min: Math.min(...allPrices),
          max: Math.max(...allPrices),
          avg: allPrices.reduce((a, b) => a + b, 0) / allPrices.length
        },
        priceDistribution: this.calculatePriceDistribution(allPrices)
      };

      return {
        productName,
        storeComparison,
        marketStats,
        recommendations: this.generatePriceRecommendations(storeComparison, marketStats)
      };

    } catch (error) {
      console.error('Erro na comparação otimizada:', error);
      throw error;
    }
  }

  // Calcular distribuição de preços
  calculatePriceDistribution(prices) {
    const sorted = prices.sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      median: len % 2 === 0 
        ? (sorted[len/2 - 1] + sorted[len/2]) / 2 
        : sorted[Math.floor(len/2)],
      q1: sorted[Math.floor(len * 0.25)],
      q3: sorted[Math.floor(len * 0.75)],
      iqr: sorted[Math.floor(len * 0.75)] - sorted[Math.floor(len * 0.25)]
    };
  }

  // Gerar recomendações baseadas em análise de preços
  generatePriceRecommendations(storeComparison, marketStats) {
    const recommendations = [];
    
    if (storeComparison.length > 1) {
      const cheapest = storeComparison[0];
      const mostExpensive = storeComparison[storeComparison.length - 1];
      const savings = mostExpensive.minPrice - cheapest.minPrice;
      const savingsPercent = (savings / mostExpensive.minPrice) * 100;
      
      recommendations.push({
        type: 'savings',
        message: `Pode poupar até ${savings.toFixed(2)} AOA (${savingsPercent.toFixed(1)}%) comprando em ${cheapest._id}`,
        priority: 'high'
      });
    }

    // Recomendação baseada na distribuição de preços
    const { priceRange, priceDistribution } = marketStats;
    if (priceRange.max > priceRange.avg * 1.5) {
      recommendations.push({
        type: 'market_analysis',
        message: 'Grande variação de preços no mercado. Compare bem antes de comprar.',
        priority: 'medium'
      });
    }

    // Recomendação de timing
    recommendations.push({
      type: 'timing',
      message: 'Preços podem variar. Considere monitorar por alguns dias.',
      priority: 'low'
    });

    return recommendations;
  }

  // Gerar chave de cache
  generateCacheKey(query, filters) {
    return `search:${query || 'all'}:${JSON.stringify(filters)}`;
  }

  // Limpar cache expirado
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }
}

module.exports = SearchOptimizer;

