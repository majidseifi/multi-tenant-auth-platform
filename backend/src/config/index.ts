import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5050', 10),

  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
    },
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: process.env.NODE_ENV === 'production'
      ? parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
      : parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableCloudWatch: process.env.ENABLE_CLOUDWATCH_LOGS === 'true',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('AWS_S3_BUCKET');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Warn about optional but recommended variables
const recommendedEnvVars = ['SENTRY_DSN', 'AWS_REGION'];
if (config.nodeEnv === 'production') {
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Warning: Recommended environment variable not set: ${envVar}`);
    }
  }
}

export default config;
