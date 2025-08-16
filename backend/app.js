const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla giriş denemesi' } }
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla dosya yükleme denemesi' } }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla istek' } }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authLimiter);
app.use('/api/uploads', uploadLimiter);
app.use('/api', generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const technicianRoutes = require('./routes/technicians');
const customerCompanyRoutes = require('./routes/customerCompanies');
const equipmentRoutes = require('./routes/equipment');
const offerRoutes = require('./routes/offers');
const workOrderRoutes = require('./routes/workOrders');
const inspectionRoutes = require('./routes/inspections');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/customer-companies', customerCompanyRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Bir hata oluştu'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint bulunamadı'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;