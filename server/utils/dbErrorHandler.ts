// Database error handling utility

export const withTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

export const handleDBOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Database operation'
): Promise<T> => {
  try {
    // Add timeout to database operations
    return await withTimeout(operation(), 15000, `${operationName} timed out`);
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);
    console.log(`🔄 Using fallback for ${operationName}`);
    return fallbackValue;
  }
};

export const isTimeoutError = (error: any): boolean => {
  return error?.message?.includes('timed out') || 
         error?.message?.includes('buffering timed out') ||
         error?.name === 'MongooseError';
};
