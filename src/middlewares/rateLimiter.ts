import { Request, Response, NextFunction } from "express";
import { redis } from "../app.js"; 
const RATE_LIMIT_TTL = 30; 
const RATE_LIMIT_MAX_REQUESTS = 8;

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userKey = `rate-limit:${req.ip}`;
    const requests = await redis.incr(userKey);
    
    if (requests === 1) {
      await redis.expire(userKey, RATE_LIMIT_TTL);
    }
    
    if (requests > RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({
        message: "Too many requests. Please try again later.",
        retry_after: RATE_LIMIT_TTL
      });      
    }
    next();
  } catch (err) {
    console.error("Rate limiting error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export default rateLimiter;
