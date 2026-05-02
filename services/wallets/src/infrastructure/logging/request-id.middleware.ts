/**
 * Request ID Middleware
 * 
 * Generates or extracts a unique request ID for each HTTP request.
 * The request ID is used to correlate all log entries for a single request.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Check if request ID is provided in header (e.g., from API Gateway)
    const existingRequestId = req.headers['x-request-id'] as string | undefined;
    
    // Use existing request ID or generate a new one
    const requestId = existingRequestId || randomUUID();
    
    // Attach request ID to request object
    req.requestId = requestId;
    
    // Add request ID to response headers for client visibility
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}
