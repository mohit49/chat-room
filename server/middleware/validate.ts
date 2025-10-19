import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 Validation - Endpoint:', req.method, req.path);
      console.log('🔍 Validation - Body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Validation - Query:', JSON.stringify(req.query, null, 2));
      console.log('🔍 Validation - Params:', JSON.stringify(req.params, null, 2));
      
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      console.log('✅ Validation passed');
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        console.log('❌ Validation failed:', errorMessages);
        
        return next(new ValidationError(
          errorMessages.map(e => `${e.field}: ${e.message}`).join(', ')
        ));
      }
      next(error);
    }
  };
};



