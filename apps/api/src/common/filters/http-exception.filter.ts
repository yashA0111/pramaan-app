import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = "Internal server error";
    let kind: string = "error";

    if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === "object" &&
      "message" in exceptionResponse
    ) {
      const msg = (exceptionResponse as any).message;
      message = Array.isArray(msg) ? msg.join(", ") : String(msg);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status === HttpStatus.UNAUTHORIZED) kind = "unauthorized";
    else if (status === HttpStatus.FORBIDDEN) kind = "forbidden";
    else if (status === HttpStatus.NOT_FOUND) kind = "unavailable";
    else if (status === HttpStatus.REQUEST_TIMEOUT) kind = "timeout";
    else if (status >= 500) kind = "network";

    const errorPayload = {
      statusCode: status,
      kind,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.correlationId,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.correlationId}] ${request.method} ${request.url} - ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.correlationId}] ${request.method} ${request.url} - ${status}: ${message}`,
      );
    }

    response.status(status).json(errorPayload);
  }
}
