import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type RequestWithId = Request & { id?: unknown };

/**
 * Catches everything that reaches the edge.
 *
 * Without this, an unhandled error fell through to Nest's default handler:
 * printed unstructured to stdout, attached to no request, and captured
 * nowhere. Now every failure is logged with its request id, so a customer
 * report maps to a specific line.
 *
 * Client errors are logged at warn without a stack — a rejected password is
 * ordinary traffic. Server errors are logged at error with the stack, and the
 * response body says nothing beyond a generic message, so internals are never
 * leaked to a caller.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId =
      typeof request.id === 'string'
        ? request.id
        : response.getHeader('x-request-id');

    if (status >= 500) {
      this.logger.error({
        message: 'Unhandled request failure',
        requestId,
        method: request.method,
        path: request.url?.split('?')[0],
        status,
        error:
          exception instanceof Error
            ? { name: exception.name, message: exception.message }
            : { name: 'UnknownException', message: String(exception) },
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn({
        message: 'Request rejected',
        requestId,
        method: request.method,
        path: request.url?.split('?')[0],
        status,
      });
    }

    if (response.headersSent) {
      return;
    }

    // An HttpException carries a message the caller is meant to see. Anything
    // else is an internal fault, and its details stay in the log.
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    response
      .status(status)
      .json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
  }
}
