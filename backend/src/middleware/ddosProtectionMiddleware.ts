import slowDown from 'express-slow-down';

// Slow down middleware to gradually increase response time for repeated requests
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes, then...
    delayMs: () => 500, // Begin adding 500ms of delay per request above 50
    maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// More aggressive slow down for authentication endpoints
export const authSpeedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // Allow 2 requests per 15 minutes, then...
    delayMs: () => 1000, // Begin adding 1000ms of delay per request above 2
    maxDelayMs: 60000, // Maximum delay of 60 seconds
});

// Slow down for file uploads
export const uploadSpeedLimiter = slowDown({
    windowMs: 5 * 60 * 1000, // 5 minutes
    delayAfter: 2, // Allow 2 uploads per 5 minutes, then...
    delayMs: () => 2000, // Begin adding 2000ms of delay per request above 2
    maxDelayMs: 30000, // Maximum delay of 30 seconds
});

// Custom middleware to detect and block suspicious patterns
export const ddosProtection = (req: any, res: any, next: any) => {
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    // Block requests with suspicious user agents
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
        /masscan/i,
        /nmap/i
    ];
    
    // Allow legitimate crawlers but block obvious attack tools
    const legitimateBots = [
        /googlebot/i,
        /bingbot/i,
        /slurp/i,
        /duckduckbot/i,
        /baiduspider/i,
        /yandexbot/i,
        /facebookexternalhit/i,
        /twitterbot/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious && !isLegitimate) {
        console.log(`🚫 Blocked suspicious request from: ${req.ip}, User-Agent: ${userAgent}`);
        return res.status(429).json({
            error: 'Access denied',
            message: 'Suspicious activity detected'
        });
    }
    
    // Block requests with empty or suspicious referers from non-API routes
    if (!req.path.startsWith('/api/') && !referer && !req.get('Accept')?.includes('text/html')) {
        console.log(`🚫 Blocked request with no referer from: ${req.ip}`);
        return res.status(429).json({
            error: 'Access denied',
            message: 'Invalid request'
        });
    }
    
    next();
};

// Middleware to limit request size and timeout
export const requestSizeLimit = (req: any, res: any, next: any) => {
    // Set timeout for all requests
    req.setTimeout(30000, () => {
        res.status(408).json({
            error: 'Request timeout',
            message: 'Request took too long to process'
        });
    });
    
    // Check content length
    const contentLength = req.get('Content-Length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
        return res.status(413).json({
            error: 'Payload too large',
            message: 'Request payload exceeds size limit'
        });
    }
    
    next();
};