import type { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Add request ID for tracking
  req.id = Math.random().toString(36).substring(7);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, id } = req;
    const { statusCode } = res;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${method} ${originalUrl} - ${duration}ms [${statusCode}] ID: ${id}`);
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
      console.log(`${emoji} ${method} ${originalUrl} ${statusCode} in ${duration}ms :: ID: ${id}`);
    }
  });
  
  next();
}

// Add headers for performance optimization
export function optimizationHeaders(req: Request, res: Response, next: NextFunction) {
  // Enable compression
  res.setHeader('Vary', 'Accept-Encoding');
  
  // Cache static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  } else if (req.path.startsWith('/api/')) {
    // API responses - short cache for dynamic data
    res.setHeader('Cache-Control', 'no-cache');
  }
  
  // Security headers for performance
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
}

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}