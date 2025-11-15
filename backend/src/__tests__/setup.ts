import dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';

// Load environment variables before any other imports
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Polyfill TextEncoder and TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
