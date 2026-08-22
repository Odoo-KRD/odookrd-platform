export class NotificationProviderError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
    message: string = 'Notification provider request failed.',
  ) {
    super(message);
    this.name = 'NotificationProviderError';
  }
}
