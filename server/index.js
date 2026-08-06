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
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Routes
import aiRoutes from './routes/ai.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/ = build de Vite (npm run build), un nivel arriba de server/.
const distPath = path.join(__dirname, '..', 'dist');
const hasFrontendBuild = fs.existsSync(distPath);

const app = express();
// Render (y la mayoría de PaaS) asignan su propio puerto dinámico y lo pasan
// en PORT — si el server no lo respeta, la plataforma nunca detecta que el
// servicio arrancó. AI_SERVER_PORT sigue funcionando para uso local/manual.
const PORT = process.env.PORT || process.env.AI_SERVER_PORT || 3001;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  // Si servimos el frontend desde este mismo proceso (deploy combinado),
  // el navegador nunca manda Origin distinto y CORS no aplica — pero lo
  // dejamos abierto igual por si en algún momento separan los servicios.
  origin: process.env.APP_URL || true,
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

// ─── Frontend (deploy combinado) ──────────────────────────────────────────────
// Si dist/ existe (se corrió `npm run build`), este mismo proceso sirve la
// app además de la API — un solo servicio en Render, sin CORS que pelear ni
// URLs cruzadas que configurar. En desarrollo local (npm run dev + npm run
// server por separado) dist/ no existe y esto simplemente no aplica.
if (hasFrontendBuild) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler (rutas de API que no matchean, o modo backend-only sin dist/)
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
