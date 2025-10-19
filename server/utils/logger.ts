// Production-safe logger utility
// In production, console.log is replaced with no-op, but error and warn are kept

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn(...args); // Always show warnings
  },
  
  error: (...args: any[]) => {
    console.error(...args); // Always show errors
  },
};

// Override global console in production
if (isProduction) {
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  console.log = () => {}; // No-op in production
  console.info = () => {}; // No-op in production
  console.debug = () => {}; // No-op in production
  
  // Keep error and warn for critical issues
  // console.error and console.warn remain unchanged
  
  logger.log('🔇 Console logs suppressed in production mode');
}

export default logger;

