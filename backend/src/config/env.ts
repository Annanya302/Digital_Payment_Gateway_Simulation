import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-simulation-gateway-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  defaultWalletBalance: 10000.0,
  maxDailyTransactionLimit: 50000.0,
  maxSingleTransactionLimit: 25000.0,
};
