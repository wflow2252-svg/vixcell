'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const initFirebase = require('./src/config/firebase');
const { initSocket } = require('./src/socket');

const authRoutes = require('./src/routes/auth.routes');
const chatRoutes = require('./src/routes/chat.routes');
const aiRoutes = require('./src/routes/ai.routes');
const projectRoutes = require('./src/routes/projects.routes');
const supportRoutes = require('./src/routes/support.routes');
const statsRoutes = require('./src/routes/stats.routes');
const metaRoutes = require('./src/routes/meta.routes');
const vixAiRoutes = require('./src/routes/vixAi.routes');

const startDailyMarketingCron = require('./src/cron/dailyMarketing.cron');

const { errorHandler, notFound } = require('./src/middleware/error.middleware');

// ─── Init ──────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Database ──────────────────────────────────────────────────────────────
connectDB();

// ─── Firebase Admin ────────────────────────────────────────────────────────
initFirebase();

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Security & Logging ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(morgan(process.env.LOG_LEVEL || 'combined'));

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Global Rate Limiter ───────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', globalLimiter);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      env: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    message: 'Vixcell API is running',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/vix-ai', vixAiRoutes);

// ─── 404 & Error Handling ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket.io ─────────────────────────────────────────────────────────────
initSocket(server, corsOptions);

// ─── Start Server ──────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Vixcell Backend running on port ${PORT} [${NODE_ENV}]`);
  console.log(`   REST API  → http://localhost:${PORT}/api`);
  console.log(`   Health    → http://localhost:${PORT}/health`);
  console.log(`   Socket.io → ws://localhost:${PORT}\n`);
  
  // Start autonomous AI agent cron job
  startDailyMarketingCron();
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server };
