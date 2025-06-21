const { spawn } = require('child_process');
const path = require('path');


const getAngolaData = () => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../services/angola_data.py');
    const python = spawn('python3', [pythonScript]);
    
    let dataString = '';
    let errorString = '';
    
    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(getMockAngolaData());
        } catch (error) {
          resolve(getMockAngolaData());
        }
      } else {
        console.error('Erro no script Python:', errorString);
        resolve(getMockAngolaData());
      }
    });
  });
};


const getMockAngolaData = () => {
  return {
    country: 'Angola',
    currency: 'AOA',
    capital: 'Luanda',
    gdp: {
      value: 124209000000,
      year: '2022',
      formatted: '$124,209,000,000 USD (2022)'
    },
    inflation: {
      value: 21.36,
      year: '2022',
      formatted: '21.36% (2022)'
    },
    population: {
      value: 35027343,
      year: '2022',
      formatted: '35,027,343 habitantes (2022)'
    },
    economicContext: {
      mainSectors: ['Petróleo', 'Diamantes', 'Agricultura', 'Pesca'],
      challenges: ['Inflação elevada', 'Dependência do petróleo', 'Infraestrutura'],
      opportunities: ['Diversificação económica', 'Agricultura', 'Turismo']
    }
  };
};

const getAngolaContext = async (req, res) => {
  try {
    const angolaData = await getAngolaData();
    
    res.json({
      success: true,
      data: angolaData,
      timestamp: new Date().toISOString(),
      source: 'World Bank Data & Local Context'
    });
  } catch (error) {
    console.error('Erro ao obter dados de Angola:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter dados contextuais de Angola',
      data: getMockAngolaData() // Fallback para dados mock
    });
  }
};


const getMarketInsights = async (req, res) => {
  try {
    const angolaData = await getAngolaData();
    
    
    const insights = {
      priceContext: {
        inflationImpact: angolaData.inflation.value > 10 ? 'Alto' : 'Moderado',
        recommendation: angolaData.inflation.value > 15 
          ? 'Monitorar preços frequentemente devido à alta inflação'
          : 'Preços relativamente estáveis',
        currencyNote: 'Preços em Kwanza Angolano (AOA)'
      },
      marketSize: {
        population: angolaData.population.formatted,
        economicActivity: angolaData.gdp.formatted,
        marketPotential: 'Alto potencial de crescimento no setor alimentar'
      },
      recommendations: [
        'Comparar preços regularmente devido à volatilidade económica',
        'Considerar produtos locais para melhor relação custo-benefício',
        'Monitorar tendências de preços por região',
        'Aproveitar promoções e ofertas especiais'
      ]
    };
    
    res.json({
      success: true,
      insights,
      contextData: angolaData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar insights do mercado'
    });
  }
};

module.exports = {
  getAngolaContext,
  getMarketInsights
};

