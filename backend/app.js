const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');
const aiService = require('./services/aiService');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// render/railway sit behind a proxy - needed for correct client IPs in rate-limit
app.set('trust proxy', 1);

app.use(helmet());

// support a comma-separated CLIENT_URL so prod + preview domains both work
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/interviews', require('./routes/interview'));
app.use('/api/questions', require('./routes/question'));
app.use('/api/resumes', require('./routes/resume'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server is running', ai: aiService.isEnabled() })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
