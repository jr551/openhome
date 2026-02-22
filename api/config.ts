import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: JWT_SECRET and REFRESH_SECRET must be set in production!');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET or REFRESH_SECRET is not set. Using insecure defaults for development only.');
}

export const config = {
    JWT_SECRET: JWT_SECRET || 'insecure-dev-secret',
    REFRESH_SECRET: REFRESH_SECRET || 'insecure-dev-refresh-secret',
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development'
};
