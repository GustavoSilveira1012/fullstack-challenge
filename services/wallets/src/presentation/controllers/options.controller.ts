import { Controller, Options, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class OptionsController {
  @Options('*')
  handleOptions(@Req() req: Request, @Res() res: Response): void {
    const origin = req.headers.origin;
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    
    console.log(`[OPTIONS] Handled preflight request for ${req.url} from origin ${origin}`);
    res.status(200).end();
  }
}