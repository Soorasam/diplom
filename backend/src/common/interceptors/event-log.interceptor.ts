import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class EventLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Event');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      body?: unknown;
      user?: { id: string; email: string; role: string };
    }>();
    const { method, url, body, user } = req;
    const started = Date.now();

    const userPart = user ? ` user=${user.email}(${user.role})` : '';

    this.logger.log(`→ ${method} ${url}${userPart} body=${JSON.stringify(body ?? {})}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const ms = Date.now() - started;
          const preview =
            data === undefined
              ? 'void'
              : JSON.stringify(data).slice(0, 300) + (JSON.stringify(data).length > 300 ? '…' : '');
          this.logger.log(`← ${method} ${url} ${ms}ms ${preview}`);
        },
        error: (err: Error & { status?: number }) => {
          const ms = Date.now() - started;
          const msg = `✗ ${method} ${url} ${ms}ms ${err.message}`;
          const isStaleRefresh =
            method === 'POST' && url.includes('/auth/refresh');
          if (isStaleRefresh) {
            this.logger.warn(msg);
          } else {
            this.logger.error(msg);
          }
        },
      }),
    );
  }
}
