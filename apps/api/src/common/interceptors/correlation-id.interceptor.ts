import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const correlationId =
      request.headers["x-request-id"] ||
      request.headers["x-correlation-id"] ||
      `req_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

    request.correlationId = correlationId;
    response.setHeader("x-request-id", correlationId);

    return next.handle();
  }
}
