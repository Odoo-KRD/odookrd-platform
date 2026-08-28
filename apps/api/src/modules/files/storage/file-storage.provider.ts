import type { Readable } from 'node:stream';

import type { FileStorageProvider } from '../../../generated/prisma/enums';

export interface StoreFileInput {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
  sha256: string;
}

export interface FileStorageProviderAdapter {
  readonly provider: FileStorageProvider;
  put(input: StoreFileInput): Promise<void>;
  open(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
}
