import {
  BadRequestException,
  HttpStatus,
  type ArgumentsHost,
} from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';

interface Captured {
  status?: number;
  body?: unknown;
}

function hostFor(request: Record<string, unknown>): {
  host: ArgumentsHost;
  captured: Captured;
} {
  const captured: Captured = {};

  const response: {
    headersSent: boolean;
    getHeader: () => string;
    status: (code: number) => typeof response;
    json: (body: unknown) => typeof response;
  } = {
    headersSent: false,
    getHeader: () => 'request-id-from-header',
    status: (code: number) => {
      captured.status = code;
      return response;
    },
    json: (body: unknown) => {
      captured.body = body;
      return response;
    },
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, captured };
}

describe('AllExceptionsFilter', () => {
  it('passes a client error through with its own message', () => {
    const filter = new AllExceptionsFilter();
    const { host, captured } = hostFor({
      method: 'POST',
      url: '/v1/auth/login',
      id: 'req-1',
    });

    filter.catch(new BadRequestException('Email is required.'), host);

    expect(captured.status).toBe(HttpStatus.BAD_REQUEST);
    expect(JSON.stringify(captured.body)).toContain('Email is required.');
  });

  it('never leaks internals from an unexpected failure', () => {
    const filter = new AllExceptionsFilter();
    const { host, captured } = hostFor({
      method: 'GET',
      url: '/v1/companies',
      id: 'req-2',
    });

    filter.catch(
      new Error('connect ECONNREFUSED 127.0.0.1:5432 password=hunter2'),
      host,
    );

    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

    const serialised = JSON.stringify(captured.body);
    expect(serialised).toContain('Internal server error');
    // The connection string and credential stay in the log, never the response.
    expect(serialised).not.toContain('ECONNREFUSED');
    expect(serialised).not.toContain('hunter2');
    expect(serialised).not.toContain('5432');
  });

  it('handles a thrown non-Error without crashing', () => {
    const filter = new AllExceptionsFilter();
    const { host, captured } = hostFor({ method: 'GET', url: '/v1/services' });

    filter.catch('something went wrong', host);

    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(captured.body)).toContain('Internal server error');
  });

  it('does not write a second response when headers are already sent', () => {
    const filter = new AllExceptionsFilter();
    const { host, captured } = hostFor({ method: 'GET', url: '/v1/files' });
    const response = host
      .switchToHttp()
      .getResponse<{ headersSent: boolean }>();
    response.headersSent = true;

    filter.catch(new Error('stream already piped'), host);

    expect(captured.status).toBeUndefined();
    expect(captured.body).toBeUndefined();
  });
});
