import type { Request, Response, NextFunction } from 'express';
import { createGzip } from 'zlib';

// Simple compression middleware for API responses
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only compress API responses
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Don't compress if client doesn't support it
  if (!req.headers['accept-encoding']?.includes('gzip')) {
    return next();
  }

  const originalJson = res.json;
  res.json = function (data) {
    if (typeof data === 'object' && JSON.stringify(data).length > 1000) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      
      const gzip = createGzip();
      const jsonString = JSON.stringify(data);
      res.write(Buffer.from(jsonString));
      return gzip.pipe(res);
    }
    return originalJson.call(this, data);
  };

  next();
}