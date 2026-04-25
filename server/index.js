/**
 * PequeAprendo AI Backend Server
 * Multi-provider AI proxy with rate limiting, error handling and capability management
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// Routes
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3001;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));  // Limit payload to 2MB max

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
// 60 requests per minute globally across all AI routes
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 60,                    // max 60 req/min globally
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT_EXCEEDED', message: '⏳ Demasiadas peticiones. Por favor espera un momento.' },
  skip: (req) => req.path === '/health',
});

app.use('/api/ai', globalLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[PequeAprendo AI Server Error]', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'El servicio de IA no está disponible en este momento.',
  });
});

app.listen(PORT, () => {
  console.log(`\n🧠 PequeAprendo AI Server running on http://localhost:${PORT}`);
  console.log(`📋 Providers configured:`);
  const providers = ['groq', 'gemini', 'openai', 'deepseek'];
  providers.forEach(p => {
    const key = process.env[`${p.toUpperCase()}_API_KEY`];
    console.log(`   ${key ? '✅' : '❌'} ${p.charAt(0).toUpperCase() + p.slice(1)}`);
  });
  console.log('');
});

export default app;
