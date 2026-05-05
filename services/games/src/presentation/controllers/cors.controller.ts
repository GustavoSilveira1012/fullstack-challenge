import { Controller, Options, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * CORS Controller
 * Handles OPTIONS preflight requests for CORS
 */
@Controller('*')
export class CorsController {
  @Options('*')
  handleOptions(@Req() req: Request, @Res() res: Response): void {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:5176',
    ];
    
    // Check if origin is allowed or is localhost with any port
    if (allowedOrigins.includes(origin) || (origin && origin.match(/^http:\/\/localhost:\d+$/))) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    res.status(200).end();
  }
}