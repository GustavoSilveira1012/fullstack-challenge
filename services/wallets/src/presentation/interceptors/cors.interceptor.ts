import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Set CORS headers
    const origin = request.headers.origin;
    response.header('Access-Control-Allow-Origin', origin || '*');
    response.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With,X-CSRF-Token');
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Expose-Headers', 'Authorization');

    return next.handle().pipe(
      tap(() => {
        // Additional processing if needed
      }),
    );
  }
}