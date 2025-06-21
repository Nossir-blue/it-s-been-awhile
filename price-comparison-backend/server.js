const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet());


app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));


app.use(morgan('combined'));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectado com sucesso');
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();


app.use('/api/products', require('./routes/products'));
app.use('/api/scraping', require('./routes/scraping'));


app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.get('/', (req, res) => {
  res.json({
    message: 'API de Comparação de Preços - Angola',
    version: '1.0.0',
    endpoints: {
      search: '/api/products/search?q=produto',
      compare: '/api/products/compare/:productName',
      stores: '/api/products/stores',
      categories: '/api/products/categories',
      stats: '/api/products/stats',
      scraping: '/api/scraping/run',
      scrapingStatus: '/api/scraping/status',
      health: '/health'
    }
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});


app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;

